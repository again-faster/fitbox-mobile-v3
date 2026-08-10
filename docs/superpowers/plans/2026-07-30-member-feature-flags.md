# Mobile Member Feature Flags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `fitbox-mobile-v3` consume, cache, and enforce Workout Studio member feature flags consistently across navigation, deep links, result logging, wellbeing, and service-booking surfaces.

**Architecture:** A single provider above the main navigator owns the deduplicated Workout Studio session and the active tenant's cached feature map. Pure contract/cache/route-mapping modules keep policy testable; screen guards and query-level checks prevent disabled features from flashing or fetching. The first-ever fallback is explicitly all-enabled, while successful server payloads are normalized fail-closed and cached per tenant.

**Tech Stack:** React Native 0.76, TypeScript, React Context, TanStack Query, React Navigation, MMKV, Jest, Testing Library.

---

## File Structure

Create these focused units:

- `src/services/workoutStudio/memberFeatures.ts` — stable 22-key contract, envelope validation, API call, and tenant-scoped cache helpers.
- `src/services/workoutStudio/memberFeatures.test.ts` — contract, API, fallback, cache, and tenant-isolation tests.
- `src/context/WorkoutStudioProvider.tsx` — shared Workout Studio session and feature refresh lifecycle.
- `src/context/WorkoutStudioProvider.test.tsx` — provider bootstrap, cache-first rendering, gym change, and foreground refresh tests.
- `src/screens/Training/features/memberFeatureRoutes.ts` — pure feature-to-route and composite visibility policy.
- `src/screens/Training/features/memberFeatureRoutes.test.ts` — route and composite policy tests.
- `src/screens/Training/components/MemberFeatureGate.tsx` — reusable disabled-feature state for deep links.
- `src/screens/Training/components/MemberFeatureGate.test.tsx` — gate rendering and enabled-child tests.

Modify these existing units:

- `src/services/workoutStudio/auth.ts` — store the Fitbox gym identity associated with the Workout Studio session and deduplicate exchanges.
- `src/screens/Training/hooks/useWSAuth.ts` — consume the shared provider instead of owning a second bootstrap.
- `src/App.tsx` — install the provider inside `AuthProvider` and above navigation.
- `src/navigators/Application.tsx` — conditionally expose the class Calendar tab and guard class/session routes.
- `src/navigators/DashboardStack.tsx` and `src/screens/Dashboard/Dashboard.tsx` — gate class booking/session entry points with `classes`.
- `src/navigators/TrainingStack.tsx` — guard feature-only Training routes.
- `src/screens/Training/More/TrainingMore.tsx` — filter feature rows and composite groups.
- `src/screens/Training/Workouts/WorkoutDetail.tsx` and `src/screens/Training/Workouts/RunWorkout.tsx` — preserve workout reading while suppressing result creation and scoring.
- `src/screens/Training/Progress/Progress.tsx` — filter queries, KPI content, links, and recent activity independently.
- `src/screens/Training/Wellness/Wellness.tsx` — prevent disabled wellness queries, writes, and offline synchronization.
- `src/screens/Training/Bookings/BookingsHub.tsx` — independently filter service creation and booking history.
- `src/services/workoutStudio/bookings.ts` — recognize the future `feature_disabled` server response.

Web migration and endpoint enforcement are not changed from this stale local checkout. The reviewed gaps remain documented in `docs/superpowers/specs/2026-07-30-member-feature-flags-design.md` for a separate Lovable/server change.

---

### Task 1: Define and validate the feature contract

**Files:**
- Create: `src/services/workoutStudio/memberFeatures.ts`
- Create: `src/services/workoutStudio/memberFeatures.test.ts`

- [ ] **Step 1: Write failing contract and normalization tests**

```ts
import {
	ALL_MEMBER_FEATURES_ENABLED,
	MEMBER_FEATURE_KEYS,
	normalizeMemberFeatureResponse,
} from './memberFeatures';

describe('member feature contract', () => {
	it('declares all 22 server keys', () => {
		expect(MEMBER_FEATURE_KEYS).toHaveLength(22);
		expect(MEMBER_FEATURE_KEYS).toEqual(
			expect.arrayContaining(['classes', 'bookings', 'my_bookings', 'results']),
		);
	});

	it('normalizes a valid response and fails closed for missing known keys', () => {
		const result = normalizeMemberFeatureResponse('tenant-1', {
			ok: true,
			data: { tenant_id: 'tenant-1', features: { classes: true } },
		});
		expect(result.classes).toBe(true);
		expect(result.results).toBe(false);
	});

	it('rejects a response for another tenant', () => {
		expect(() =>
			normalizeMemberFeatureResponse('tenant-1', {
				ok: true,
				data: { tenant_id: 'tenant-2', features: { classes: true } },
			}),
		).toThrow('tenant mismatch');
	});

	it('uses a distinct all-enabled first-load fallback', () => {
		expect(Object.values(ALL_MEMBER_FEATURES_ENABLED).every(Boolean)).toBe(true);
	});
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm test -- --runInBand src/services/workoutStudio/memberFeatures.test.ts
```

Expected: FAIL because `memberFeatures.ts` does not exist.

- [ ] **Step 3: Implement the stable keys, types, fallback, and strict normalizer**

```ts
export const MEMBER_FEATURE_KEYS = [
	'custom_workouts', 'results', 'my_maxes', 'prs', 'progress',
	'benchmarks', 'training_profile', 'challenges', 'digest', 'badges',
	'adaptive_goals', 'feed', 'streaks', 'wellness', 'pain_reports',
	'wearables', 'bookings', 'my_bookings', 'marketplace', 'subscriptions',
	'coach_notes', 'classes',
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
	if (!isRecord(raw) || raw.ok !== true || !isRecord(raw.data))
		throw new Error('invalid feature response');
	if (raw.data.tenant_id !== requestedTenantId)
		throw new Error('feature response tenant mismatch');
	const source = isRecord(raw.data.features) ? raw.data.features : {};
	return Object.fromEntries(
		MEMBER_FEATURE_KEYS.map(key => [key, source[key] === true]),
	) as MemberFeatureMap;
};
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Step 2 command. Expected: PASS, 4 tests.

- [ ] **Step 5: Commit the contract**

```powershell
git add src/services/workoutStudio/memberFeatures.ts src/services/workoutStudio/memberFeatures.test.ts
git commit -m "feat(training): define member feature contract"
```

---

### Task 2: Add tenant-scoped caching and the features API client

**Files:**
- Modify: `src/services/workoutStudio/memberFeatures.ts`
- Modify: `src/services/workoutStudio/memberFeatures.test.ts`

- [ ] **Step 1: Add failing cache, fetch, and outage tests**

```ts
import {
	fetchMemberFeatures,
	loadCachedMemberFeatures,
	memberFeatureCacheKey,
	saveCachedMemberFeatures,
} from './memberFeatures';

it('isolates cached flags by tenant', () => {
	const values = new Map<string, string>();
	const storage = {
		getString: (key: string) => values.get(key),
		set: (key: string, value: string) => values.set(key, value),
	};
	saveCachedMemberFeatures(storage, 'tenant-a', {
		...ALL_MEMBER_FEATURES_ENABLED,
		classes: false,
	});
	expect(loadCachedMemberFeatures(storage, 'tenant-a')?.classes).toBe(false);
	expect(loadCachedMemberFeatures(storage, 'tenant-b')).toBeNull();
	expect(memberFeatureCacheKey('tenant-a')).not.toBe(memberFeatureCacheKey('tenant-b'));
});

it('fetches with the Workout Studio bearer token', async () => {
	const fetcher = jest.fn().mockResolvedValue({
		ok: true,
		json: async () => ({
			ok: true,
			data: { tenant_id: 'tenant-a', features: { classes: true } },
		}),
	});
	const result = await fetchMemberFeatures('tenant-a', {
		getToken: async () => 'token',
		fetcher: fetcher as typeof fetch,
		baseUrl: 'https://studio.test/api/public/mobile',
	});
	expect(fetcher).toHaveBeenCalledWith(
		'https://studio.test/api/public/mobile/features?tenantId=tenant-a',
		expect.objectContaining({ headers: { Authorization: 'Bearer token', Accept: 'application/json' } }),
	);
	expect(result.classes).toBe(true);
});

it('reconciles the shared session and retries once after a 401', async () => {
	const getToken = jest.fn()
		.mockResolvedValueOnce('stale-token')
		.mockResolvedValueOnce('fresh-token');
	const fetcher = jest.fn()
		.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) })
		.mockResolvedValueOnce({
			ok: true,
			status: 200,
			json: async () => ({
				ok: true,
				data: { tenant_id: 'tenant-a', features: { classes: true } },
			}),
		});

	await fetchMemberFeatures('tenant-a', {
		getToken,
		fetcher: fetcher as typeof fetch,
		baseUrl: 'https://studio.test/api/public/mobile',
	});

	expect(getToken).toHaveBeenNthCalledWith(1, false);
	expect(getToken).toHaveBeenNthCalledWith(2, true);
	expect(fetcher).toHaveBeenCalledTimes(2);
	expect(fetcher.mock.calls[1][1]?.headers).toEqual({
		Authorization: 'Bearer fresh-token',
		Accept: 'application/json',
	});
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run the Task 1 test command. Expected: FAIL because cache/fetch exports are missing.

- [ ] **Step 3: Implement versioned cache helpers and dependency-injected fetch**

```ts
import { Constant } from '@/utils';
import { getValidWSToken, reconcileAppIntentSession } from './auth';

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
) => storage.set(
	memberFeatureCacheKey(tenantId),
	JSON.stringify({ ok: true, data: { tenant_id: tenantId, features } }),
);

export const fetchMemberFeatures = async (
	tenantId: string,
	deps: {
		getToken?: (forceReconcile: boolean) => Promise<string | null>;
		fetcher?: typeof fetch;
		baseUrl?: string;
	} = {},
) => {
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
			{ headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
		);
	};
	let response = await request(false);
	if (response.status === 401) response = await request(true);
	const raw = await response.json();
	if (!response.ok) throw new Error('Unable to load member features.');
	return normalizeMemberFeatureResponse(tenantId, raw);
};
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Task 1 command. Expected: PASS.

- [ ] **Step 5: Commit the data layer**

```powershell
git add src/services/workoutStudio/memberFeatures.ts src/services/workoutStudio/memberFeatures.test.ts
git commit -m "feat(training): cache and fetch member features"
```

---

### Task 3: Centralize Workout Studio session bootstrap and feature refresh

**Files:**
- Create: `src/context/WorkoutStudioProvider.tsx`
- Create: `src/context/WorkoutStudioProvider.test.tsx`
- Modify: `src/services/workoutStudio/auth.ts`
- Create: `src/services/workoutStudio/auth.test.ts`
- Modify: `src/screens/Training/hooks/useWSAuth.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write failing provider tests for cache-first state and tenant switching**

Use Testing Library with `AuthContext.Provider`, an in-memory storage double, and injected service functions:

```tsx
import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import useAuth from '@/auth/hooks/useAuth';
import type { ExchangeParams, WSSession } from '@/services/workoutStudio/auth';
import {
	ALL_MEMBER_FEATURES_ENABLED,
	type MemberFeatureMap,
	saveCachedMemberFeatures,
} from '@/services/workoutStudio/memberFeatures';
import {
	WorkoutStudioProvider,
	useWorkoutStudio,
} from './WorkoutStudioProvider';

jest.mock('@/auth/hooks/useAuth');
const mockedUseAuth = jest.mocked(useAuth);

const session = (tenantId: string): WSSession => ({
	access_token: 'access',
	refresh_token: 'refresh',
	expires_at: Date.now() / 1000 + 3600,
	user: {
		id: 'user-1', email: 'member@example.com', full_name: 'Member One',
		persona: 'member', active_tenant_id: tenantId, tenant_role: 'athlete',
	},
});

const authUser = (gymId: string) => ({
	user_data: {
		email: 'member@example.com', user_id: 101,
		first_name: 'Member', last_name: 'One', onboarding_gym_ids: [gymId],
	},
});

const memoryStorage = () => {
	const values = new Map<string, string>();
	return {
		getString: (key: string) => values.get(key),
		set: (key: string, value: string) => values.set(key, value),
		delete: (key: string) => values.delete(key),
	};
};

it('renders cached flags immediately and replaces them after refresh', async () => {
	const storage = memoryStorage();
	const cached = { ...ALL_MEMBER_FEATURES_ENABLED, classes: false };
	const fresh = { ...ALL_MEMBER_FEATURES_ENABLED, classes: true };
	saveCachedMemberFeatures(storage, 'tenant-a', cached);
	mockedUseAuth.mockReturnValue(authUser('gym-a') as unknown as ReturnType<typeof useAuth>);
	let resolveRefresh!: (features: MemberFeatureMap) => void;
	const services = {
		ensureSession: jest.fn().mockResolvedValue({ session: session('tenant-a') }),
		fetchFeatures: jest.fn(() => new Promise<MemberFeatureMap>(resolve => {
			resolveRefresh = resolve;
		})),
	};
	const wrapper = ({ children }: PropsWithChildren) => (
		<WorkoutStudioProvider storage={storage} services={services}>
			{children}
		</WorkoutStudioProvider>
	);
	const { result } = renderHook(() => useWorkoutStudio(), { wrapper });
	await waitFor(() => expect(result.current.tenantId).toBe('tenant-a'));
	expect(result.current.featureSource).toBe('cache');
	expect(result.current.features).toEqual(cached);
	await act(async () => resolveRefresh(fresh));
	await waitFor(() => expect(result.current.features).toEqual(fresh));
	expect(result.current.featureSource).toBe('network');
});

it('loads tenant-b flags after the active gym changes', async () => {
	const storage = memoryStorage();
	mockedUseAuth.mockReturnValue(authUser('gym-a') as unknown as ReturnType<typeof useAuth>);
	const services = {
		ensureSession: jest.fn(async ({ fitbox_gym_id }: ExchangeParams) =>
			({ session: session(fitbox_gym_id === 'gym-a' ? 'tenant-a' : 'tenant-b') })),
		fetchFeatures: jest.fn(async (tenantId: string) => ({
			...ALL_MEMBER_FEATURES_ENABLED,
			classes: tenantId === 'tenant-a',
		})),
	};
	const wrapper = ({ children }: PropsWithChildren) => (
		<WorkoutStudioProvider storage={storage} services={services}>
			{children}
		</WorkoutStudioProvider>
	);
	const hook = renderHook(() => useWorkoutStudio(), { wrapper });
	await waitFor(() => expect(hook.result.current.tenantId).toBe('tenant-a'));
	mockedUseAuth.mockReturnValue(authUser('gym-b') as unknown as ReturnType<typeof useAuth>);
	act(() => hook.rerender());
	await waitFor(() => expect(hook.result.current.tenantId).toBe('tenant-b'));
	expect(hook.result.current.features.classes).toBe(false);
});

it('fails open only when there is no successful cache yet', async () => {
	const storage = memoryStorage();
	mockedUseAuth.mockReturnValue(authUser('gym-a') as unknown as ReturnType<typeof useAuth>);
	const wrapper = ({ children }: PropsWithChildren) => (
		<WorkoutStudioProvider
			storage={storage}
			services={{
				ensureSession: jest.fn().mockResolvedValue({ session: session('tenant-a') }),
				fetchFeatures: jest.fn().mockRejectedValue(new Error('offline')),
			}}>
			{children}
		</WorkoutStudioProvider>
	);
	const { result } = renderHook(() => useWorkoutStudio(), { wrapper });
	await waitFor(() => expect(result.current.tenantId).toBe('tenant-a'));
	expect(result.current.featureSource).toBe('first-load');
	expect(Object.values(result.current.features).every(Boolean)).toBe(true);
});

it('does not apply member flags to coach or gym-admin personas', async () => {
	const storage = memoryStorage();
	const coachSession = {
		...session('tenant-a'),
		user: { ...session('tenant-a').user, persona: 'coach' as const },
	};
	mockedUseAuth.mockReturnValue(authUser('gym-a') as unknown as ReturnType<typeof useAuth>);
	const wrapper = ({ children }: PropsWithChildren) => (
		<WorkoutStudioProvider
			storage={storage}
			services={{
				ensureSession: jest.fn().mockResolvedValue({ session: coachSession }),
				fetchFeatures: jest.fn().mockResolvedValue({
					...ALL_MEMBER_FEATURES_ENABLED,
					classes: false,
				}),
			}}>
			{children}
		</WorkoutStudioProvider>
	);
	const { result } = renderHook(() => useWorkoutStudio(), { wrapper });
	await waitFor(() => expect(result.current.state.status).toBe('authenticated'));
	expect(result.current.isEnabled('classes')).toBe(true);
});
```

- [ ] **Step 2: Run the provider test and verify RED**

```powershell
npm test -- --runInBand src/context/WorkoutStudioProvider.test.tsx
```

Expected: FAIL because the provider and hook do not exist.

- [ ] **Step 3: Make session reuse gym-aware and deduplicate exchange calls**

In `auth.ts`, export the existing parameter type, add `GYM_ID: 'ws_gym_id'` to `KEYS`, save `params.fitbox_gym_id`, and expose `sessionCanBeReused` plus a gym-keyed deduplicated bootstrap:

```ts
export type ExchangeParams = {
	email: string;
	fitbox_gym_id?: string;
	fitbox_member_id?: string;
	full_name?: string;
};

export type WSSessionResult =
	| { session: WSSession }
	| { error: WSAuthError };
```

```ts
const ensureSessionInFlight = new Map<string, Promise<WSSessionResult>>();

export const sessionCanBeReused = (
	storedGymId: string | null,
	requestedGymId: string | null,
) => storedGymId === requestedGymId;

export const ensureWSSession = async (params: ExchangeParams) => {
	const stored = getStoredWSSession();
	const storedGymId = mmkvStorage.getString(KEYS.GYM_ID) ?? null;
	const requestedGymId = params.fitbox_gym_id ?? null;
	if (stored && storedGymId === requestedGymId) return { session: stored };
	const exchangeKey = requestedGymId ?? `no-gym:${params.email}`;
	const existing = ensureSessionInFlight.get(exchangeKey);
	if (existing) return existing;
	const pending = exchangeForWSSession(params)
		.finally(() => ensureSessionInFlight.delete(exchangeKey));
	ensureSessionInFlight.set(exchangeKey, pending);
	return pending;
};
```

Change session persistence so an exchange records its gym, while token refreshes preserve the already stored gym:

```ts
export const saveWSSession = (
	session: WSSession,
	gymId?: string | null,
) => {
	// existing token/user writes
	if (gymId !== undefined) {
		if (gymId === null) mmkvStorage.delete(KEYS.GYM_ID);
		else mmkvStorage.set(KEYS.GYM_ID, gymId);
	}
	// existing app-intent credential synchronization
};

// In both successful exchange attempts:
saveWSSession(session, params.fitbox_gym_id ?? null);
```

Because `clearWSSession` already deletes every value in `KEYS`, adding `GYM_ID` also clears the identity. Add this test to `src/services/workoutStudio/auth.test.ts` before implementing the helper:

```ts
expect(sessionCanBeReused('gym-a', 'gym-a')).toBe(true);
expect(sessionCanBeReused('gym-a', 'gym-b')).toBe(false);
expect(sessionCanBeReused(null, 'gym-a')).toBe(false);
```

- [ ] **Step 4: Implement `WorkoutStudioProvider`**

The context value must be:

```ts
export type WSAuthState =
	| { status: 'loading' }
	| { status: 'authenticated'; session: WSSession }
	| { status: 'not_found' }
	| { status: 'no_membership' }
	| { status: 'unknown_gym' }
	| { status: 'provision_failed' }
	| { status: 'error' };

type WorkoutStudioContextValue = {
	state: WSAuthState;
	tenantId: string | null;
	features: MemberFeatureMap;
	featureSource: 'first-load' | 'cache' | 'network';
	isEnabled: (feature: MemberFeature) => boolean;
	refreshFeatures: () => Promise<void>;
	retrySession: () => Promise<void>;
	signOut: () => void;
};
```

Map `WSSessionResult.error` back to the existing `not_found`, `no_membership`, `unknown_gym`, `provision_failed`, or generic `error` states so centralizing bootstrap does not remove current error UX. On authenticated member state, load the tenant cache synchronously, then fetch and persist. Subscribe to `AppState` and refresh when transitioning to `active` after five minutes. Keep current features on any refresh error. If the session persona is `coach` or `gym_admin`, `isEnabled` must return `true` and no member surface may be hidden. A `solo` session also remains all-enabled because it has no member-gym feature contract.

`WorkoutStudioProvider` accepts optional dependencies without changing its public context API:

```ts
type WorkoutStudioServices = {
	ensureSession: typeof ensureWSSession;
	fetchFeatures: typeof fetchMemberFeatures;
};

type WorkoutStudioProviderProps = PropsWithChildren<{
	storage: FeatureStorage;
	services?: WorkoutStudioServices;
}>;
```

Merge injected services with production defaults rather than requiring every test to supply both:

```ts
const resolvedServices: WorkoutStudioServices = {
	ensureSession: services?.ensureSession ?? ensureWSSession,
	fetchFeatures: services?.fetchFeatures ?? fetchMemberFeatures,
};

const flagsApply =
	state.status === 'authenticated' && state.session.user.persona === 'member';
const isEnabled = (feature: MemberFeature) =>
	!flagsApply || features[feature];
```

- [ ] **Step 5: Install the provider and remove duplicate hook ownership**

In `App.tsx`, wrap `ApplicationNavigator` inside `WorkoutStudioProvider` but inside `AuthProvider`:

```tsx
<AuthProvider storage={mmkvStorage}>
	<WorkoutStudioProvider storage={mmkvStorage}>
		{/* existing ThemeProvider and navigation tree */}
	</WorkoutStudioProvider>
</AuthProvider>
```

Replace `useWSAuth` implementation with:

```ts
import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';

export const useWSAuth = () => {
	const { state, retrySession, signOut } = useWorkoutStudio();
	return { state, retry: retrySession, signOut };
};
```

- [ ] **Step 6: Run focused tests and type-check**

```powershell
npm test -- --runInBand src/context/WorkoutStudioProvider.test.tsx src/services/workoutStudio/memberFeatures.test.ts src/services/workoutStudio/auth.test.ts
npm run check-types
```

Expected: provider and contract suites PASS; TypeScript exits 0.

- [ ] **Step 7: Commit the provider**

```powershell
git add src/context/WorkoutStudioProvider.tsx src/context/WorkoutStudioProvider.test.tsx src/services/workoutStudio/auth.ts src/services/workoutStudio/auth.test.ts src/screens/Training/hooks/useWSAuth.ts src/App.tsx
git commit -m "feat(training): provide tenant member features"
```

---

### Task 4: Define route policy and a reusable deep-link gate

**Files:**
- Create: `src/screens/Training/features/memberFeatureRoutes.ts`
- Create: `src/screens/Training/features/memberFeatureRoutes.test.ts`
- Create: `src/screens/Training/components/MemberFeatureGate.tsx`
- Create: `src/screens/Training/components/MemberFeatureGate.test.tsx`

- [ ] **Step 1: Write failing route and composite policy tests**

```ts
expect(featureForTrainingRoute('TrainingResults')).toBe('results');
expect(featureForTrainingRoute('TrainingInjuryList')).toBe('pain_reports');
expect(featureForTrainingRoute('TrainingToday')).toBeNull();
expect(shouldShowProgressHub({ ...ALL_MEMBER_FEATURES_DISABLED, prs: true })).toBe(true);
expect(shouldShowProgressHub(ALL_MEMBER_FEATURES_DISABLED)).toBe(false);
expect(shouldShowBookingsHub({ ...ALL_MEMBER_FEATURES_DISABLED, my_bookings: true })).toBe(true);
```

Component assertions:

```tsx
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';
import { MemberFeatureGate } from './MemberFeatureGate';

jest.mock('@/context/WorkoutStudioProvider');
const mockedUseWorkoutStudio = jest.mocked(useWorkoutStudio);

beforeEach(() => {
	mockedUseWorkoutStudio.mockReturnValue({
		isEnabled: () => false,
	} as unknown as ReturnType<typeof useWorkoutStudio>);
});

it('replaces disabled deep-linked content with a safe state', () => {
	render(
		<MemberFeatureGate feature="results">
			<Text>secret results</Text>
		</MemberFeatureGate>,
	);
	expect(screen.queryByText('secret results')).toBeNull();
	expect(screen.getByText('Feature unavailable')).toBeTruthy();
});

it('renders enabled or explicitly entitled content', () => {
	mockedUseWorkoutStudio.mockReturnValue({
		isEnabled: () => true,
	} as unknown as ReturnType<typeof useWorkoutStudio>);
	const enabled = render(
		<MemberFeatureGate feature="results">
			<Text>enabled results</Text>
		</MemberFeatureGate>,
	);
	expect(enabled.getByText('enabled results')).toBeTruthy();
	enabled.unmount();

	mockedUseWorkoutStudio.mockReturnValue({
		isEnabled: () => false,
	} as unknown as ReturnType<typeof useWorkoutStudio>);
	render(
		<MemberFeatureGate feature="custom_workouts" allow>
			<Text>sponsored builder</Text>
		</MemberFeatureGate>,
	);
	expect(screen.getByText('sponsored builder')).toBeTruthy();
});
```

- [ ] **Step 2: Run the two suites and verify RED**

```powershell
npm test -- --runInBand src/screens/Training/features/memberFeatureRoutes.test.ts src/screens/Training/components/MemberFeatureGate.test.tsx
```

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the pure route map and composite selectors**

```ts
export const TRAINING_ROUTE_FEATURES: Partial<Record<keyof TrainingStackParamList, MemberFeature>> = {
	TrainingResults: 'results',
	TrainingResultDetail: 'results',
	TrainingShareWorkout: 'results',
	TrainingRunWorkout: 'results',
	TrainingWorkoutComplete: 'results',
	TrainingMaxes: 'my_maxes',
	TrainingPRs: 'prs',
	TrainingBenchmarks: 'benchmarks',
	TrainingWeeklyRecap: 'digest',
	TrainingGymFeed: 'feed',
	TrainingProfile: 'training_profile',
	TrainingCoachNotes: 'coach_notes',
	TrainingWearables: 'wearables',
	TrainingAppleHealth: 'wearables',
	TrainingInjuryList: 'pain_reports',
	TrainingInjuryLog: 'pain_reports',
	TrainingInjuryDailyUpdate: 'pain_reports',
	TrainingBuildList: 'custom_workouts',
	TrainingBuildEditor: 'custom_workouts',
	TrainingBuildSchedule: 'custom_workouts',
};

export const featureForTrainingRoute = (
	route: keyof TrainingStackParamList,
): MemberFeature | null => TRAINING_ROUTE_FEATURES[route] ?? null;

const anyEnabled = (
	features: MemberFeatureMap,
	keys: readonly MemberFeature[],
) => keys.some(key => features[key]);

export const shouldShowProgressHub = (features: MemberFeatureMap) =>
	anyEnabled(features, [
		'progress', 'results', 'prs', 'my_maxes', 'benchmarks', 'digest',
	]);

export const shouldShowBookingsHub = (features: MemberFeatureMap) =>
	anyEnabled(features, ['bookings', 'my_bookings']);
```

`TrainingWellness`, `TrainingProgress`, and `TrainingPT` stay composite and are guarded internally.

- [ ] **Step 4: Implement the reusable gate**

Use `useWorkoutStudio().isEnabled(feature)`. The component accepts `allow?: boolean` for the sponsored Custom Workouts exception. Render children when enabled or allowed; otherwise render `TrainingState` with the approved copy and a button that uses the root navigation ref:

```ts
navigate('Main', {
	screen: 'TrainingStack',
	params: { screen: 'TrainingToday' },
});
```

This root-level safe action lets the same gate protect Training, Dashboard, Calendar, and deep-linked class/session routes without coupling it to one stack's navigation prop.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 6: Commit route policy**

```powershell
git add src/screens/Training/features src/screens/Training/components/MemberFeatureGate.tsx src/screens/Training/components/MemberFeatureGate.test.tsx
git commit -m "feat(training): guard disabled member routes"
```

---

### Task 5: Gate classes without affecting assigned workouts

**Files:**
- Modify: `src/navigators/Application.tsx`
- Modify: `src/navigators/DashboardStack.tsx`
- Modify: `src/screens/Dashboard/Dashboard.tsx`
- Test: `src/screens/Training/features/memberFeatureRoutes.test.ts`

- [ ] **Step 1: Add a failing class-surface policy test**

```ts
expect(isClassSurface('Calendar')).toBe(true);
expect(isClassSurface('Bookings')).toBe(true);
expect(isClassSurface('TrainingToday')).toBe(false);
```

- [ ] **Step 2: Run the policy suite and verify RED**

Run the Task 4 policy test command. Expected: FAIL because `isClassSurface` is missing.

- [ ] **Step 3: Implement class surface policy and navigation filtering**

Add the class-only route helper to `memberFeatureRoutes.ts`:

```ts
const CLASS_SURFACES = new Set(['Calendar', 'Bookings', 'Session']);

export const isClassSurface = (routeName: string) =>
	CLASS_SURFACES.has(routeName);
```

In `MainTabNavigator`:

```tsx
const { isEnabled } = useWorkoutStudio();
const classesEnabled = isEnabled('classes');

{classesEnabled ? (
	<Tab.Screen name="Calendar" component={Calendar} options={calendarOptions} />
) : null}
```

Wrap class/session routes in `DashboardStack` with `MemberFeatureGate feature="classes"`. Filter dashboard quick actions that navigate to `Bookings`, `Session`, or `Calendar` when classes are disabled. Do not filter the Training tab, Training Today, or assigned workout cards.

- [ ] **Step 4: Run policy tests, navigation component tests, and type-check**

```powershell
npm test -- --runInBand src/screens/Training/features/memberFeatureRoutes.test.ts
npm run check-types
```

Expected: PASS and TypeScript exits 0.

- [ ] **Step 5: Commit class gating**

```powershell
git add src/navigators/Application.tsx src/navigators/DashboardStack.tsx src/screens/Dashboard/Dashboard.tsx src/screens/Training/features
git commit -m "feat(mobile): gate class booking surfaces"
```

---

### Task 6: Filter Training More and guard feature-only routes

**Files:**
- Modify: `src/navigators/TrainingStack.tsx`
- Modify: `src/screens/Training/More/TrainingMore.tsx`
- Create: `src/screens/Training/More/trainingMoreItems.ts`
- Create: `src/screens/Training/More/trainingMoreItems.test.ts`

- [ ] **Step 1: Write failing menu-filter tests**

```ts
it('shows only the physical-gym minimum when only classes is enabled', () => {
	const groups = buildTrainingMoreGroups({ ...ALL_MEMBER_FEATURES_DISABLED, classes: true }, false);
	expect(flattenLabels(groups)).toEqual(['Workouts', 'Settings', 'Notifications']);
});

it('shows pain reporting independently from wellness', () => {
	const groups = buildTrainingMoreGroups({ ...ALL_MEMBER_FEATURES_DISABLED, pain_reports: true }, false);
	expect(flattenLabels(groups)).toContain('Pain & Injuries');
	expect(flattenLabels(groups)).not.toContain('Wellness');
});

it('keeps sponsored custom workouts visible', () => {
	const groups = buildTrainingMoreGroups(ALL_MEMBER_FEATURES_DISABLED, true);
	expect(flattenLabels(groups)).toContain('Custom Workouts');
});
```

- [ ] **Step 2: Run the menu test and verify RED**

```powershell
npm test -- --runInBand src/screens/Training/More/trainingMoreItems.test.ts
```

Expected: FAIL because the builder does not exist.

- [ ] **Step 3: Extract and implement the pure menu builder**

Each item declares `feature?: MemberFeature` or `visibleWhen(features)`. Use separate `Wellness` and `Pain & Injuries` rows. Show `My Progress` when any of `progress`, `results`, `prs`, `my_maxes`, `benchmarks`, or `digest` is enabled. Show `Bookings` when `bookings || my_bookings`.

- [ ] **Step 4: Apply the builder and route guards**

`TrainingMore` calls the pure builder with provider flags and entitlement state. In `TrainingStack`, wrap every `TRAINING_ROUTE_FEATURES` entry with `MemberFeatureGate`; preserve the custom-workout entitlement override by passing `allow={hasCustomWorkouts}` to that gate.

- [ ] **Step 5: Run tests and type-check**

```powershell
npm test -- --runInBand src/screens/Training/More/trainingMoreItems.test.ts src/screens/Training/components/MemberFeatureGate.test.tsx
npm run check-types
```

Expected: PASS.

- [ ] **Step 6: Commit navigation filtering**

```powershell
git add src/navigators/TrainingStack.tsx src/screens/Training/More src/screens/Training/components/MemberFeatureGate.tsx
git commit -m "feat(training): filter member feature navigation"
```

---

### Task 7: Preserve workout reading while disabling results and scoring

**Files:**
- Modify: `src/screens/Training/Workouts/WorkoutDetail.tsx`
- Modify: `src/screens/Training/Workouts/RunWorkout.tsx`
- Create: `src/screens/Training/Workouts/workoutResultCapabilities.ts`
- Create: `src/screens/Training/Workouts/workoutResultCapabilities.test.ts`

- [ ] **Step 1: Write failing capability tests**

```ts
expect(workoutResultCapabilities(false)).toEqual({
	canStart: false,
	canLogAggregateScore: false,
	canLogSectionScore: false,
	canFinish: false,
	canReadWorkout: true,
});
expect(workoutResultCapabilities(true).canStart).toBe(true);
```

- [ ] **Step 2: Run the capability test and verify RED**

```powershell
npm test -- --runInBand src/screens/Training/Workouts/workoutResultCapabilities.test.ts
```

Expected: FAIL because the capability module does not exist.

- [ ] **Step 3: Implement the pure capability object**

```ts
export const workoutResultCapabilities = (resultsEnabled: boolean) => ({
	canReadWorkout: true,
	canStart: resultsEnabled,
	canLogAggregateScore: resultsEnabled,
	canLogSectionScore: resultsEnabled,
	canFinish: resultsEnabled,
});
```

- [ ] **Step 4: Apply capabilities to Workout Detail**

Keep workout sections, coach notes, movement details, and leaderboard reading. When results are disabled, do not create pending results, render score forms, show section-score buttons, render PR celebrations, or show `Log result`/`Start workout` actions.

- [ ] **Step 5: Guard Run Workout before writes initialize**

Use `MemberFeatureGate feature="results"` at the route boundary and an early `resultsEnabled` check before `startWorkoutResult`, set writes, section-score writes, and completion. This double check prevents a flag refresh from leaving a mounted workout writable.

- [ ] **Step 6: Run focused tests and type-check**

```powershell
npm test -- --runInBand src/screens/Training/Workouts/workoutResultCapabilities.test.ts src/screens/Training/Sharing/shareWorkout.test.ts
npm run check-types
```

Expected: PASS.

- [ ] **Step 7: Commit result gating**

```powershell
git add src/screens/Training/Workouts src/screens/Training/Sharing src/navigators/TrainingStack.tsx
git commit -m "feat(training): honor result logging feature"
```

---

### Task 8: Filter the composite Progress hub

**Files:**
- Create: `src/screens/Training/Progress/progressFeatures.ts`
- Create: `src/screens/Training/Progress/progressFeatures.test.ts`
- Modify: `src/screens/Training/Progress/Progress.tsx`

- [ ] **Step 1: Write failing content-policy tests**

```ts
expect(buildProgressContent({ ...ALL_MEMBER_FEATURES_DISABLED, prs: true })).toEqual({
	showKpis: false,
	showRecentActivity: false,
	links: ['TrainingPRs'],
});
expect(buildProgressContent({ ...ALL_MEMBER_FEATURES_DISABLED, progress: true }).showKpis).toBe(true);
expect(buildProgressContent({ ...ALL_MEMBER_FEATURES_DISABLED, results: true }).showRecentActivity).toBe(true);
```

- [ ] **Step 2: Run the test and verify RED**

```powershell
npm test -- --runInBand src/screens/Training/Progress/progressFeatures.test.ts
```

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Implement the content policy and filtered links**

Return links for Results, PRs, Maxes, Benchmarks, and Weekly Recap only when their flags are true. `showKpis` follows `progress`; `showRecentActivity` follows `results`. Compute `needsResultQuery = showKpis || showRecentActivity` and `needsRMQuery = showKpis`.

- [ ] **Step 4: Apply query-level `enabled` checks and conditional rendering**

Do not run results/RM queries when their content is disabled. Hide the entire screen through the composite selector only when no child capability is enabled. Never display a loading/error state for a query that was intentionally disabled.

- [ ] **Step 5: Run focused tests and type-check**

```powershell
npm test -- --runInBand src/screens/Training/Progress/progressFeatures.test.ts
npm run check-types
```

Expected: PASS.

- [ ] **Step 6: Commit Progress filtering**

```powershell
git add src/screens/Training/Progress
git commit -m "feat(training): filter progress feature content"
```

---

### Task 9: Separate wellness, pain reporting, and wearable access

**Files:**
- Modify: `src/screens/Training/Wellness/Wellness.tsx`
- Modify: `src/screens/Training/More/TrainingMore.tsx`
- Modify: `src/navigators/TrainingStack.tsx`
- Create: `src/screens/Training/Wellness/wellnessFeaturePolicy.ts`
- Create: `src/screens/Training/Wellness/wellnessFeaturePolicy.test.ts`

- [ ] **Step 1: Write failing wellbeing policy tests**

```ts
expect(wellbeingPolicy({ ...ALL_MEMBER_FEATURES_DISABLED, pain_reports: true })).toEqual({
	showWellness: false,
	showPainReports: true,
	showWearables: false,
	maySyncQueuedWellness: false,
});
expect(wellbeingPolicy({ ...ALL_MEMBER_FEATURES_DISABLED, wellness: true }).maySyncQueuedWellness).toBe(true);
```

- [ ] **Step 2: Run the test and verify RED**

```powershell
npm test -- --runInBand src/screens/Training/Wellness/wellnessFeaturePolicy.test.ts
```

Expected: FAIL because the policy does not exist.

- [ ] **Step 3: Implement policy and independent navigation rows**

Add distinct Wellness, Pain & Injuries, and Wearables rows. Keep the existing injury routes behind `pain_reports` and Wearables/Apple Health behind `wearables`.

- [ ] **Step 4: Prevent disabled wellness data activity**

Add `wellnessEnabled` to every Wellness query `enabled` condition. Early-return from consent, save, delete, and queue-write handlers when disabled. Add `wellnessEnabled` to the queued synchronization effect guard:

```ts
if (!wellnessEnabled || isOffline || syncingQueue.current || !uid || !tenantId || !dimensions.data) return;
```

Do not delete queued encrypted check-ins when disabled.

- [ ] **Step 5: Run focused tests and type-check**

```powershell
npm test -- --runInBand src/screens/Training/Wellness/wellnessFeaturePolicy.test.ts
npm run check-types
```

Expected: PASS.

- [ ] **Step 6: Commit wellbeing gating**

```powershell
git add src/screens/Training/Wellness src/screens/Training/More/TrainingMore.tsx src/navigators/TrainingStack.tsx
git commit -m "feat(training): separate wellbeing feature access"
```

---

### Task 10: Filter service booking creation and history independently

**Files:**
- Create: `src/screens/Training/Bookings/bookingFeaturePolicy.ts`
- Create: `src/screens/Training/Bookings/bookingFeaturePolicy.test.ts`
- Modify: `src/screens/Training/Bookings/BookingsHub.tsx`
- Modify: `src/services/workoutStudio/bookings.ts`

- [ ] **Step 1: Write failing booking-tab tests**

```ts
expect(availableBookingTabs({ bookings: false, myBookings: true })).toEqual(['mine']);
expect(availableBookingTabs({ bookings: true, myBookings: false })).toEqual([
	'pt', 'treatment', 'resource',
]);
expect(availableBookingTabs({ bookings: false, myBookings: false })).toEqual([]);
expect(canRescheduleBooking({ bookings: false, myBookings: true })).toBe(false);
```

- [ ] **Step 2: Run the booking policy test and verify RED**

```powershell
npm test -- --runInBand src/screens/Training/Bookings/bookingFeaturePolicy.test.ts
```

Expected: FAIL because the policy module does not exist.

- [ ] **Step 3: Implement booking policy and query gating**

Only enable services/providers/resources queries when `bookings` is true. Only enable the member-bookings query when `my_bookings` is true. Initialize the selected tab from the first available tab, and repair it in an effect when a background flag refresh removes the active tab. Hide create/reschedule controls when `bookings` is false; retain booking history and cancellation where permitted by the API.

- [ ] **Step 4: Recognize future server enforcement**

Extend `BookingErrorCode` with `'feature_disabled'`. When received, close the composer, call `refreshFeatures()`, and render the disabled-feature state instead of a generic booking error.

- [ ] **Step 5: Run focused tests and type-check**

```powershell
npm test -- --runInBand src/screens/Training/Bookings/bookingFeaturePolicy.test.ts
npm run check-types
```

Expected: PASS.

- [ ] **Step 6: Commit booking gating**

```powershell
git add src/screens/Training/Bookings src/services/workoutStudio/bookings.ts
git commit -m "feat(training): honor service booking features"
```

---

### Task 11: Full regression validation and handoff

**Files:**
- Verify: all files changed by Tasks 1–10.

- [ ] **Step 1: Run every new focused suite together**

```powershell
npm test -- --runInBand src/services/workoutStudio/memberFeatures.test.ts src/context/WorkoutStudioProvider.test.tsx src/screens/Training/features/memberFeatureRoutes.test.ts src/screens/Training/components/MemberFeatureGate.test.tsx src/screens/Training/More/trainingMoreItems.test.ts src/screens/Training/Workouts/workoutResultCapabilities.test.ts src/screens/Training/Progress/progressFeatures.test.ts src/screens/Training/Wellness/wellnessFeaturePolicy.test.ts src/screens/Training/Bookings/bookingFeaturePolicy.test.ts
```

Expected: all suites PASS.

- [ ] **Step 2: Run the complete JavaScript validation**

```powershell
npm test -- --runInBand
npm run check-types
npm run lint
```

Expected: Jest, TypeScript, and ESLint all exit 0 with no warnings.

- [ ] **Step 3: Perform the manual scenario matrix**

Verify on a preview build:

1. Existing physical gym with all flags on: no mobile surface disappears.
2. Physical Yoga gym with only `classes=true`: class Calendar, class detail, and class booking work; optional Workout Studio features are hidden.
3. Online gym with `classes=false`: class Calendar and session entry points are absent; assigned workouts still open.
4. `results=false`: workout description opens, but start, scoring, finish, Results, and sharing do not.
5. `wellness=false,pain_reports=true`: pain reporting works and wellness queue does not sync.
6. `bookings=false,my_bookings=true`: booking history works without creation/rescheduling.
7. Disable a feature while its deep link is open: the disabled state replaces protected content.
8. Start offline with cache: cached flags render. Start offline without cache: all features remain visible.
9. Switch gyms: the prior tenant's flags never appear under the new tenant.

- [ ] **Step 4: Confirm the web/server blockers before calling the system end-to-end**

Check the deployed Workout Studio repository for:

- an additive corrective backfill that enables previously available flags for existing gyms;
- `classes=true` as the default for new physical-gym provisioning;
- `feature_disabled` authorization checks for result, wellness, and service-booking writes.

If any are absent, report mobile as complete but the overall feature as not yet end-to-end.

- [ ] **Step 5: Confirm validation left no uncommitted changes**

```powershell
git status --short
```

Expected: no output. If validation exposed a defect, return to the owning task, add a failing regression test, implement the correction, rerun that task's checks, and commit with that task's file list before continuing.

- [ ] **Step 6: Push only after all checks pass**

```powershell
git push origin testflight-preview-ci
```

Expected: a fast-forward push; never force push or rewrite Lovable history.
