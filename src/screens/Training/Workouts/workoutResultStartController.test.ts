import { settleWorkoutResultStart } from './workoutResultStartController';

const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>(next => {
		resolve = next;
	});
	return { promise, resolve };
};

describe('settleWorkoutResultStart', () => {
	it('discards a result that resolves after its start attempt becomes stale', async () => {
		const startedResult = deferred<string>();
		const accept = jest.fn();
		const discard = jest.fn().mockResolvedValue(undefined);
		let current = true;
		const settling = settleWorkoutResultStart({
			startedResult: startedResult.promise,
			isCurrent: () => current,
			accept,
			discard,
		});

		current = false;
		startedResult.resolve('result-stale');
		await settling;

		expect(accept).not.toHaveBeenCalled();
		expect(discard).toHaveBeenCalledWith('result-stale');
	});

	it('accepts a result from the current enabled start attempt', async () => {
		const accept = jest.fn();
		const discard = jest.fn();

		await settleWorkoutResultStart({
			startedResult: Promise.resolve('result-current'),
			isCurrent: () => true,
			accept,
			discard,
		});

		expect(accept).toHaveBeenCalledWith('result-current');
		expect(discard).not.toHaveBeenCalled();
	});
});
