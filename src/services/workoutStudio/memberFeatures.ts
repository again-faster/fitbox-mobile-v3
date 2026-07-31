export const MEMBER_FEATURE_KEYS = [
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
] as const;

export type MemberFeature = (typeof MEMBER_FEATURE_KEYS)[number];
export type MemberFeatureMap = Record<MemberFeature, boolean>;

export const ALL_MEMBER_FEATURES_ENABLED = Object.fromEntries(
	MEMBER_FEATURE_KEYS.map(key => [key, true]),
) as MemberFeatureMap;

export const ALL_MEMBER_FEATURES_DISABLED = Object.fromEntries(
	MEMBER_FEATURE_KEYS.map(key => [key, false]),
) as MemberFeatureMap;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export const normalizeMemberFeatureResponse = (
	requestedTenantId: string,
	raw: unknown,
): MemberFeatureMap => {
	if (
		!isRecord(raw) ||
		raw.ok !== true ||
		!isRecord(raw.data) ||
		!isRecord(raw.data.features)
	)
		throw new Error('invalid feature response');
	if (raw.data.tenant_id !== requestedTenantId)
		throw new Error('feature response tenant mismatch');
	const source = raw.data.features;
	return Object.fromEntries(
		MEMBER_FEATURE_KEYS.map(key => [key, source[key] === true]),
	) as MemberFeatureMap;
};
