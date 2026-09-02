import { wsApi, wsRpc } from './api';
import { getStoredWSSession } from './auth';
import { WSApiError } from './errors';
import {
	getMemberNotificationPreferences,
	getMemberNotifications,
	markAllNotificationsRead,
	markNotificationRead,
	normalizeNotificationPreferences,
	registerNotificationDevice,
	setMemberNotificationPreferences,
} from './notifications';

jest.mock('./api', () => ({
	wsApi: jest.fn(),
	wsRpc: jest.fn(),
}));

jest.mock('./auth', () => ({
	getStoredWSSession: jest.fn(),
}));

const mockedWsApi = jest.mocked(wsApi);
const mockedWsRpc = jest.mocked(wsRpc);
const mockedGetStoredWSSession = jest.mocked(getStoredWSSession);

const memberSession = {
	user: {
		id: 'member-1',
		persona: 'member' as const,
		active_tenant_id: 'tenant-1',
	},
};

describe('member notification service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetStoredWSSession.mockReturnValue(memberSession as never);
	});

	it('queries privacy-safe member notifications with the authenticated member id', async () => {
		const json = jest.fn().mockResolvedValue([
			{
				id: 'notification-1',
				title: 'New workout',
				body: 'A workout is ready.',
				kind: 'assignment',
				entity_id: 'workout-1',
				link: null,
				read_at: null,
				created_at: '2026-08-09T00:00:00.000Z',
			},
		]);
		const get = jest.fn().mockReturnValue({ json });
		mockedWsApi.mockReturnValue({ get } as never);

		const notifications = await getMemberNotifications({ limit: 25 });

		expect(get).toHaveBeenCalledWith('notifications', {
			searchParams: {
				select: 'id,title,body,kind,entity_id,link,read_at,created_at',
				user_id: 'eq.member-1',
				order: 'created_at.desc',
				limit: '25',
			},
		});
		expect(notifications).toEqual([
			{
				id: 'notification-1',
				title: 'New workout',
				body: 'A workout is ready.',
				kind: 'assignment',
				entity_id: 'workout-1',
				link: null,
				read_at: null,
				created_at: '2026-08-09T00:00:00.000Z',
			},
		]);
	});

	it('provides read-state helpers through typed server mutations', async () => {
		mockedWsRpc.mockResolvedValue({ ok: true, data: null } as never);

		await markNotificationRead('notification-1');
		await markAllNotificationsRead();

		expect(mockedWsRpc).toHaveBeenNthCalledWith(
			1,
			'mark_notification_read',
			{ p_id: 'notification-1' },
		);
		expect(mockedWsRpc).toHaveBeenNthCalledWith(
			2,
			'mark_all_notifications_read',
			{},
		);
	});

	it('registers a device without sending member identity or notification content', async () => {
		mockedWsRpc.mockResolvedValue({ ok: true, data: null } as never);

		await registerNotificationDevice({
			deviceToken: 'opaque-device-token',
			platform: 'ios',
			deviceId: 'opaque-device-id',
			appVersion: '4.1.4',
		});

		expect(mockedWsRpc).toHaveBeenCalledWith(
			'register_member_notification_device',
			{
				p_device_token: 'opaque-device-token',
				p_platform: 'ios',
				p_device_id: 'opaque-device-id',
				p_app_version: '4.1.4',
			},
		);
		const params = mockedWsRpc.mock.calls[0]?.[1] as Record<
			string,
			unknown
		>;
		expect(params).not.toHaveProperty('p_user_id');
		expect(params).not.toHaveProperty('p_payload');
	});

	it('loads and updates explicit member notification preferences', async () => {
		mockedWsRpc
			.mockResolvedValueOnce({
				ok: true,
				data: {
					training_updates: true,
					coach_notes: false,
					weekly_recap: null,
					readiness_updates: true,
				},
			} as never)
			.mockResolvedValueOnce({ ok: true, data: null } as never);

		const preferences = await getMemberNotificationPreferences();
		await setMemberNotificationPreferences({
			trainingUpdates: false,
			coachNotes: true,
			weeklyRecap: null,
			readinessUpdates: true,
		});

		expect(preferences).toEqual({
			trainingUpdates: true,
			coachNotes: false,
			weeklyRecap: null,
			readinessUpdates: true,
		});
		expect(mockedWsRpc).toHaveBeenNthCalledWith(
			1,
			'get_member_notification_preferences',
			{},
		);
		expect(mockedWsRpc).toHaveBeenNthCalledWith(
			2,
			'set_member_notification_preferences',
			{
				p_preferences: {
					training_updates: false,
					coach_notes: true,
					weekly_recap: null,
					readiness_updates: true,
				},
			},
		);
	});

	it('rejects unauthenticated access and invalid device tokens before querying', async () => {
		mockedGetStoredWSSession.mockReturnValue(null);
		await expect(getMemberNotifications()).rejects.toMatchObject({
			kind: 'unauthorized',
		});

		mockedGetStoredWSSession.mockReturnValue(memberSession as never);
		await expect(
			registerNotificationDevice({
				deviceToken: ' ',
				platform: 'android',
			}),
		).rejects.toMatchObject({ kind: 'unknown' });
		expect(mockedWsRpc).not.toHaveBeenCalled();
	});

	it('normalizes preferences and rejects an invalid server envelope', () => {
		expect(
			normalizeNotificationPreferences({
				ok: true,
				data: {
					training_updates: 'yes',
					coach_notes: false,
					weekly_recap: true,
					readiness_updates: null,
				},
			}),
		).toEqual({
			trainingUpdates: null,
			coachNotes: false,
			weeklyRecap: true,
			readinessUpdates: null,
		});

		expect(() => normalizeNotificationPreferences({ ok: false })).toThrow(
			'notification preferences contract',
		);
	});

	it('returns safe empty results and no-ops when the feature or endpoint is unavailable', async () => {
		await expect(
			getMemberNotifications({ enabled: false }),
		).resolves.toEqual([]);
		expect(mockedWsApi).not.toHaveBeenCalled();

		mockedWsApi.mockReturnValue({
			get: jest.fn().mockReturnValue({
				json: jest
					.fn()
					.mockRejectedValue(
						new WSApiError(
							'not_found',
							'Notifications are unavailable.',
							404,
						),
					),
			}),
		} as never);
		await expect(getMemberNotifications()).resolves.toEqual([]);

		mockedWsRpc.mockRejectedValue(
			new WSApiError('server', 'Notifications are unavailable.', 503),
		);
		await expect(
			registerNotificationDevice({
				deviceToken: 'opaque-device-token',
				platform: 'ios',
			}),
		).resolves.toBeUndefined();
	});
});
