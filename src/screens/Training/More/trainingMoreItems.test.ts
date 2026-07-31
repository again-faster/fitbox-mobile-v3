import {
	ALL_MEMBER_FEATURES_DISABLED,
	type MemberFeature,
} from '@/services/workoutStudio/memberFeatures';
import { buildTrainingMoreGroups } from './trainingMoreItems';

const labelsFor = (
	features = ALL_MEMBER_FEATURES_DISABLED,
	hasCustomWorkouts = false,
) =>
	buildTrainingMoreGroups(features, hasCustomWorkouts)
		.flatMap(group => group.items)
		.map(item => item.label);

const itemFor = (
	feature: MemberFeature,
	label: string,
	hasCustomWorkouts = false,
) =>
	buildTrainingMoreGroups(
		{ ...ALL_MEMBER_FEATURES_DISABLED, [feature]: true },
		hasCustomWorkouts,
	)
		.flatMap(group => group.items)
		.find(item => item.label === label);

describe('buildTrainingMoreGroups', () => {
	it('keeps only the physical training minimum when classes are the sole feature', () => {
		const labels = labelsFor({
			...ALL_MEMBER_FEATURES_DISABLED,
			classes: true,
		});

		expect(labels.sort()).toEqual(
			['Workouts', 'Settings', 'Notifications'].sort(),
		);
	});

	it.each([
		['wellness', 'Wellness', 'TrainingWellness'],
		['pain_reports', 'Pain & Injuries', 'TrainingInjuryList'],
		['wearables', 'Wearables', 'TrainingWearables'],
		['feed', 'Gym Feed', 'TrainingGymFeed'],
		['training_profile', 'Training Profile', 'TrainingProfile'],
		['coach_notes', 'Coach Notes', 'TrainingCoachNotes'],
	] as const)('shows %s independently as %s', (feature, label, route) => {
		expect(itemFor(feature, label)).toMatchObject({ label, route });
	});

	it('does not treat pain reports as wellness', () => {
		const labels = labelsFor({
			...ALL_MEMBER_FEATURES_DISABLED,
			pain_reports: true,
		});

		expect(labels).toContain('Pain & Injuries');
		expect(labels).not.toContain('Wellness');
	});

	it.each([
		'progress',
		'results',
		'prs',
		'my_maxes',
		'benchmarks',
		'digest',
	] as const)('shows My Progress when %s is enabled', feature => {
		expect(itemFor(feature, 'My Progress')).toMatchObject({
			route: 'TrainingProgress',
		});
	});

	it.each(['bookings', 'my_bookings'] as const)(
		'shows the bookings entry when %s is enabled',
		feature => {
			expect(itemFor(feature, 'Book services')).toMatchObject({
				route: 'TrainingPT',
			});
		},
	);

	it('shows Custom Workouts when the member feature is enabled', () => {
		expect(itemFor('custom_workouts', 'Custom Workouts')).toMatchObject({
			route: 'TrainingBuildList',
		});
	});

	it('shows Custom Workouts for a sponsored entitlement', () => {
		const item = buildTrainingMoreGroups(ALL_MEMBER_FEATURES_DISABLED, true)
			.flatMap(group => group.items)
			.find(entry => entry.label === 'Custom Workouts');

		expect(item).toMatchObject({ route: 'TrainingBuildList' });
	});
});
