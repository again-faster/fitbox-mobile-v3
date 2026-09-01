import type {
	MemberFeature,
	MemberFeatureMap,
} from '@/services/workoutStudio/memberFeatures';
import type {
	ApplicationStackParamList,
	DashboardParamList,
	MainTabParamList,
	TrainingStackParamList,
} from '@/types/navigation';

export type MemberSurfaceRoute =
	| keyof ApplicationStackParamList
	| keyof DashboardParamList
	| keyof MainTabParamList
	| keyof TrainingStackParamList;

const MAIN_TAB_ROUTES: readonly (keyof MainTabParamList)[] = [
	'DashboardStack',
	'Calendar',
	'InboxStack',
	'Shop',
	'TrainingStack',
	'MenuTab',
];

const CLASS_SURFACES = new Set<MemberSurfaceRoute>([
	'Calendar',
	'Bookings',
	'Session',
]);

export const isClassSurface = (route: MemberSurfaceRoute) =>
	CLASS_SURFACES.has(route);

export const shouldShowMemberSurface = (
	route: MemberSurfaceRoute,
	classesEnabled: boolean,
) => !featureForMemberSurface(route) || classesEnabled;

export const featureForMemberSurface = (
	_route: MemberSurfaceRoute,
): MemberFeature | null => {
	// Fitbox IQ owns the legacy class booking surfaces. They remain available
	// while Workout Studio feature flags are rolled out independently.
	return null;
};

export const filterMemberSurfaceEntries = <
	TEntry extends { route: MemberSurfaceRoute },
>(
	entries: readonly TEntry[],
	classesEnabled: boolean,
) =>
	entries.filter(entry =>
		shouldShowMemberSurface(entry.route, classesEnabled),
	);

export const getVisibleMainTabRoutes = (classesEnabled: boolean) =>
	MAIN_TAB_ROUTES.filter(route =>
		shouldShowMemberSurface(route, classesEnabled),
	);

export const normalizeCurrentMainTab = (
	currentTab: keyof MainTabParamList,
	classesEnabled: boolean,
): keyof MainTabParamList =>
	shouldShowMemberSurface(currentTab, classesEnabled)
		? currentTab
		: 'DashboardStack';

export const TRAINING_ROUTE_FEATURES: Partial<
	Record<keyof TrainingStackParamList, MemberFeature>
> = {
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
		'progress',
		'results',
		'prs',
		'my_maxes',
		'benchmarks',
		'digest',
	]);

export const shouldShowBookingsHub = (features: MemberFeatureMap) =>
	anyEnabled(features, ['bookings', 'my_bookings']);
