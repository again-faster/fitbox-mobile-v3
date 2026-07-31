export type WorkoutDetailTab = 'overview' | 'leaderboard';

export const initialWorkoutDetailTab = (
	requestedTab?: WorkoutDetailTab,
): WorkoutDetailTab => requestedTab ?? 'overview';
