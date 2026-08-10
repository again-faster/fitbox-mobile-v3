export const shouldShowWorkoutResultShare = (resultsEnabled: boolean) =>
	resultsEnabled;

export const runWorkoutResultShare = (
	isCurrentlyEnabled: () => boolean,
	share: () => void,
) => {
	if (isCurrentlyEnabled()) share();
};
