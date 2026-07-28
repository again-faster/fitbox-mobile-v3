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
			coach_notes: 'Private note',
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
					intent: '',
					position: 1,
					rest_seconds: null,
					scaled_notes: null,
					foundations_notes: null,
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
							notes: null,
							movements: { id: 'deadlift', name: 'Deadlift' },
						},
					],
				},
			],
		},
	],
} satisfies WorkoutDetail;

describe('workout sharing formatters', () => {
	it('builds a public movement summary without coach notes', () => {
		const summary = buildWorkoutShareDescription(workout);
		expect(summary).toBe('100 x Deadlift');
		expect(summary).not.toContain('Private note');
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
