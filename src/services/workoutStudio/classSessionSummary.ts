import type { BlockMovement, WorkoutDetail } from './types';

export type ClassSessionSummarySection = {
	id: string;
	name: string;
	details: string[];
	movements: string[];
	remainingMovementCount: number;
};

export type ClassSessionSummary = {
	workoutId: string;
	workoutName: string;
	sections: ClassSessionSummarySection[];
};

const formatDuration = (totalSeconds: number) => {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;
	const parts: string[] = [];

	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

	return parts.join(' ');
};

const formatMovement = (movement: BlockMovement) => {
	const name = movement.movements.name.trim();
	if (!name) return null;

	const reps = movement.reps_scheme?.trim();
	let summary = name;
	if (reps) summary = `${reps} x ${name}`;
	else if (movement.distance_meters != null) {
		summary = `${movement.distance_meters} m ${name}`;
	} else if (movement.duration_seconds != null) {
		summary = `${formatDuration(movement.duration_seconds)} ${name}`;
	} else if (movement.calories != null) {
		summary = `${movement.calories} cal ${name}`;
	}

	if (movement.sets != null && movement.sets > 1) {
		summary = `${movement.sets} sets · ${summary}`;
	}
	if (movement.weight_kg != null) summary += ` @ ${movement.weight_kg} kg`;

	return summary;
};

export const buildClassSessionSummary = (
	workout?: WorkoutDetail,
	maxMovementsPerSection = 3,
): ClassSessionSummary | null => {
	if (!workout) return null;

	const movementLimit = Math.max(0, Math.floor(maxMovementsPerSection));
	let publicMovementCount = 0;
	const sections = workout.workout_sections
		.filter(section => section.section_mode === 'workout')
		.slice()
		.sort((left, right) => left.position - right.position)
		.map(section => {
			const seenMovementIds = new Set<string>();
			const movementSummaries: string[] = [];

			section.section_blocks
				.slice()
				.sort((left, right) => left.position - right.position)
				.forEach(block => {
					block.block_movements
						.slice()
						.sort((left, right) => left.position - right.position)
						.forEach(movement => {
							const movementId = movement.movements.id;
							if (seenMovementIds.has(movementId)) return;

							const summary = formatMovement(movement);
							if (!summary) return;

							seenMovementIds.add(movementId);
							movementSummaries.push(summary);
						});
				});

			publicMovementCount += movementSummaries.length;
			const movements = movementSummaries.slice(0, movementLimit);
			return {
				id: section.id,
				name: section.name,
				details: section.rounds ? [`${section.rounds} rounds`] : [],
				movements,
				remainingMovementCount: movementSummaries.length - movements.length,
			};
		});

	if (publicMovementCount === 0) return null;
	return {
		workoutId: workout.id,
		workoutName: workout.name,
		sections,
	};
};
