import {
	flushWorkoutResultCleanupQueue,
	queueWorkoutResultCleanup,
	type WorkoutResultCleanupEntry,
	type WorkoutResultCleanupQueueDependencies,
} from './workoutResultCleanupQueue';

describe('workout result cleanup queue', () => {
	it('retains a failed cleanup and removes it after a successful retry', async () => {
		let stored: WorkoutResultCleanupEntry[] = [];
		const removeResult = jest
			.fn()
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValueOnce(undefined);
		const deps: WorkoutResultCleanupQueueDependencies = {
			load: () => Promise.resolve(stored),
			save: entries => {
				stored = entries;
				return Promise.resolve();
			},
			removeResult,
		};
		const entry: WorkoutResultCleanupEntry = {
			id: 'cleanup-1',
			workoutResultId: 'result-1',
			userId: 'user-1',
			tenantId: 'tenant-1',
			queuedAt: '2026-07-31T00:00:00.000Z',
		};

		await queueWorkoutResultCleanup(entry, deps);
		await expect(
			flushWorkoutResultCleanupQueue('user-1', 'tenant-1', deps),
		).resolves.toEqual({ removed: 0, remaining: 1 });
		expect(stored).toEqual([entry]);

		await expect(
			flushWorkoutResultCleanupQueue('user-1', 'tenant-1', deps),
		).resolves.toEqual({ removed: 1, remaining: 0 });
		expect(stored).toEqual([]);
		expect(removeResult).toHaveBeenCalledTimes(2);
	});
});
