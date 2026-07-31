import {
	ALL_MEMBER_FEATURES_DISABLED,
	type MemberFeature,
} from '@/services/workoutStudio/memberFeatures';
import {
	TRAINING_ROUTE_FEATURES,
	featureForTrainingRoute,
	isClassSurface,
	shouldShowBookingsHub,
	shouldShowMemberSurface,
	shouldShowProgressHub,
} from './memberFeatureRoutes';

describe('training member feature route policy', () => {
	const expectedRoutes: Record<string, MemberFeature> = {
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

	it('maps exactly the protected training routes to member features', () => {
		expect(TRAINING_ROUTE_FEATURES).toEqual(expectedRoutes);
		Object.entries(expectedRoutes).forEach(([route, feature]) => {
			expect(
				featureForTrainingRoute(
					route as Parameters<typeof featureForTrainingRoute>[0],
				),
			).toBe(feature);
		});
	});

	it.each([
		'TrainingToday',
		'TrainingWellness',
		'TrainingProgress',
		'TrainingPT',
	] as const)('leaves the %s route unguarded for internal composition', route => {
		expect(featureForTrainingRoute(route)).toBeNull();
	});

	it.each([
		'progress',
		'results',
		'prs',
		'my_maxes',
		'benchmarks',
		'digest',
	] as const)('shows the progress hub when %s is enabled', feature => {
		expect(
			shouldShowProgressHub({
				...ALL_MEMBER_FEATURES_DISABLED,
				[feature]: true,
			}),
		).toBe(true);
	});

	it('hides the progress hub when all of its features are disabled', () => {
		expect(shouldShowProgressHub(ALL_MEMBER_FEATURES_DISABLED)).toBe(false);
	});

	it.each(['bookings', 'my_bookings'] as const)(
		'shows the bookings hub when %s is enabled',
		feature => {
			expect(
				shouldShowBookingsHub({
					...ALL_MEMBER_FEATURES_DISABLED,
					[feature]: true,
				}),
			).toBe(true);
		},
	);

	it('hides the bookings hub when both booking features are disabled', () => {
		expect(shouldShowBookingsHub(ALL_MEMBER_FEATURES_DISABLED)).toBe(false);
	});

	it.each(['Calendar', 'Bookings', 'Session'] as const)(
		'treats %s as a class surface',
		route => {
			expect(isClassSurface(route)).toBe(true);
		},
	);

	it.each([
		'TrainingToday',
		'TrainingDay',
		'TrainingWorkouts',
		'TrainingWorkoutDetail',
	] as const)('keeps the assigned-workout surface %s outside class gating', route => {
		expect(isClassSurface(route)).toBe(false);
	});

	it('filters only class navigation surfaces when classes are disabled', () => {
		const routes = [
			'Calendar',
			'Bookings',
			'Session',
			'TrainingToday',
			'TrainingDay',
			'TrainingWorkouts',
			'TrainingWorkoutDetail',
		] as const;

		expect(
			routes.filter(route => shouldShowMemberSurface(route, false)),
		).toEqual([
			'TrainingToday',
			'TrainingDay',
			'TrainingWorkouts',
			'TrainingWorkoutDetail',
		]);
		expect(routes.filter(route => shouldShowMemberSurface(route, true))).toEqual(
			routes,
		);
	});
});
