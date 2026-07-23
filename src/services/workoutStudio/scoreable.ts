import type {
	BlockMovement,
	ScoreCollectionMode,
	WorkoutSection,
} from './types';
import { wsRpc } from './api';

export type SectionScorePayload = Partial<{
	time_seconds: number;
	reps: number;
	weight_kg: number;
	rounds: number;
	partial_reps: number;
	distance_meters: number;
	calories: number;
	points: number;
	completed: boolean;
	score_type: string;
}>;

export type SectionScoreEntryPayload = SectionScorePayload & {
	segment_index: number;
	segment_label?: string;
	block_id?: string;
	load_unit?: 'kg' | 'lb' | 'pct_1rm' | 'bodyweight' | 'other';
	text?: string;
	notes?: string;
};

export type AtomicSectionResult = {
	workout_result_id: string;
	section_result_id: string;
	entry_count: number;
	captured: boolean;
	duplicate: boolean;
};

export const createSubmissionId = (): string =>
	'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
		if (character === 'y')
			return ['8', '9', 'a', 'b'][Math.floor(Math.random() * 4)]!;
		return Math.floor(Math.random() * 16).toString(16);
	});

export const logSectionResultAtomic = async (input: {
	sectionId: string;
	sessionSubmissionId: string;
	sectionSubmissionId: string;
	completedAt?: string;
	scalingLevel?: string;
	score?: SectionScorePayload;
	entries?: SectionScoreEntryPayload[];
	notes?: string;
	assignmentId?: string;
}): Promise<AtomicSectionResult> => {
	const rows = await wsRpc<AtomicSectionResult[]>(
		'log_section_result_atomic',
		{
			p_section_id: input.sectionId,
			p_session_submission_id: input.sessionSubmissionId,
			p_section_submission_id: input.sectionSubmissionId,
			p_completed_at: input.completedAt,
			p_scaling_level: input.scalingLevel ?? 'rx',
			p_score: input.score ?? {},
			p_entries: input.entries ?? [],
			p_notes: input.notes,
			p_assignment_id: input.assignmentId,
		},
	);
	const result = rows[0];
	if (!result?.captured)
		throw new Error('Your section result was not saved.');
	return result;
};

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
