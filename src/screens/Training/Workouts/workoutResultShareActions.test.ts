import {
	runWorkoutResultShare,
	shouldShowWorkoutResultShare,
} from './workoutResultShareActions';

describe('workout result share actions', () => {
	it('hides and blocks sharing when results are disabled', () => {
		const share = jest.fn();

		expect(shouldShowWorkoutResultShare(false)).toBe(false);
		runWorkoutResultShare(() => false, share);

		expect(share).not.toHaveBeenCalled();
	});

	it('shows and runs sharing when results are enabled', () => {
		const share = jest.fn();

		expect(shouldShowWorkoutResultShare(true)).toBe(true);
		runWorkoutResultShare(() => true, share);

		expect(share).toHaveBeenCalledTimes(1);
	});
});
