import { mmkvStorage } from '@/storage';
import ky from 'ky';
import {
	WSSession,
	clearWSSession,
	ensureWSSession,
	exchangeForWSSession,
	getStoredWSSession,
	saveWSSession,
	sessionCanBeReused,
} from './auth';

jest.mock('@/storage', () => {
	const values = new Map<string, string | number>();
	return {
		mmkvStorage: {
			delete: jest.fn((key: string) => values.delete(key)),
			getNumber: jest.fn((key: string) => {
				const value = values.get(key);
				return typeof value === 'number' ? value : undefined;
			}),
			getString: jest.fn((key: string) => {
				const value = values.get(key);
				return typeof value === 'string' ? value : undefined;
			}),
			set: jest.fn((key: string, value: string | number) => {
				values.set(key, value);
			}),
			__values: values,
		},
	};
});

jest.mock('@/services/appIntents/credentials', () => ({
	clearAppIntentCredentials: jest.fn().mockResolvedValue(undefined),
	readAppIntentSession: jest.fn().mockResolvedValue(null),
	syncAppIntentCredentials: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('ky', () => ({
	__esModule: true,
	default: {
		post: jest.fn(),
	},
	HTTPError: class HTTPError extends Error {},
}));

type TestStorage = typeof mmkvStorage & {
	__values: Map<string, string | number>;
};

const storage = mmkvStorage as TestStorage;
const mockedPost = jest.mocked(ky.post);

const session = (tenantId = 'tenant-a'): WSSession => ({
	access_token: `access-${tenantId}`,
	refresh_token: `refresh-${tenantId}`,
	expires_at: Math.floor(Date.now() / 1000) + 3600,
	user: {
		id: `user-${tenantId}`,
		email: 'member@example.com',
		full_name: 'Member Example',
		persona: 'member',
		active_tenant_id: tenantId,
		tenant_role: 'member',
	},
});

describe('Workout Studio session gym scoping', () => {
	beforeEach(() => {
		storage.__values.clear();
		jest.clearAllMocks();
	});

	it('only reuses a session when stored and requested gyms match', () => {
		expect(sessionCanBeReused(undefined, undefined)).toBe(true);
		expect(sessionCanBeReused('gym-a', 'gym-a')).toBe(true);
		expect(sessionCanBeReused('gym-a', 'gym-b')).toBe(false);
		expect(sessionCanBeReused(undefined, 'gym-a')).toBe(false);
		expect(sessionCanBeReused('gym-a', undefined)).toBe(false);
	});

	it('updates the stored gym only when a gym argument is supplied', () => {
		saveWSSession(session(), 'gym-a');
		expect(storage.getString('ws_gym_id')).toBe('gym-a');

		saveWSSession(session('tenant-b'));
		expect(storage.getString('ws_gym_id')).toBe('gym-a');

		saveWSSession(session('tenant-c'), null);
		expect(storage.getString('ws_gym_id')).toBeUndefined();
	});

	it('saves the requested gym after a successful exchange and clears it on sign out', async () => {
		mockedPost.mockReturnValue({
			json: jest.fn().mockResolvedValue(session()),
		} as never);

		await exchangeForWSSession({
			email: 'member@example.com',
			fitbox_gym_id: 'gym-a',
		});

		expect(storage.getString('ws_gym_id')).toBe('gym-a');

		clearWSSession();
		expect(storage.getString('ws_gym_id')).toBeUndefined();
	});

	it('reuses a stored session only for the requested gym', async () => {
		saveWSSession(session(), 'gym-a');
		mockedPost.mockReturnValue({
			json: jest.fn().mockResolvedValue(session('tenant-b')),
		} as never);

		const sameGym = await ensureWSSession({
			email: 'member@example.com',
			fitbox_gym_id: 'gym-a',
		});
		const otherGym = await ensureWSSession({
			email: 'member@example.com',
			fitbox_gym_id: 'gym-b',
		});

		expect(sameGym).toEqual({ session: session() });
		expect(otherGym).toEqual({ session: session('tenant-b') });
		expect(mockedPost).toHaveBeenCalledTimes(1);
	});

	it('deduplicates concurrent exchanges for the same email and gym', async () => {
		let resolveSession: ((value: WSSession) => void) | undefined;
		const pendingSession = new Promise<WSSession>(resolve => {
			resolveSession = resolve;
		});
		mockedPost.mockReturnValue({
			json: jest.fn(() => pendingSession),
		} as never);

		const first = ensureWSSession({
			email: 'member@example.com',
			fitbox_gym_id: 'gym-a',
		});
		const second = ensureWSSession({
			email: 'member@example.com',
			fitbox_gym_id: 'gym-a',
		});

		expect(mockedPost).toHaveBeenCalledTimes(1);
		resolveSession?.(session());
		await expect(Promise.all([first, second])).resolves.toEqual([
			{ session: session() },
			{ session: session() },
		]);
	});

	it('does not persist an old gym when its exchange resolves after the current gym', async () => {
		let resolveGymA: ((value: WSSession) => void) | undefined;
		let resolveGymB: ((value: WSSession) => void) | undefined;
		const gymAResponse = new Promise<WSSession>(resolve => {
			resolveGymA = resolve;
		});
		const gymBResponse = new Promise<WSSession>(resolve => {
			resolveGymB = resolve;
		});
		mockedPost
			.mockReturnValueOnce({
				json: jest.fn(() => gymAResponse),
			} as never)
			.mockReturnValueOnce({
				json: jest.fn(() => gymBResponse),
			} as never);

		const oldGymExchange = ensureWSSession({
			email: 'member@example.com',
			fitbox_gym_id: 'gym-a',
		});
		const currentGymExchange = ensureWSSession({
			email: 'member@example.com',
			fitbox_gym_id: 'gym-b',
		});

		resolveGymB?.(session('tenant-b'));
		await expect(currentGymExchange).resolves.toEqual({
			session: session('tenant-b'),
		});
		resolveGymA?.(session('tenant-a'));
		await oldGymExchange;

		expect(storage.getString('ws_gym_id')).toBe('gym-b');
		expect(getStoredWSSession()).toEqual(session('tenant-b'));
		await expect(
			ensureWSSession({
				email: 'member@example.com',
				fitbox_gym_id: 'gym-b',
			}),
		).resolves.toEqual({ session: session('tenant-b') });
		expect(mockedPost).toHaveBeenCalledTimes(2);
	});
});
