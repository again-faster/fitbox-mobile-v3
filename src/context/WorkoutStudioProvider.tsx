import useAuth from '@/auth/hooks/useAuth';
import {
	ExchangeParams,
	WSSession,
	WSSessionResult,
	clearWSSession,
	ensureWSSession,
} from '@/services/workoutStudio/auth';
import {
	ALL_MEMBER_FEATURES_ENABLED,
	FeatureStorage,
	MemberFeature,
	MemberFeatureMap,
	fetchMemberFeatures,
	loadCachedMemberFeatures,
	saveCachedMemberFeatures,
} from '@/services/workoutStudio/memberFeatures';
import {
	PropsWithChildren,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { AppState } from 'react-native';

export type WorkoutStudioState =
	| { status: 'loading' }
	| { status: 'authenticated'; session: WSSession }
	| { status: 'not_found' }
	| { status: 'no_membership' }
	| { status: 'unknown_gym' }
	| { status: 'provision_failed' }
	| { status: 'error' };

export type FeatureSource = 'first-load' | 'cache' | 'network';

export type WorkoutStudioServices = {
	ensureWSSession: (params: ExchangeParams) => Promise<WSSessionResult>;
	clearWSSession: () => void;
	fetchMemberFeatures: (tenantId: string) => Promise<MemberFeatureMap>;
	loadCachedMemberFeatures: (
		storage: FeatureStorage,
		tenantId: string,
	) => MemberFeatureMap | null;
	saveCachedMemberFeatures: (
		storage: FeatureStorage,
		tenantId: string,
		features: MemberFeatureMap,
	) => unknown;
	now: () => number;
};

type FeatureSnapshot = {
	tenantId: string | null;
	features: MemberFeatureMap;
	source: FeatureSource;
};

type WorkoutStudioContextValue = {
	state: WorkoutStudioState;
	tenantId: string | null;
	features: MemberFeatureMap;
	featureSource: FeatureSource;
	isEnabled: (feature: MemberFeature) => boolean;
	refreshFeatures: () => Promise<void>;
	retrySession: () => Promise<void>;
	signOut: () => void;
};

const defaultServices: WorkoutStudioServices = {
	ensureWSSession,
	clearWSSession,
	fetchMemberFeatures,
	loadCachedMemberFeatures,
	saveCachedMemberFeatures,
	now: Date.now,
};

const WorkoutStudioContext = createContext<
	WorkoutStudioContextValue | undefined
>(undefined);

type Props = PropsWithChildren<{
	storage: FeatureStorage;
	services?: Partial<WorkoutStudioServices>;
}>;

const stateFromResult = (result: WSSessionResult): WorkoutStudioState => {
	if ('session' in result)
		return { status: 'authenticated', session: result.session };
	switch (result.error) {
		case 'NOT_FOUND':
			return { status: 'not_found' };
		case 'NO_MEMBERSHIP':
			return { status: 'no_membership' };
		case 'UNKNOWN_GYM':
			return { status: 'unknown_gym' };
		case 'PROVISION_FAILED':
			return { status: 'provision_failed' };
		default:
			return { status: 'error' };
	}
};

export const WorkoutStudioProvider = ({
	children,
	storage,
	services,
}: Props) => {
	const { user } = useAuth();
	const resolvedServices = useMemo(
		() => ({ ...defaultServices, ...services }),
		[services],
	);
	const [state, setState] = useState<WorkoutStudioState>({
		status: 'loading',
	});
	const [sessionIdentity, setSessionIdentity] = useState<string | null>(
		null,
	);
	const [featureSnapshot, setFeatureSnapshot] =
		useState<FeatureSnapshot>({
			tenantId: null,
			features: ALL_MEMBER_FEATURES_ENABLED,
			source: 'first-load',
		});
	const requestIdRef = useRef(0);
	const activeSessionRef = useRef<WSSession | null>(null);
	const activeTenantRef = useRef<string | null>(null);
	const lastFeatureRefreshAtRef = useRef(0);

	const email = user?.user_data?.email;
	const memberId = user?.user_data?.user_id;
	const gymId = user?.user_data?.onboarding_gym_ids?.[0];
	const fullName = user
		? `${user.user_data.first_name} ${user.user_data.last_name}`.trim()
		: '';
	const identity = `${email ?? 'no-email'}:${gymId ?? 'no-gym'}`;
	const identityMatches =
		state.status !== 'authenticated' || sessionIdentity === identity;
	const visibleState: WorkoutStudioState = identityMatches
		? state
		: { status: 'loading' };
	const visibleSession =
		visibleState.status === 'authenticated'
			? visibleState.session
			: null;
	const tenantId = visibleSession?.user.active_tenant_id ?? null;
	const isMember = visibleSession?.user.persona === 'member';
	const snapshotMatches =
		tenantId !== null && featureSnapshot.tenantId === tenantId;
	const visibleFeatures =
		isMember && snapshotMatches
			? featureSnapshot.features
			: ALL_MEMBER_FEATURES_ENABLED;
	const featureSource =
		isMember && snapshotMatches ? featureSnapshot.source : 'first-load';

	activeSessionRef.current = visibleSession;
	activeTenantRef.current = tenantId;

	const refreshTenantFeatures = useCallback(
		async (session: WSSession) => {
			if (session.user.persona !== 'member') return;
			const requestedTenantId = session.user.active_tenant_id;
			lastFeatureRefreshAtRef.current = resolvedServices.now();
			try {
				const nextFeatures =
					await resolvedServices.fetchMemberFeatures(
						requestedTenantId,
					);
				resolvedServices.saveCachedMemberFeatures(
					storage,
					requestedTenantId,
					nextFeatures,
				);
				if (activeTenantRef.current === requestedTenantId) {
					setFeatureSnapshot({
						tenantId: requestedTenantId,
						features: nextFeatures,
						source: 'network',
					});
				}
			} catch {
				// Cache and first-load fail-open flags remain active.
			}
		},
		[resolvedServices, storage],
	);

	const bootstrap = useCallback(async () => {
		const requestId = requestIdRef.current + 1;
		requestIdRef.current = requestId;
		setState({ status: 'loading' });
		activeSessionRef.current = null;
		activeTenantRef.current = null;

		if (!email || memberId == null) {
			if (requestIdRef.current === requestId) {
				setSessionIdentity(identity);
				setFeatureSnapshot({
					tenantId: null,
					features: ALL_MEMBER_FEATURES_ENABLED,
					source: 'first-load',
				});
				setState({ status: 'error' });
			}
			return;
		}

		const params: ExchangeParams = {
			email,
			...(gymId != null
				? { fitbox_gym_id: String(gymId) }
				: {}),
			fitbox_member_id: String(memberId),
			...(fullName ? { full_name: fullName } : {}),
		};
		const result = await resolvedServices.ensureWSSession(params);
		if (requestIdRef.current !== requestId) return;

		const nextState = stateFromResult(result);
		setSessionIdentity(identity);
		if (nextState.status !== 'authenticated') {
			setFeatureSnapshot({
				tenantId: null,
				features: ALL_MEMBER_FEATURES_ENABLED,
				source: 'first-load',
			});
			setState(nextState);
			return;
		}

		const session = nextState.session;
		const nextTenantId = session.user.active_tenant_id;
		activeSessionRef.current = session;
		activeTenantRef.current = nextTenantId;
		if (session.user.persona === 'member') {
			const cached = resolvedServices.loadCachedMemberFeatures(
				storage,
				nextTenantId,
			);
			setFeatureSnapshot({
				tenantId: nextTenantId,
				features: cached ?? ALL_MEMBER_FEATURES_ENABLED,
				source: cached ? 'cache' : 'first-load',
			});
		} else {
			setFeatureSnapshot({
				tenantId: nextTenantId,
				features: ALL_MEMBER_FEATURES_ENABLED,
				source: 'first-load',
			});
		}
		setState(nextState);
		void refreshTenantFeatures(session);
	}, [
		email,
		fullName,
		gymId,
		identity,
		memberId,
		refreshTenantFeatures,
		resolvedServices,
		storage,
	]);

	useEffect(() => {
		void bootstrap();
	}, [bootstrap]);

	const refreshFeatures = useCallback(async () => {
		const session = activeSessionRef.current;
		if (session) await refreshTenantFeatures(session);
	}, [refreshTenantFeatures]);

	useEffect(() => {
		let previousState = AppState.currentState;
		const subscription = AppState.addEventListener(
			'change',
			nextState => {
				const becameActive =
					nextState === 'active' && previousState !== 'active';
				previousState = nextState;
				if (
					becameActive &&
					resolvedServices.now() -
						lastFeatureRefreshAtRef.current >=
						5 * 60 * 1000
				) {
					void refreshFeatures();
				}
			},
		);
		return () => subscription.remove();
	}, [refreshFeatures, resolvedServices]);

	const signOut = useCallback(() => {
		requestIdRef.current += 1;
		resolvedServices.clearWSSession();
		activeSessionRef.current = null;
		activeTenantRef.current = null;
		setSessionIdentity(identity);
		setFeatureSnapshot({
			tenantId: null,
			features: ALL_MEMBER_FEATURES_ENABLED,
			source: 'first-load',
		});
		setState({ status: 'not_found' });
	}, [identity, resolvedServices]);

	const isEnabled = useCallback(
		(feature: MemberFeature) =>
			isMember ? visibleFeatures[feature] : true,
		[isMember, visibleFeatures],
	);

	const value = useMemo<WorkoutStudioContextValue>(
		() => ({
			state: visibleState,
			tenantId,
			features: visibleFeatures,
			featureSource,
			isEnabled,
			refreshFeatures,
			retrySession: bootstrap,
			signOut,
		}),
		[
			bootstrap,
			featureSource,
			isEnabled,
			refreshFeatures,
			signOut,
			tenantId,
			visibleFeatures,
			visibleState,
		],
	);

	return (
		<WorkoutStudioContext.Provider value={value}>
			{children}
		</WorkoutStudioContext.Provider>
	);
};

export const useWorkoutStudio = () => {
	const context = useContext(WorkoutStudioContext);
	if (!context) {
		throw new Error(
			'useWorkoutStudio must be used within a WorkoutStudioProvider',
		);
	}
	return context;
};
