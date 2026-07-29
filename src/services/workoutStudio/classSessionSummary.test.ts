import type { BlockMovement, WorkoutDetail, WorkoutSection } from './types';
import { buildClassSessionSummary } from './classSessionSummary';

const movement = (
	id: string,
	name: string,
	position: number,
	overrides: Partial<BlockMovement> = {},
): BlockMovement => ({
	id: `row-${id}-${position}`,
	position,
	sets: null,
	reps_scheme: null,
	weight_kg: null,
	weight_scheme: null,
	duration_seconds: null,
	distance_meters: null,
	calories: null,
	set_scheme: null,
	advanced: null,
	notes: null,
	movements: { id, name },
	...overrides,
});

const section = (
	id: string,
	name: string,
	position: number,
	movements: BlockMovement[],
	overrides: Partial<WorkoutSection> = {},
): WorkoutSection => ({
	id,
	name,
	position,
	section_mode: 'workout',
	coach_notes: null,
	scoring_type: 'none',
	is_scored: true,
	score_collection_mode: 'section',
	time_cap_seconds: null,
	rounds: null,
	leaderboard_enabled: false,
	leaderboard_calculation: null,
	leaderboard_sort_direction: null,
	leaderboard_score_type: null,
	aggregate_formula: null,
	aggregate_group_id: null,
	section_blocks: [
		{
			id: `block-${id}`,
			label: null,
			intent: '',
			position: 0,
			rest_seconds: null,
			scaled_notes: null,
			foundations_notes: null,
			block_movements: movements,
		},
	],
	...overrides,
});

const workout = (
	workoutSections: WorkoutSection[],
	overrides: Partial<WorkoutDetail> = {},
): WorkoutDetail => ({
	id: 'workout-1',
	name: 'Tuesday class',
	estimated_duration_minutes: 45,
	workout_sections: workoutSections,
	...overrides,
});

describe('buildClassSessionSummary', () => {
	it('preserves programmed order and includes an unscored Warm-up', () => {
		const input = workout([
			section('main', 'Main', 2, [movement('burpee', 'Burpee', 0)]),
			section(
				'warm-up',
				'Warm-up',
				0,
				[movement('row', 'Row', 1), movement('bike', 'Bike', 0)],
				{
					is_scored: false,
					section_blocks: [
						{
							id: 'warm-later',
							label: null,
							intent: '',
							position: 2,
							rest_seconds: null,
							scaled_notes: null,
							foundations_notes: null,
							block_movements: [movement('row', 'Row', 1)],
						},
						{
							id: 'warm-first',
							label: null,
							intent: '',
							position: 0,
							rest_seconds: null,
							scaled_notes: null,
							foundations_notes: null,
							block_movements: [
								movement('ski', 'Ski', 2),
								movement('bike', 'Bike', 0),
							],
						},
					],
				},
			),
		]);
		const before = JSON.stringify(input);

		expect(buildClassSessionSummary(input)).toEqual({
			workoutId: 'workout-1',
			workoutName: 'Tuesday class',
			sections: [
				{
					id: 'warm-up',
					name: 'Warm-up',
					details: [],
					movements: ['Bike', 'Ski', 'Row'],
					remainingMovementCount: 0,
				},
				{
					id: 'main',
					name: 'Main',
					details: [],
					movements: ['Burpee'],
					remainingMovementCount: 0,
				},
			],
		});
		expect(JSON.stringify(input)).toBe(before);
	});

	it('formats rounds and public movement prescriptions by priority', () => {
		const input = workout([
			section(
				'conditioning',
				'Conditioning',
				0,
				[
					movement('run', 'Run', 0, { distance_meters: 400 }),
					movement('squat', 'Back Squat', 1, {
						sets: 4,
						reps_scheme: '5',
						weight_kg: 80,
						distance_meters: 999,
					}),
					movement('plank', 'Plank', 2, { duration_seconds: 60 }),
					movement('bike', 'Bike', 3, { duration_seconds: 3670 }),
					movement('row', 'Row', 4, { calories: 20 }),
				],
				{ rounds: 3 },
			),
		]);

		expect(buildClassSessionSummary(input, 10)).toEqual({
			workoutId: 'workout-1',
			workoutName: 'Tuesday class',
			sections: [
				{
					id: 'conditioning',
					name: 'Conditioning',
					details: ['3 rounds'],
					movements: [
						'400 m Run',
						'4 sets · 5 x Back Squat @ 80 kg',
						'1m Plank',
						'1h 1m 10s Bike',
						'20 cal Row',
					],
					remainingMovementCount: 0,
				},
			],
		});
	});

	it('uses the singular label for one round', () => {
		const input = workout([
			section(
				'conditioning',
				'Conditioning',
				0,
				[movement('row', 'Row', 0)],
				{ rounds: 1 },
			),
		]);

		expect(buildClassSessionSummary(input)?.sections[0]?.details).toEqual([
			'1 round',
		]);
	});

	it('deduplicates movement identities before default truncation', () => {
		const input = workout([
			section('main', 'Main', 0, [
				movement('squat', 'Squat', 0, { reps_scheme: '5' }),
				movement('squat', 'Squat', 1, { reps_scheme: '10' }),
				movement('press', 'Press', 2),
				movement('row', 'Row', 3),
				movement('run', 'Run', 4),
			]),
		]);

		expect(buildClassSessionSummary(input)?.sections[0]).toEqual({
			id: 'main',
			name: 'Main',
			details: [],
			movements: ['5 x Squat', 'Press', 'Row'],
			remainingMovementCount: 1,
		});
	});

	it('never serializes staff-only workout fields', () => {
		const privateSecrets = [
			'COACH_SECRET',
			'INTENT_SECRET',
			'SCALED_SECRET',
			'FOUNDATIONS_SECRET',
			'MOVEMENT_NOTES_SECRET',
			'ADVANCED_SECRET',
			'SET_SCHEME_SECRET',
			'WEIGHT_SCHEME_SECRET',
			'AGGREGATE_SECRET',
		];
		const privateMovement = movement('deadlift', 'Deadlift', 0, {
			weight_scheme: 'WEIGHT_SCHEME_SECRET',
			set_scheme: [{ private: 'SET_SCHEME_SECRET' }],
			advanced: { private: 'ADVANCED_SECRET' },
			notes: 'MOVEMENT_NOTES_SECRET',
		});
		const privateSection = section('strength', 'Strength', 0, [], {
			coach_notes: 'COACH_SECRET',
			aggregate_formula: { private: 'AGGREGATE_SECRET' },
			section_blocks: [
				{
					id: 'private-block',
					label: null,
					intent: 'INTENT_SECRET',
					position: 0,
					rest_seconds: null,
					scaled_notes: 'SCALED_SECRET',
					foundations_notes: 'FOUNDATIONS_SECRET',
					block_movements: [privateMovement],
				},
			],
		});

		const serialized = JSON.stringify(
			buildClassSessionSummary(workout([privateSection])),
		);

		privateSecrets.forEach((secret) =>
			expect(serialized).not.toContain(secret),
		);
		expect(serialized).toContain('Deadlift');
	});

	it('omits workout sections without public movements', () => {
		const input = workout([
			section('empty', 'Empty', 0, [movement('blank', '   ', 0)]),
			section('main', 'Main', 1, [movement('squat', 'Squat', 0)]),
		]);

		expect(buildClassSessionSummary(input)?.sections).toEqual([
			{
				id: 'main',
				name: 'Main',
				details: [],
				movements: ['Squat'],
				remainingMovementCount: 0,
			},
		]);
	});

	it('returns null for undefined, notes-only, and movement-empty workouts', () => {
		const notesOnly = workout([
			section('notes', 'Coach briefing', 0, [], {
				section_mode: 'notes',
			}),
		]);
		const empty = workout([
			section('empty', 'Empty', 0, [movement('missing-name', '   ', 0)]),
		]);

		expect(buildClassSessionSummary()).toBeNull();
		expect(buildClassSessionSummary(notesOnly)).toBeNull();
		expect(buildClassSessionSummary(empty)).toBeNull();
	});
});
