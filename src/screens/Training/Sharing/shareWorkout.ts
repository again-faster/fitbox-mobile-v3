import type {
	BlockMovement,
	WorkoutDetail,
	WorkoutResult,
} from '@/services/workoutStudio/types';

export const formatShareDuration = (seconds: number) => {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remaining = seconds % 60;
	if (hours > 0) return `${hours}h ${minutes}m`;
	if (minutes > 0) return `${minutes}m ${remaining}s`;
	return `${remaining}s`;
};

export const formatShareScore = (result: WorkoutResult) => {
	if (result.score_time_seconds != null) {
		return formatShareDuration(result.score_time_seconds);
	}
	if (result.score_rounds != null) {
		return `${result.score_rounds} rounds${
			result.score_partial_reps ? ` + ${result.score_partial_reps}` : ''
		}`;
	}
	if (result.score_weight_kg != null) {
		return `${result.score_weight_kg} kg${
			result.score_reps ? ` x ${result.score_reps}` : ''
		}`;
	}
	if (result.score_reps != null) return `${result.score_reps} reps`;
	return null;
};

const movementSummary = (movement: BlockMovement) => {
	const name = movement.movements.name.trim();
	const reps = movement.reps_scheme?.trim();
	let prescription = name;

	if (reps) prescription = `${reps} x ${name}`;
	else if (movement.distance_meters != null) {
		prescription = `${movement.distance_meters} m ${name}`;
	} else if (movement.duration_seconds != null) {
		prescription = `${formatShareDuration(movement.duration_seconds)} ${name}`;
	} else if (movement.calories != null) {
		prescription = `${movement.calories} cal ${name}`;
	}

	if (movement.sets != null && movement.sets > 1) {
		prescription = `${movement.sets} sets · ${prescription}`;
	}
	if (movement.weight_kg != null) {
		prescription += ` @ ${movement.weight_kg} kg`;
	}
	return prescription;
};

export const buildWorkoutShareDescription = (
	workout?: WorkoutDetail,
	maxMovements = 4,
) => {
	if (!workout) return '';
	const summaries = workout.workout_sections
		.filter(section => section.section_mode === 'workout')
		.flatMap(section => section.section_blocks)
		.flatMap(block => block.block_movements)
		.map(movementSummary)
		.filter((summary, index, all) => all.indexOf(summary) === index);

	if (summaries.length === 0) return '';
	const visible = summaries.slice(0, maxMovements);
	const remaining = summaries.length - visible.length;
	return `${visible.join(' · ')}${remaining > 0 ? ` · +${remaining} more` : ''}`;
};
