import { createWorkoutResultStartCoordinator } from './workoutResultStartController';

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(next => {
		resolve = next;
	});
	return { promise, resolve };
};

describe('createWorkoutResultStartCoordinator', () => {
	it('accepts a result from the current enabled attempt', async () => {
		const accept = jest.fn();
		const cleanup = jest.fn();
		const coordinator = createWorkoutResultStartCoordinator({
			accept,
			cleanup,
			retainCleanup: jest.fn(),
		});

		await coordinator.start(Promise.resolve('result-current'));

		expect(accept).toHaveBeenCalledWith('result-current');
		expect(cleanup).not.toHaveBeenCalled();
	});

	it('does not delete a shared id while a successor attempt adopts it', async () => {
		const first = deferred<string>();
		const second = deferred<string>();
		const accept = jest.fn();
		const cleanup = jest.fn().mockResolvedValue(undefined);
		const coordinator = createWorkoutResultStartCoordinator({
			accept,
			cleanup,
			retainCleanup: jest.fn(),
		});

		const firstStart = coordinator.start(first.promise);
		coordinator.invalidate();
		const secondStart = coordinator.start(second.promise);
		first.resolve('shared-upsert-id');
		await Promise.resolve();

		expect(cleanup).not.toHaveBeenCalled();

		second.resolve('shared-upsert-id');
		await Promise.all([firstStart, secondStart]);

		expect(accept).toHaveBeenCalledTimes(1);
		expect(accept).toHaveBeenCalledWith('shared-upsert-id');
		expect(cleanup).not.toHaveBeenCalled();
	});

	it('retains a failed stale cleanup for durable retry', async () => {
		const first = deferred<string>();
		const retainCleanup = jest.fn().mockResolvedValue(undefined);
		const coordinator = createWorkoutResultStartCoordinator({
			accept: jest.fn(),
			cleanup: jest.fn().mockRejectedValue(new Error('offline')),
			retainCleanup,
		});

		const firstStart = coordinator.start(first.promise);
		coordinator.invalidate();
		first.resolve('orphan-result');
		await firstStart;

		expect(retainCleanup).toHaveBeenCalledWith('orphan-result');
	});
});
