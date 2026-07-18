import type {
	BlockMovement,
	ScoreCollectionMode,
	WorkoutSection,
} from './types';

const COLLECTION_LABELS: Record<ScoreCollectionMode, string> = {
	section: 'One score',
	per_set: 'Score each set',
	per_interval: 'Score each interval',
	per_round: 'Score each round',
	per_phase: 'Score each phase',
	aggregate: 'Combined score',
};

const CALCULATION_LABELS: Record<string, string> = {
	fastest_time: 'Fastest time',
	highest: 'Highest score',
	lowest: 'Lowest score',
	max: 'Best entry',
	min: 'Lowest entry',
	avg: 'Average',
	sum: 'Total',
	total_reps: 'Total reps',
	best: 'Best entry',
	worst: 'Lowest entry',
};

export const sectionScoringSummary = (
	section: WorkoutSection,
): string | null => {
	if (section.section_mode === 'notes') return 'Notes';
	if (!section.is_scored) return null;
	const collection = COLLECTION_LABELS[section.score_collection_mode];
	if (!section.leaderboard_enabled) return collection;
	const ranking = section.leaderboard_calculation
		? (CALCULATION_LABELS[section.leaderboard_calculation] ?? 'Leaderboard')
		: 'Leaderboard';
	return `${collection} · ${ranking}`;
};

export const movementPrescriptionParts = (
	movement: BlockMovement,
): string[] => {
	const parts: string[] = [];
	if (movement.sets) parts.push(`${movement.sets} sets`);
	if (movement.reps_scheme) parts.push(movement.reps_scheme);
	if (movement.weight_scheme) parts.push(movement.weight_scheme);
	else if (movement.weight_kg) parts.push(`@ ${movement.weight_kg}kg`);
	if (movement.duration_seconds) parts.push(`${movement.duration_seconds}s`);
	if (movement.distance_meters) parts.push(`${movement.distance_meters}m`);
	if (movement.calories) parts.push(`${movement.calories} cal`);
	const advanced = movement.advanced ?? {};
	if (typeof advanced.percent_1rm === 'number')
		parts.push(`${advanced.percent_1rm}% 1RM`);
	if (typeof advanced.rpe === 'number') parts.push(`RPE ${advanced.rpe}`);
	if (typeof advanced.rir === 'number') parts.push(`RIR ${advanced.rir}`);
	if (typeof advanced.tempo === 'string' && advanced.tempo)
		parts.push(advanced.tempo);
	return parts;
};
