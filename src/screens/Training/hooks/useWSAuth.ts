import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';

export const useWSAuth = () => {
	const { state, retrySession, signOut } = useWorkoutStudio();
	return { state, retry: retrySession, signOut };
};
