import { useQuery } from '@tanstack/react-query';

import {
	resolveClassTrainingWorkout,
	type ClassTrainingResolution,
} from '../../../services/workoutStudio/classTrainingWorkout';

export type ClassTrainingWorkoutParams = {
	tenantId: string;
	classId: string | number;
	eventId: string | number;
	sessionDate: string;
};

export const classTrainingWorkoutQueryKey = (
	params: ClassTrainingWorkoutParams | null,
) =>
	params === null
		? (['ws-class-training-workout', 'disabled'] as const)
		: ([
				'ws-class-training-workout',
				params.tenantId,
				String(params.classId),
				String(params.eventId),
				params.sessionDate,
			] as const);

export const shouldRefreshClassTrainingResolution = (
	resolution: ClassTrainingResolution | undefined,
) =>
	resolution === undefined ||
	resolution.status === 'offline' ||
	resolution.status === 'auth' ||
	resolution.status === 'error';

export const classTrainingWorkoutQueryOptions = (
	params: ClassTrainingWorkoutParams | null,
) => ({
	queryKey: classTrainingWorkoutQueryKey(params),
	queryFn: () =>
		params === null
			? Promise.resolve({ status: 'not_mapped' } as const)
			: resolveClassTrainingWorkout(params),
	enabled: params !== null,
	staleTime: 300_000,
});

export const useClassTrainingWorkout = (
	params: ClassTrainingWorkoutParams | null,
) =>
	useQuery<ClassTrainingResolution>(classTrainingWorkoutQueryOptions(params));
