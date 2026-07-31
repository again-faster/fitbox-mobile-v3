import type { WorkoutAssignment } from './types';
import { resolveClassTrainingWorkout } from './classTrainingWorkout';

const assignment = (
	overrides: Partial<WorkoutAssignment> = {},
): WorkoutAssignment => ({
	id: 'assignment-1',
	workout_id: 'workout-1',
	due_date: '2026-07-29',
	notes: null,
	workouts: { name: 'Wednesday class', estimated_duration_minutes: 60 },
	source: {
		type: 'class',
		class_id: '42',
		event_ids: ['1001'],
	},
	...overrides,
});

const params = {
	tenantId: 'tenant-1',
	classId: 42,
	eventId: 1001,
	sessionDate: '2026-07-29',
};

describe('resolveClassTrainingWorkout', () => {
	it('returns the workout for the exact class and event', async () => {
		const result = await resolveClassTrainingWorkout(params, () =>
			Promise.resolve([assignment()]),
		);

		expect(result).toEqual({ status: 'resolved', workoutId: 'workout-1' });
	});

	it('normalizes numeric Fitbox ids and string Workout Studio ids', async () => {
		const result = await resolveClassTrainingWorkout(params, () =>
			Promise.resolve([
				assignment({
					source: {
						type: 'class',
						class_id: ' 42 ',
						event_ids: ['01001', '1001'],
					},
				}),
			]),
		);

		expect(result.status).toBe('resolved');
	});

	it('does not guess from the date when the class or event is wrong', async () => {
		const result = await resolveClassTrainingWorkout(params, () =>
			Promise.resolve([
				assignment({
					workout_id: 'wrong-class',
					source: {
						type: 'class',
						class_id: '99',
						event_ids: ['1001'],
					},
				}),
				assignment({
					workout_id: 'wrong-event',
					source: {
						type: 'class',
						class_id: '42',
						event_ids: ['2002'],
					},
				}),
			]),
		);

		expect(result).toEqual({ status: 'not_mapped' });
	});

	it('reports ambiguous exact mappings instead of choosing one', async () => {
		const result = await resolveClassTrainingWorkout(params, () =>
			Promise.resolve([
				assignment(),
				assignment({ id: 'assignment-2', workout_id: 'workout-2' }),
			]),
		);

		expect(result).toEqual({ status: 'ambiguous' });
	});

	it.each([
		['Your Training session has expired.', 'auth'],
		['Network request failed', 'offline'],
		['Unexpected response', 'error'],
	] as const)('maps %s failures to %s', async (message, status) => {
		const result = await resolveClassTrainingWorkout(params, () =>
			Promise.reject(new Error(message)),
		);

		expect(result).toEqual({ status });
	});
});
