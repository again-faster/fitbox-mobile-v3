import { Constant } from '@/utils';
import { getValidWSToken, reconcileAppIntentSession } from './auth';

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

export type FeatureStorage = {
	getString: (key: string) => string | undefined;
	set: (key: string, value: string) => unknown;
};

export const memberFeatureCacheKey = (tenantId: string) =>
	`ws:member-features:v1:${tenantId}`;

export const loadCachedMemberFeatures = (
	storage: FeatureStorage,
	tenantId: string,
): MemberFeatureMap | null => {
	const value = storage.getString(memberFeatureCacheKey(tenantId));
	if (!value) return null;
	try {
		return normalizeMemberFeatureResponse(tenantId, JSON.parse(value));
	} catch {
		return null;
	}
};

export const saveCachedMemberFeatures = (
	storage: FeatureStorage,
	tenantId: string,
	features: MemberFeatureMap,
) =>
	storage.set(
		memberFeatureCacheKey(tenantId),
		JSON.stringify({
			ok: true,
			data: { tenant_id: tenantId, features },
		}),
	);

type FetchMemberFeatureDependencies = {
	getToken?: (forceReconcile: boolean) => Promise<string | null>;
	fetcher?: typeof fetch;
	baseUrl?: string;
};

export const fetchMemberFeatures = async (
	tenantId: string,
	deps: FetchMemberFeatureDependencies = {},
): Promise<MemberFeatureMap> => {
	const defaultGetToken = async (forceReconcile: boolean) => {
		if (forceReconcile) await reconcileAppIntentSession(true);
		return getValidWSToken();
	};
	const getToken = deps.getToken ?? defaultGetToken;
	const fetcher = deps.fetcher ?? fetch;
	const baseUrl = deps.baseUrl ?? Constant.WS_MOBILE_API_URL;
	const request = async (forceReconcile: boolean) => {
		const token = await getToken(forceReconcile);
		if (!token) throw new Error('Your Training session has expired.');
		return fetcher(
			`${baseUrl}/features?tenantId=${encodeURIComponent(tenantId)}`,
			{
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
				},
			},
		);
	};

	let response = await request(false);
	if (response.status === 401) response = await request(true);
	if (!response.ok) throw new Error('Unable to load member features.');
	const raw: unknown = await response.json();
	return normalizeMemberFeatureResponse(tenantId, raw);
};
