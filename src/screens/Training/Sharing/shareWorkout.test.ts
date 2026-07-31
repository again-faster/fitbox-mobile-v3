import type { WorkoutDetail } from '@/services/workoutStudio/types';
import {
	buildWorkoutShareDescription,
	formatShareDuration,
	formatShareScore,
} from './shareWorkout';

const workout = {
	id: 'workout-1',
	name: 'Heavy 100',
	estimated_duration_minutes: 30,
	workout_sections: [
		{
			id: 'section-1',
			name: 'Main workout',
			position: 1,
			section_mode: 'workout',
			coach_notes: null,
			scoring_type: 'for_time',
			is_scored: true,
			score_collection_mode: 'aggregate',
			time_cap_seconds: null,
			rounds: null,
			leaderboard_enabled: true,
			leaderboard_calculation: null,
			leaderboard_sort_direction: 'asc',
			leaderboard_score_type: 'time',
			aggregate_formula: null,
			aggregate_group_id: null,
			section_blocks: [
				{
					id: 'block-1',
					label: null,
					intent: 'Private block intent',
					position: 1,
					rest_seconds: null,
					scaled_notes: 'Private scaled note',
					foundations_notes: 'Private foundations note',
					block_movements: [
						{
							id: 'movement-1',
							position: 1,
							sets: 1,
							reps_scheme: '100',
							weight_kg: null,
							weight_scheme: null,
							duration_seconds: null,
							distance_meters: null,
							calories: null,
							set_scheme: null,
							advanced: null,
							notes: 'Private movement note',
							movements: { id: 'deadlift', name: 'Deadlift' },
						},
					],
				},
			],
		},
	],
} satisfies WorkoutDetail;

describe('workout sharing formatters', () => {
	it('builds a named public movement summary without internal fields', () => {
		const summary = buildWorkoutShareDescription(workout);
		expect(summary).toBe('Heavy 100 — Main workout: 100 x Deadlift');
		expect(summary).not.toContain('Private block intent');
		expect(summary).not.toContain('Private scaled note');
		expect(summary).not.toContain('Private foundations note');
		expect(summary).not.toContain('Private movement note');
	});

	it('prefers ordered member-visible Strength and Metcon notes', () => {
		const textWorkout = {
			...workout,
			name: 'Midweek Engine',
			workout_sections: [
				{
					...workout.workout_sections[0]!,
					id: 'metcon',
					name: 'Metcon',
					position: 2,
					section_mode: 'workout',
					coach_notes:
						'18-minute EMOM with bike, dumbbell snatches, and burpees.',
					section_blocks: [],
				},
				{
					...workout.workout_sections[0]!,
					id: 'strength',
					name: 'Strength',
					position: 1,
					section_mode: 'workout',
					coach_notes: 'Deadlift: 5 x 3 at a moderate load.',
					section_blocks: [],
				},
			],
		} satisfies WorkoutDetail;

		const summary = buildWorkoutShareDescription(textWorkout);

		expect(summary).toContain('Midweek Engine');
		expect(summary.indexOf('Strength:')).toBeLessThan(
			summary.indexOf('Metcon:'),
		);
		expect(summary).toContain('Deadlift: 5 x 3');
		expect(summary).toContain('18-minute EMOM');
		expect(summary.length).toBeLessThanOrEqual(180);
	});

	it('falls back to the workout name when no public section summary exists', () => {
		expect(
			buildWorkoutShareDescription({ ...workout, workout_sections: [] }),
		).toBe('Heavy 100');
	});

	it('returns an empty description when the workout name is blank', () => {
		expect(
			buildWorkoutShareDescription({
				...workout,
				name: '   ',
				workout_sections: [],
			}),
		).toBe('');
	});

	it('formats duration for a compact overlay', () => {
		expect(formatShareDuration(3670)).toBe('1h 1m');
	});

	it('formats a rounds score', () => {
		expect(
			formatShareScore({
				id: 'result-1',
				workout_id: 'workout-1',
				completed_at: '2026-07-28T00:00:00Z',
				total_volume_kg: null,
				duration_seconds: null,
				subjective_rating: null,
				score_rounds: 8,
				score_partial_reps: 5,
				workouts: { name: 'Heavy 100' },
			}),
		).toBe('8 rounds + 5');
	});
});
