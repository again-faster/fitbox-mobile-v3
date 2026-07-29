import type {
	BlockMovement,
	WorkoutDetail,
	WorkoutResult,
} from '@/services/workoutStudio/types';

export const SHARE_DESCRIPTION_MAX_LENGTH = 180;

const SECTION_PREVIEW_MAX_LENGTH = 72;

const compactWhitespace = (value?: string | null) =>
	value?.split(/\s+/).filter(Boolean).join(' ').trim() ?? '';

const truncateAtWord = (value: string, limit: number) => {
	if (value.length <= limit) return value;
	if (limit <= 1) return value.slice(0, Math.max(0, limit));
	const candidate = value.slice(0, limit - 1).trimEnd();
	const boundary = candidate.lastIndexOf(' ');
	return `${(boundary > 0 ? candidate.slice(0, boundary) : candidate).trimEnd()}…`;
};

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
	maxLength = SHARE_DESCRIPTION_MAX_LENGTH,
) => {
	if (!workout) return '';
	const limit = Math.max(0, Math.floor(maxLength));
	const workoutName = compactWhitespace(workout.name);
	if (!workoutName || limit === 0) return '';
	if (workoutName.length >= limit) return truncateAtWord(workoutName, limit);

	const sectionSummaries = workout.workout_sections
		.slice()
		.sort((left, right) => left.position - right.position)
		.map((section) => {
			const sectionName =
				compactWhitespace(section.name) ||
				compactWhitespace(section.section_mode.replace(/_/g, ' '));
			const visibleNote = compactWhitespace(section.coach_notes);
			const movementSummaries = section.section_blocks
				.slice()
				.sort((left, right) => left.position - right.position)
				.flatMap((block) =>
					block.block_movements
						.slice()
						.sort((left, right) => left.position - right.position),
				)
				.map(movementSummary)
				.filter(
					(summary, index, all) => all.indexOf(summary) === index,
				);
			const detail = visibleNote || movementSummaries.join(', ');
			if (!sectionName || !detail) return null;
			return `${sectionName}: ${truncateAtWord(
				detail,
				SECTION_PREVIEW_MAX_LENGTH,
			)}`;
		})
		.filter((summary): summary is string => summary !== null);

	return sectionSummaries.reduce(
		(state, summary) => {
			if (state.stopped || state.description.length >= limit)
				return state;
			const separator = state.description === workoutName ? ' — ' : ' · ';
			const available =
				limit - state.description.length - separator.length;
			if (available <= 0) return { ...state, stopped: true };
			const bounded = truncateAtWord(summary, available);
			if (!bounded) return { ...state, stopped: true };
			return {
				description: `${state.description}${separator}${bounded}`,
				stopped: bounded !== summary,
			};
		},
		{ description: workoutName, stopped: false },
	).description;
};
