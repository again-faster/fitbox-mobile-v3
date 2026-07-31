import {
	ALL_MEMBER_FEATURES_DISABLED,
	ALL_MEMBER_FEATURES_ENABLED,
	MEMBER_FEATURE_KEYS,
	normalizeMemberFeatureResponse,
} from './memberFeatures';

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
