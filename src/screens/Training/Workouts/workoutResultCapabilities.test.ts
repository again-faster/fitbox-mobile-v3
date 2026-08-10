import { workoutResultCapabilities } from './workoutResultCapabilities';

describe('workoutResultCapabilities', () => {
	it('keeps workout reading available while disabling result writes', () => {
		expect(workoutResultCapabilities(false)).toEqual({
			canReadWorkout: true,
			canStart: false,
			canLogAggregateScore: false,
			canLogSectionScore: false,
			canFinish: false,
		});
	});

	it('enables every workout result action when results are enabled', () => {
		expect(workoutResultCapabilities(true)).toEqual({
			canReadWorkout: true,
			canStart: true,
			canLogAggregateScore: true,
			canLogSectionScore: true,
			canFinish: true,
		});
	});
});
