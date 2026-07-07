import { wsApi } from '@/services/workoutStudio/api';
import { useQuery } from '@tanstack/react-query';

type PersonalBestRow = {
	score_time_seconds: number | null;
	score_rounds: number | null;
	score_partial_reps: number | null;
	score_weight_kg: number | null;
	completed_at: string;
};

const SELECT =
	'score_time_seconds,score_rounds,score_partial_reps,score_weight_kg,completed_at';

/**
 * Converts a result row into a single comparable number.
 * Null-safe: returns Infinity for asc types (lower-is-better) and -Infinity
 * for desc types (higher-is-better) so null-scored rows always sort last.
 */
export function computeScoreValue(
	result: PersonalBestRow,
	scoringType: string,
): number {
	if (['for_time', 'chipper', 'emom'].includes(scoringType)) {
		// Lower is better → null becomes Infinity (last in ascending sort)
		return result.score_time_seconds != null
			? result.score_time_seconds
			: Infinity;
	}
	if (scoringType === 'amrap') {
		const r = result.score_rounds;
		return r != null
			? r * 1000 + (result.score_partial_reps ?? 0)
			: -Infinity;
	}
	if (scoringType === 'strength') {
		return result.score_weight_kg != null
			? result.score_weight_kg
			: -Infinity;
	}
	// custom: probe columns in preference order
	if (result.score_time_seconds != null) return result.score_time_seconds;
	if (result.score_rounds != null) {
		return result.score_rounds * 1000 + (result.score_partial_reps ?? 0);
	}
	if (result.score_weight_kg != null) return result.score_weight_kg;
	return -Infinity;
}

/**
 * Returns true when newScore beats best (lower wins for asc types, higher wins
 * for desc types). A non-finite newScore (no data entered) is never a PR.
 */
export function isBetterScore(
	newScore: number,
	best: number | null,
	scoringType: string,
): boolean {
	if (!Number.isFinite(newScore)) return false;
	if (best === null || !Number.isFinite(best)) return true;
	const isAsc = ['for_time', 'chipper', 'emom'].includes(scoringType);
	return isAsc ? newScore < best : newScore > best;
}

async function fetchPersonalBest(
	workoutId: string,
	athleteId: string,
	scoringType: string,
): Promise<number | null> {
	const rows = await wsApi()
		.get('workout_results', {
			searchParams: {
				select: SELECT,
				workout_id: `eq.${workoutId}`,
				athlete_id: `eq.${athleteId}`,
			},
		})
		.json<PersonalBestRow[]>();

	if (rows.length === 0) return null;

	const isAsc = ['for_time', 'chipper', 'emom'].includes(scoringType);
	const scores = rows
		.map(r => computeScoreValue(r, scoringType))
		.filter(s => Number.isFinite(s));
	if (scores.length === 0) return null;
	return isAsc ? Math.min(...scores) : Math.max(...scores);
}

export function useWorkoutPersonalBest(
	workoutId: string,
	athleteId: string | undefined,
	scoringType: string,
) {
	return useQuery({
		queryKey: ['ws-personal-best', workoutId, athleteId, scoringType],
		queryFn: () =>
			fetchPersonalBest(workoutId, athleteId as string, scoringType),
		enabled: !!athleteId,
		staleTime: 300_000,
	});
}
