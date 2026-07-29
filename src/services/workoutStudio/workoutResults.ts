import type { ScalingLevel } from './types';
import { wsApi } from './api';

type StartWorkoutResultInput = {
	workoutId: string;
	assignmentId?: string;
	athleteId: string;
	tenantId: string;
	clientSessionId: string;
	scalingLevel: ScalingLevel;
	startedAt: string;
};

type CompleteWorkoutResultInput = {
	completedAt: string;
	durationSeconds: number;
	totalVolumeKg: number;
};

type VolumeSet = {
	completed: boolean;
	reps: string;
	weight: string;
};

export const startWorkoutResult = async (
	input: StartWorkoutResultInput,
): Promise<string> => {
	const rows = await wsApi()
		.post('workout_results', {
			searchParams: { on_conflict: 'client_session_id' },
			json: {
				workout_id: input.workoutId,
				assignment_id: input.assignmentId ?? null,
				athlete_id: input.athleteId,
				tenant_id: input.tenantId,
				client_session_id: input.clientSessionId,
				started_at: input.startedAt,
				is_rx: input.scalingLevel === 'rx',
				scaling_level: input.scalingLevel,
			},
			headers: {
				Prefer: 'resolution=merge-duplicates,return=representation',
			},
		})
		.json<{ id: string }[]>();
	const result = rows[0];
	if (!result) throw new Error('Workout result was not created.');
	return result.id;
};

export const completeWorkoutResult = async (
	workoutResultId: string,
	input: CompleteWorkoutResultInput,
): Promise<void> => {
	await wsApi().patch(`workout_results?id=eq.${workoutResultId}`, {
		json: {
			completed_at: input.completedAt,
			duration_seconds: input.durationSeconds,
			total_volume_kg: input.totalVolumeKg,
		},
		headers: { Prefer: 'return=minimal' },
	});
};

export const calculateWorkoutVolumeKg = (sets: VolumeSet[]): number =>
	sets.reduce((total, set) => {
		if (!set.completed) return total;
		const reps = Number(set.reps);
		const weight = Number(set.weight);
		if (!Number.isFinite(reps) || !Number.isFinite(weight)) return total;
		return total + reps * weight;
	}, 0);
