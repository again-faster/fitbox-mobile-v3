import { getMemberWorkouts } from './workouts';
import type { WorkoutAssignment } from './types';

export type ClassTrainingResolution =
	| { status: 'resolved'; workoutId: string }
	| { status: 'not_mapped' | 'ambiguous' | 'offline' | 'auth' | 'error' };

type ResolveClassTrainingWorkoutParams = {
	tenantId: string;
	classId: string | number;
	eventId: string | number;
	sessionDate: string;
};

type WorkoutLoader = (
	tenantId: string,
	from: string,
	to: string,
) => Promise<WorkoutAssignment[]>;

const normalizeId = (value: string | number) => {
	const normalized = String(value).trim();
	return /^\d+$/.test(normalized)
		? normalized.replace(/^0+(?=\d)/, '')
		: normalized;
};

const failureStatus = (
	error: unknown,
): Exclude<
	ClassTrainingResolution['status'],
	'resolved' | 'not_mapped' | 'ambiguous'
> => {
	const message = error instanceof Error ? error.message.toLowerCase() : '';
	if (
		message.includes('expired') ||
		message.includes('unauthorized') ||
		message.includes('training session')
	) {
		return 'auth';
	}
	if (
		error instanceof TypeError ||
		message.includes('network') ||
		message.includes('offline') ||
		message.includes('fetch')
	) {
		return 'offline';
	}
	return 'error';
};

export const resolveClassTrainingWorkout = async (
	params: ResolveClassTrainingWorkoutParams,
	loadWorkouts: WorkoutLoader = getMemberWorkouts,
): Promise<ClassTrainingResolution> => {
	try {
		const workouts = await loadWorkouts(
			params.tenantId,
			params.sessionDate,
			params.sessionDate,
		);
		const classId = normalizeId(params.classId);
		const eventId = normalizeId(params.eventId);
		const matches = workouts.filter(workout => {
			const { source } = workout;
			return (
				source?.type === 'class' &&
				source.class_id !== undefined &&
				normalizeId(source.class_id) === classId &&
				source.event_ids?.some(id => normalizeId(id) === eventId) ===
					true
			);
		});

		if (matches.length === 0) return { status: 'not_mapped' };
		if (matches.length > 1) return { status: 'ambiguous' };
		const [match] = matches;
		return { status: 'resolved', workoutId: match!.workout_id };
	} catch (error) {
		return { status: failureStatus(error) };
	}
};
