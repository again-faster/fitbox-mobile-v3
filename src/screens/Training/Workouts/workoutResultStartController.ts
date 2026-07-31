/* eslint-disable no-await-in-loop, no-continue */

type WorkoutResultStartCoordinatorDependencies = {
	accept: (workoutResultId: string) => void;
	cleanup: (workoutResultId: string) => Promise<void>;
	retainCleanup: (workoutResultId: string) => Promise<void>;
	failCurrent?: (error: unknown) => void;
};

type StaleResult = { generation: number; workoutResultId: string };

export const createWorkoutResultStartCoordinator = ({
	accept,
	cleanup,
	retainCleanup,
	failCurrent,
}: WorkoutResultStartCoordinatorDependencies) => {
	let generation = 0;
	let acceptedResultId: string | null = null;
	const pendingGenerations = new Set<number>();
	const staleResults: StaleResult[] = [];

	const drainStaleResults = async () => {
		for (let index = staleResults.length - 1; index >= 0; index -= 1) {
			const stale = staleResults[index]!;
			const hasPendingSuccessor = [...pendingGenerations].some(
				pendingGeneration => pendingGeneration > stale.generation,
			);
			if (hasPendingSuccessor) continue;
			staleResults.splice(index, 1);
			if (acceptedResultId === stale.workoutResultId) continue;
			try {
				await cleanup(stale.workoutResultId);
			} catch {
				await retainCleanup(stale.workoutResultId);
			}
		}
	};

	return {
		invalidate: () => {
			generation += 1;
		},
		start: async (startedResult: Promise<string>) => {
			generation += 1;
			const attemptGeneration = generation;
			pendingGenerations.add(attemptGeneration);
			try {
				const workoutResultId = await startedResult;
				pendingGenerations.delete(attemptGeneration);
				if (attemptGeneration === generation) {
					acceptedResultId = workoutResultId;
					accept(workoutResultId);
				} else {
					staleResults.push({
						generation: attemptGeneration,
						workoutResultId,
					});
				}
				await drainStaleResults();
			} catch (error) {
				pendingGenerations.delete(attemptGeneration);
				if (attemptGeneration === generation) failCurrent?.(error);
				await drainStaleResults();
			}
		},
	};
};
