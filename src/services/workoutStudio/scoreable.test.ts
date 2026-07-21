import { scoreEntryDescriptors, scoreKindForSection } from './scoreable';
import type { WorkoutSection } from './types';

const section = (overrides: Partial<WorkoutSection> = {}): WorkoutSection => ({
	id: 'section-1',
	name: 'Strength',
	position: 0,
	section_mode: 'workout',
	coach_notes: null,
	scoring_type: 'strength',
	is_scored: true,
	score_collection_mode: 'section',
	time_cap_seconds: null,
	rounds: null,
	leaderboard_enabled: true,
	leaderboard_calculation: 'max',
	leaderboard_sort_direction: 'desc',
	leaderboard_score_type: null,
	aggregate_formula: null,
	aggregate_group_id: null,
	section_blocks: [],
	...overrides,
});

describe('scoreKindForSection', () => {
	it('uses the configured display score type before workout-type inference', () => {
		expect(
			scoreKindForSection(
				section({
					scoring_type: 'emom',
					leaderboard_score_type: 'reps',
				}),
			),
		).toBe('reps');
	});

	it('maps common workout types when no display score type is saved', () => {
		expect(scoreKindForSection(section({ scoring_type: 'for_time' }))).toBe(
			'time',
		);
		expect(scoreKindForSection(section({ scoring_type: 'amrap' }))).toBe(
			'rounds_reps',
		);
		expect(scoreKindForSection(section({ scoring_type: 'strength' }))).toBe(
			'load',
		);
	});
});

describe('scoreEntryDescriptors', () => {
	it('uses the longest prescribed set scheme for per-set scoring', () => {
		const value = section({
			score_collection_mode: 'per_set',
			section_blocks: [
				{
					id: 'block-1',
					label: null,
					intent: 'strength',
					position: 0,
					rest_seconds: null,
					scaled_notes: null,
					foundations_notes: null,
					block_movements: [
						{
							id: 'movement-row-1',
							position: 0,
							sets: 3,
							reps_scheme: null,
							weight_kg: null,
							weight_scheme: null,
							duration_seconds: null,
							distance_meters: null,
							calories: null,
							set_scheme: [{}, {}, {}, {}, {}],
							advanced: null,
							notes: null,
							movements: { id: 'movement-1', name: 'Deadlift' },
						},
					],
				},
			],
		});

		expect(scoreEntryDescriptors(value).map(item => item.label)).toEqual([
			'Set 1',
			'Set 2',
			'Set 3',
			'Set 4',
			'Set 5',
		]);
	});

	it('uses block labels and ids for per-phase scoring', () => {
		const value = section({
			score_collection_mode: 'per_phase',
			section_blocks: [
				{
					id: 'phase-a',
					label: 'Bike',
					intent: 'conditioning',
					position: 0,
					rest_seconds: null,
					scaled_notes: null,
					foundations_notes: null,
					block_movements: [],
				},
				{
					id: 'phase-b',
					label: null,
					intent: 'conditioning',
					position: 1,
					rest_seconds: null,
					scaled_notes: null,
					foundations_notes: null,
					block_movements: [],
				},
			],
		});

		expect(scoreEntryDescriptors(value)).toEqual([
			{ label: 'Bike', blockId: 'phase-a' },
			{ label: 'Phase 2', blockId: 'phase-b' },
		]);
	});
});
