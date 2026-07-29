import { initialWorkoutDetailTab } from './workoutDetailTabs';

describe('initialWorkoutDetailTab', () => {
	it('defaults existing callers to the workout overview', () => {
		expect(initialWorkoutDetailTab()).toBe('overview');
	});

	it('opens class results on the leaderboard', () => {
		expect(initialWorkoutDetailTab('leaderboard')).toBe('leaderboard');
	});
});
