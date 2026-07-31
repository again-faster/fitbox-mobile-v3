export type WorkoutResultCapabilities = {
	canReadWorkout: true;
	canStart: boolean;
	canLogAggregateScore: boolean;
	canLogSectionScore: boolean;
	canFinish: boolean;
};

export const workoutResultCapabilities = (
	resultsEnabled: boolean,
): WorkoutResultCapabilities => ({
	canReadWorkout: true,
	canStart: resultsEnabled,
	canLogAggregateScore: resultsEnabled,
	canLogSectionScore: resultsEnabled,
	canFinish: resultsEnabled,
});
