/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/no-unsafe-member-access */

import {
	ALL_MEMBER_FEATURES_DISABLED,
	ALL_MEMBER_FEATURES_ENABLED,
	MEMBER_FEATURE_KEYS,
	fetchMemberFeatures,
	loadCachedMemberFeatures,
	memberFeatureCacheKey,
	normalizeMemberFeatureResponse,
	saveCachedMemberFeatures,
} from './memberFeatures';
import { getValidWSToken, reconcileAppIntentSession } from './auth';

jest.mock('./auth', () => ({
	getValidWSToken: jest.fn(),
	reconcileAppIntentSession: jest.fn(),
}));

const mockedGetValidWSToken = jest.mocked(getValidWSToken);
const mockedReconcileAppIntentSession = jest.mocked(reconcileAppIntentSession);

describe('member feature contract', () => {
	it('declares exactly the 22 stable server keys', () => {
		expect(MEMBER_FEATURE_KEYS).toEqual([
			'custom_workouts',
			'results',
			'my_maxes',
			'prs',
			'progress',
			'benchmarks',
			'training_profile',
			'challenges',
			'digest',
			'badges',
			'adaptive_goals',
			'feed',
			'streaks',
			'wellness',
			'pain_reports',
			'wearables',
			'bookings',
			'my_bookings',
			'marketplace',
			'subscriptions',
			'coach_notes',
			'classes',
		]);
	});

	it('normalizes a valid response and fails closed for missing or non-true keys', () => {
		const result = normalizeMemberFeatureResponse('tenant-1', {
			ok: true,
			data: {
				tenant_id: 'tenant-1',
				features: {
					classes: true,
					bookings: false,
					results: 'true',
				},
			},
		});

		expect(result.classes).toBe(true);
		expect(result.bookings).toBe(false);
		expect(result.results).toBe(false);
		expect(result.prs).toBe(false);
		expect(Object.keys(result)).toEqual(MEMBER_FEATURE_KEYS);
	});

	it.each([
		undefined,
		null,
		{},
		{ ok: false, data: {} },
		{ ok: true },
		{ ok: true, data: [] },
		{ ok: true, data: { tenant_id: 'tenant-1' } },
		{
			ok: true,
			data: { tenant_id: 'tenant-1', features: 'classes' },
		},
		{ ok: true, data: { tenant_id: 'tenant-1', features: [] } },
	])('rejects an invalid response envelope: %p', raw => {
		expect(() => normalizeMemberFeatureResponse('tenant-1', raw)).toThrow(
			'invalid feature response',
		);
	});

	it('rejects a response for another tenant', () => {
		expect(() =>
			normalizeMemberFeatureResponse('tenant-1', {
				ok: true,
				data: {
					tenant_id: 'tenant-2',
					features: { classes: true },
				},
			}),
		).toThrow('tenant mismatch');
	});

	it('provides distinct all-enabled and all-disabled maps', () => {
		expect(Object.values(ALL_MEMBER_FEATURES_ENABLED).every(Boolean)).toBe(
			true,
		);
		expect(Object.values(ALL_MEMBER_FEATURES_DISABLED).some(Boolean)).toBe(
			false,
		);
		expect(ALL_MEMBER_FEATURES_ENABLED).not.toBe(
			ALL_MEMBER_FEATURES_DISABLED,
		);
	});
});

describe('member feature cache', () => {
	const createStorage = () => {
		const values = new Map<string, string>();
		return {
			values,
			storage: {
				getString: (key: string) => values.get(key),
				set: (key: string, value: string) => values.set(key, value),
			},
		};
	};

	it('uses a different versioned cache key for each tenant', () => {
		expect(memberFeatureCacheKey('tenant-a')).toBe(
			'ws:member-features:v1:tenant-a',
		);
		expect(memberFeatureCacheKey('tenant-a')).not.toBe(
			memberFeatureCacheKey('tenant-b'),
		);
	});

	it('round trips valid cached member features', () => {
		const { storage, values } = createStorage();
		const features = {
			...ALL_MEMBER_FEATURES_DISABLED,
			classes: true,
		};

		saveCachedMemberFeatures(storage, 'tenant-a', features);

		expect(
			JSON.parse(values.get(memberFeatureCacheKey('tenant-a')) ?? ''),
		).toEqual({
			ok: true,
			data: { tenant_id: 'tenant-a', features },
		});
		expect(loadCachedMemberFeatures(storage, 'tenant-a')).toEqual(features);
	});

	it('isolates cached flags by tenant', () => {
		const { storage } = createStorage();
		saveCachedMemberFeatures(storage, 'tenant-a', {
			...ALL_MEMBER_FEATURES_ENABLED,
			classes: false,
		});

		expect(loadCachedMemberFeatures(storage, 'tenant-a')?.classes).toBe(
			false,
		);
		expect(loadCachedMemberFeatures(storage, 'tenant-b')).toBeNull();
	});

	it.each([
		'not json',
		JSON.stringify({
			ok: true,
			data: {
				tenant_id: 'tenant-a',
				features: 'classes',
			},
		}),
		JSON.stringify({
			ok: true,
			data: {
				tenant_id: 'tenant-b',
				features: { classes: true },
			},
		}),
	])('returns null for malformed cached data: %s', value => {
		const { storage, values } = createStorage();
		values.set(memberFeatureCacheKey('tenant-a'), value);

		expect(loadCachedMemberFeatures(storage, 'tenant-a')).toBeNull();
	});
});

describe('member feature API', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('fetches an encoded tenant with the bearer token and JSON accept header', async () => {
		const fetcher = jest.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: async () => ({
				ok: true,
				data: {
					tenant_id: 'tenant a/b',
					features: { classes: true },
				},
			}),
		});

		const result = await fetchMemberFeatures('tenant a/b', {
			getToken: async () => 'token',
			fetcher: fetcher as typeof fetch,
			baseUrl: 'https://studio.test/api/public/mobile',
		});

		expect(fetcher).toHaveBeenCalledWith(
			'https://studio.test/api/public/mobile/features?tenantId=tenant%20a%2Fb',
			{
				method: 'GET',
				headers: {
					Authorization: 'Bearer token',
					Accept: 'application/json',
				},
			},
		);
		expect(result.classes).toBe(true);
	});

	it('retries one 401 with a reconciled token and makes exactly two requests', async () => {
		const getToken = jest
			.fn()
			.mockResolvedValueOnce('stale-token')
			.mockResolvedValueOnce('fresh-token');
		const fetcher = jest
			.fn()
			.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({}),
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					ok: true,
					data: {
						tenant_id: 'tenant-a',
						features: { classes: true },
					},
				}),
			});

		await fetchMemberFeatures('tenant-a', {
			getToken,
			fetcher: fetcher as typeof fetch,
			baseUrl: 'https://studio.test/api/public/mobile',
		});

		expect(getToken).toHaveBeenNthCalledWith(1, false);
		expect(getToken).toHaveBeenNthCalledWith(2, true);
		expect(getToken).toHaveBeenCalledTimes(2);
		expect(fetcher).toHaveBeenCalledTimes(2);
		expect(fetcher.mock.calls[1]?.[1]?.headers).toEqual({
			Authorization: 'Bearer fresh-token',
			Accept: 'application/json',
		});
	});

	it('reconciles App Intent before reading the default retry token', async () => {
		mockedGetValidWSToken
			.mockResolvedValueOnce('stale-token')
			.mockResolvedValueOnce('fresh-token');
		mockedReconcileAppIntentSession.mockResolvedValue(null);
		const fetcher = jest
			.fn()
			.mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({}),
			})
			.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					ok: true,
					data: {
						tenant_id: 'tenant-a',
						features: { classes: true },
					},
				}),
			});

		await fetchMemberFeatures('tenant-a', {
			fetcher: fetcher as typeof fetch,
			baseUrl: 'https://studio.test/api/public/mobile',
		});

		expect(mockedReconcileAppIntentSession).toHaveBeenCalledWith(true);
		expect(
			mockedReconcileAppIntentSession.mock.invocationCallOrder[0],
		).toBeLessThan(mockedGetValidWSToken.mock.invocationCallOrder[1] ?? 0);
	});

	it('throws an expired-session error when no token is available', async () => {
		const fetcher = jest.fn();

		await expect(
			fetchMemberFeatures('tenant-a', {
				getToken: async () => null,
				fetcher: fetcher as typeof fetch,
				baseUrl: 'https://studio.test/api/public/mobile',
			}),
		).rejects.toThrow('Your Training session has expired.');
		expect(fetcher).not.toHaveBeenCalled();
	});

	it('throws the member-feature outage message for a non-ok response', async () => {
		const fetcher = jest.fn().mockResolvedValue({
			ok: false,
			status: 503,
		});

		await expect(
			fetchMemberFeatures('tenant-a', {
				getToken: async () => 'token',
				fetcher: fetcher as typeof fetch,
				baseUrl: 'https://studio.test/api/public/mobile',
			}),
		).rejects.toThrow('Unable to load member features.');
		expect(fetcher).toHaveBeenCalledTimes(1);
	});

	it('propagates a network failure without retrying', async () => {
		const fetcher = jest
			.fn()
			.mockRejectedValue(new Error('network offline'));

		await expect(
			fetchMemberFeatures('tenant-a', {
				getToken: async () => 'token',
				fetcher: fetcher as typeof fetch,
				baseUrl: 'https://studio.test/api/public/mobile',
			}),
		).rejects.toThrow('network offline');
		expect(fetcher).toHaveBeenCalledTimes(1);
	});
});
