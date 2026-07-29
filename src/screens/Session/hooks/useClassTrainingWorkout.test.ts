import * as classTrainingWorkoutService from '../../../services/workoutStudio/classTrainingWorkout';
import {
	classTrainingWorkoutQueryKey,
	classTrainingWorkoutQueryOptions,
	shouldRefreshClassTrainingResolution,
} from './useClassTrainingWorkout';

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

describe('shouldRefreshClassTrainingResolution', () => {
	it.each([undefined, { status: 'offline' }, { status: 'auth' }, { status: 'error' }] as const)(
		'refreshes transient resolution %p',
		resolution => {
			expect(shouldRefreshClassTrainingResolution(resolution)).toBe(true);
		},
	);

	it.each([
		{ status: 'resolved', workoutId: 'workout-1' },
		{ status: 'not_mapped' },
		{ status: 'ambiguous' },
	] as const)('reuses stable resolution %p', resolution => {
		expect(shouldRefreshClassTrainingResolution(resolution)).toBe(false);
	});
});

describe('classTrainingWorkoutQueryOptions', () => {
	it('keeps the exact query definition for enabled params', async () => {
		const params = {
			tenantId: 'tenant-1',
			classId: 42,
			eventId: 1001,
			sessionDate: '2026-07-29',
		};
		const resolution = { status: 'resolved', workoutId: 'workout-1' } as const;
		const resolver = jest
			.spyOn(classTrainingWorkoutService, 'resolveClassTrainingWorkout')
			.mockResolvedValueOnce(resolution);

		const options = classTrainingWorkoutQueryOptions(params);

		expect(options.queryKey).toEqual(classTrainingWorkoutQueryKey(params));
		expect(options.enabled).toBe(true);
		expect(options.staleTime).toBe(300_000);
		await expect(options.queryFn?.()).resolves.toEqual(resolution);
		expect(resolver).toHaveBeenCalledWith(params);
	});

	it('keeps the disabled query inert', async () => {
		const options = classTrainingWorkoutQueryOptions(null);

		expect(options.queryKey).toEqual(classTrainingWorkoutQueryKey(null));
		expect(options.enabled).toBe(false);
		expect(options.staleTime).toBe(300_000);
		await expect(options.queryFn?.()).resolves.toEqual({
			status: 'not_mapped',
		});
	});
});
