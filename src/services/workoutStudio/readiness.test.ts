import { wsRpc } from './api';
import { getStoredWSSession } from './auth';
import { WSApiError } from './errors';
import {
	createLoadingReadinessResult,
	getMemberReadiness,
	getReadinessState,
	normalizeReadinessSnapshot,
} from './readiness';

jest.mock('./api', () => ({
	wsRpc: jest.fn(),
}));

jest.mock('./auth', () => ({
	getStoredWSSession: jest.fn(),
}));

const mockedWsRpc = jest.mocked(wsRpc);
const mockedGetStoredWSSession = jest.mocked(getStoredWSSession);

const memberSession = {
	user: {
		id: 'member-1',
		persona: 'member' as const,
		active_tenant_id: 'tenant-1',
	},
};

const response = {
	ok: true,
	data: {
		as_of_date: '2026-08-09',
		window_start: '2026-08-06',
		window_end: '2026-08-09',
		has_connection: true,
		metrics: [
			{
				provider: 'apple_health',
				metric_date: '2026-08-09',
				sleep_minutes: 420,
				hrv_ms: null,
				resting_hr: 54,
				recovery_score: null,
				readiness_score: 81,
			},
		],
	},
};

describe('member readiness service', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetStoredWSSession.mockReturnValue(memberSession as never);
	});

	it('returns a ready result without accepting a client user id or date', async () => {
		mockedWsRpc.mockResolvedValue(response as never);

		const result = await getMemberReadiness({ windowDays: 3 });

		expect(mockedWsRpc).toHaveBeenCalledWith('member_readiness_snapshot', {
			p_window_days: 3,
		});
		expect(result).toMatchObject({
			status: 'ready',
			asOfDate: '2026-08-09',
			error: null,
		});
		if (result.status !== 'ready') throw new Error('expected ready result');
		expect(result.data.windowStart).toBe('2026-08-06');
		expect(result.data.windowEnd).toBe('2026-08-09');
		expect(result.data.metrics[0]).toMatchObject({
			provider: 'apple_health',
			sleepMinutes: 420,
			hrvMs: null,
			nativeReadinessScore: 81,
		});
	});

	it('returns typed auth errors before the server query', async () => {
		mockedGetStoredWSSession.mockReturnValueOnce(null);
		await expect(getMemberReadiness()).resolves.toMatchObject({
			status: 'error',
			data: null,
			asOfDate: null,
			error: { kind: 'unauthorized' },
		});

		mockedGetStoredWSSession.mockReturnValueOnce({
			user: { ...memberSession.user, persona: 'coach' },
		} as never);
		await expect(getMemberReadiness()).resolves.toMatchObject({
			status: 'error',
			data: null,
			asOfDate: null,
			error: { kind: 'forbidden' },
		});
		expect(mockedWsRpc).not.toHaveBeenCalled();
	});

	it('provides a loading result shape for screens before the request starts', () => {
		expect(createLoadingReadinessResult()).toEqual({
			status: 'loading',
			data: null,
			error: null,
			asOfDate: null,
		});
	});

	it('keeps server missingness as null instead of turning it into zero', () => {
		const snapshot = normalizeReadinessSnapshot({
			ok: true,
			data: {
				...response.data,
				metrics: [
					{
						provider: 'whoop',
						metric_date: '2026-08-08',
						sleep_minutes: null,
						hrv_ms: null,
						resting_hr: null,
						recovery_score: null,
						readiness_score: null,
					},
				],
			},
		});

		expect(snapshot.metrics[0]).toEqual({
			provider: 'whoop',
			asOfDate: '2026-08-08',
			sleepMinutes: null,
			hrvMs: null,
			restingHr: null,
			nativeRecoveryScore: null,
			nativeReadinessScore: null,
		});
	});

	it('preserves missing or invalid connection state as null', () => {
		const missing = normalizeReadinessSnapshot({
			...response,
			data: { ...response.data, has_connection: undefined },
		});
		const invalid = normalizeReadinessSnapshot({
			...response,
			data: { ...response.data, has_connection: 'unknown' },
		});

		expect(missing.hasConnection).toBeNull();
		expect(invalid.hasConnection).toBeNull();
	});

	it.each([
		['empty', { metrics: [] }],
		[
			'baseline',
			{
				metrics: [
					{
						provider: 'apple_health',
						metric_date: '2026-08-09',
						sleep_minutes: 420,
						hrv_ms: null,
						resting_hr: null,
						recovery_score: null,
						readiness_score: null,
					},
				],
			},
		],
		['ready', response.data],
	])('classifies a %s snapshot without inventing a score', (state, data) => {
		const snapshot = normalizeReadinessSnapshot({
			ok: true,
			data: { ...response.data, ...data },
		});

		expect(getReadinessState(snapshot)).toBe(state);
	});

	it('rejects an unknown provider or missing server-owned date window', () => {
		expect(() =>
			normalizeReadinessSnapshot({
				ok: true,
				data: {
					...response.data,
					window_start: undefined,
					metrics: [],
				},
			}),
		).toThrow('readiness contract');

		expect(() =>
			normalizeReadinessSnapshot({
				ok: true,
				data: {
					...response.data,
					metrics: [
						{ ...response.data.metrics[0], provider: 'unknown' },
					],
				},
			}),
		).toThrow('readiness contract');

		expect(() =>
			normalizeReadinessSnapshot({
				ok: true,
				data: {
					...response.data,
					as_of_date: '2026-02-30',
				},
			}),
		).toThrow('readiness contract');

		expect(() =>
			normalizeReadinessSnapshot({
				ok: true,
				data: {
					...response.data,
					window_end: '2026-08-05',
				},
			}),
		).toThrow('readiness contract');

		expect(() =>
			normalizeReadinessSnapshot({
				ok: true,
				data: {
					...response.data,
					metrics: [
						{
							...response.data.metrics[0],
							metric_date: '2026-08-10',
						},
					],
				},
			}),
		).toThrow('readiness contract');
	});

	it('accepts the supported Strava provider and rejects unsupported Oura', () => {
		const strava = normalizeReadinessSnapshot({
			...response,
			data: {
				...response.data,
				metrics: [{ ...response.data.metrics[0], provider: 'strava' }],
			},
		});

		expect(strava.metrics[0]?.provider).toBe('strava');
		expect(() =>
			normalizeReadinessSnapshot({
				...response,
				data: {
					...response.data,
					metrics: [
						{ ...response.data.metrics[0], provider: 'oura' },
					],
				},
			}),
		).toThrow('readiness contract');
	});

	it('returns empty, baseline, and ready result shapes with server-owned dates', async () => {
		/* eslint-disable no-restricted-syntax, no-await-in-loop */
		for (const [status, data] of [
			['empty', { metrics: [] }],
			[
				'baseline',
				{
					metrics: [
						{
							...response.data.metrics[0],
							readiness_score: null,
							recovery_score: null,
						},
					],
				},
			],
			['ready', response.data],
		] as const) {
			mockedWsRpc.mockResolvedValue({
				...response,
				data: { ...response.data, ...data },
			} as never);

			const result = await getMemberReadiness();
			expect(result.status).toBe(status);
			expect(result.asOfDate).toBe('2026-08-09');
			expect(result.error).toBeNull();
			if (result.status !== 'error' && result.status !== 'loading')
				expect(result.data.windowStart).toBe('2026-08-06');
		}
		/* eslint-enable no-restricted-syntax, no-await-in-loop */
	});

	it('returns typed errors for disabled features and unavailable endpoints', async () => {
		await expect(
			getMemberReadiness({ enabled: false }),
		).resolves.toMatchObject({
			status: 'error',
			data: null,
			asOfDate: null,
			error: { kind: 'feature_disabled' },
		});
		expect(mockedWsRpc).not.toHaveBeenCalled();

		mockedWsRpc.mockRejectedValue(
			new WSApiError('not_found', 'Readiness is unavailable.', 404),
		);
		await expect(getMemberReadiness()).resolves.toMatchObject({
			status: 'error',
			data: null,
			asOfDate: null,
			error: { kind: 'not_found', status: 404 },
		});
	});

	it('redacts unexpected and backend-internal error messages', async () => {
		mockedWsRpc.mockRejectedValueOnce(
			new Error('SQL: member_email=member@example.com; secret=token'),
		);
		const unexpected = await getMemberReadiness();
		expect(unexpected).toMatchObject({
			status: 'error',
			error: {
				code: 'unknown',
				kind: 'unknown',
				message: 'Readiness could not be loaded.',
			},
		});
		expect(
			unexpected.status === 'error' && unexpected.error.message,
		).not.toContain('member@example.com');

		mockedWsRpc.mockRejectedValueOnce(
			new WSApiError('server', 'SQL: internal member data', 503),
		);
		await expect(getMemberReadiness()).resolves.toMatchObject({
			status: 'error',
			error: {
				code: 'server',
				kind: 'server',
				message: 'Readiness is temporarily unavailable.',
				status: 503,
			},
		});
	});
});
