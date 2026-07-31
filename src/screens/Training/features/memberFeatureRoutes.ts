import type {
	MemberFeature,
	MemberFeatureMap,
} from '@/services/workoutStudio/memberFeatures';
import type { TrainingStackParamList } from '@/types/navigation';

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
