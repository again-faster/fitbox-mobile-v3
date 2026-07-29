import { classTrainingWorkoutQueryKey } from './useClassTrainingWorkout';

describe('classTrainingWorkoutQueryKey', () => {
	it('returns the exact enabled key', () => {
		expect(
			classTrainingWorkoutQueryKey({
				tenantId: 'tenant-1',
				classId: 42,
				eventId: 1001,
				sessionDate: '2026-07-29',
			}),
		).toEqual([
			'ws-class-training-workout',
			'tenant-1',
			'42',
			'1001',
			'2026-07-29',
		]);
	});

	it('returns a stable disabled key for null params', () => {
		expect(classTrainingWorkoutQueryKey(null)).toEqual([
			'ws-class-training-workout',
			'disabled',
		]);
	});
});
