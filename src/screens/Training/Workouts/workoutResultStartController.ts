type SettleWorkoutResultStartInput = {
	startedResult: Promise<string>;
	isCurrent: () => boolean;
	accept: (workoutResultId: string) => void;
	discard: (workoutResultId: string) => Promise<void>;
};

export const settleWorkoutResultStart = async ({
	startedResult,
	isCurrent,
	accept,
	discard,
}: SettleWorkoutResultStartInput): Promise<void> => {
	const workoutResultId = await startedResult;
	if (isCurrent()) {
		accept(workoutResultId);
		return;
	}
	await discard(workoutResultId).catch(() => undefined);
};
