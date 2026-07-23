import { wsApi } from '@/services/workoutStudio/api';
import type {
	LeaderboardEntry,
	ScalingLevel,
} from '@/services/workoutStudio/types';
import { useQuery } from '@tanstack/react-query';

type RawLeaderboardRow = {
	athlete_id: string;
	scaling_level: ScalingLevel | null;
	completed_at: string;
	is_rx: boolean | null;
	score_time_seconds: number | null;
	score_rounds: number | null;
	score_partial_reps: number | null;
	score_weight_kg: number | null;
	score_reps: number | null;
	profiles: { display_name: string } | null;
};

const SELECT_WITH_PROFILES =
	'athlete_id,scaling_level,completed_at,is_rx,score_time_seconds,score_rounds,score_partial_reps,score_weight_kg,score_reps,profiles(display_name)';

const SELECT_NO_PROFILES =
	'athlete_id,scaling_level,completed_at,is_rx,score_time_seconds,score_rounds,score_partial_reps,score_weight_kg,score_reps';

function formatTime(secs: number): string {
	const m = Math.floor(secs / 60);
	const s = secs % 60;
	return `${m}:${String(s).padStart(2, '0')}`;
}

function deriveScore(
	row: RawLeaderboardRow,
	scoringType: string,
): { scoreValue: number | null; scoreDisplay: string } {
	if (['for_time', 'chipper', 'emom'].includes(scoringType)) {
		const secs = row.score_time_seconds;
		if (secs == null) return { scoreValue: null, scoreDisplay: '—' };
		return { scoreValue: secs, scoreDisplay: formatTime(secs) };
	}
	if (scoringType === 'amrap') {
		const r = row.score_rounds;
		if (r == null) return { scoreValue: null, scoreDisplay: '—' };
		const p = row.score_partial_reps ?? 0;
		const display = p > 0 ? `${r} + ${p}` : `${r}`;
		return { scoreValue: r * 1000 + p, scoreDisplay: display };
	}
	if (scoringType === 'strength') {
		const w = row.score_weight_kg;
		if (w == null) return { scoreValue: null, scoreDisplay: '—' };
		return { scoreValue: w, scoreDisplay: `${w} kg` };
	}
	// custom: try each score column in preference order
	if (row.score_time_seconds != null) {
		return {
			scoreValue: row.score_time_seconds,
			scoreDisplay: formatTime(row.score_time_seconds),
		};
	}
	if (row.score_rounds != null) {
		const r = row.score_rounds;
		const p = row.score_partial_reps ?? 0;
		const display = p > 0 ? `${r} + ${p}` : `${r}`;
		return { scoreValue: r * 1000 + p, scoreDisplay: display };
	}
	if (row.score_weight_kg != null) {
		return {
			scoreValue: row.score_weight_kg,
			scoreDisplay: `${row.score_weight_kg} kg`,
		};
	}
	return { scoreValue: null, scoreDisplay: '—' };
}

function mapRow(row: RawLeaderboardRow, scoringType: string): LeaderboardEntry {
	const displayName =
		row.profiles?.display_name || row.athlete_id.slice(0, 8) || 'Athlete';
	const { scoreValue, scoreDisplay } = deriveScore(row, scoringType);
	return {
		athleteId: row.athlete_id,
		displayName,
		scoreDisplay,
		scoreValue,
		scalingLevel: row.scaling_level,
		loggedAt: row.completed_at,
	};
}

function makeComparator(
	scoringType: string,
	sortDirection?: 'asc' | 'desc' | null,
): (a: LeaderboardEntry, b: LeaderboardEntry) => number {
	const scoreAsc =
		sortDirection === 'asc' ||
		(sortDirection == null &&
			['for_time', 'chipper', 'emom'].includes(scoringType));
	return function compareEntries(
		a: LeaderboardEntry,
		b: LeaderboardEntry,
	): number {
		if (a.scoreValue == null && b.scoreValue == null) {
			return b.loggedAt.localeCompare(a.loggedAt);
		}
		if (a.scoreValue == null) return 1;
		if (b.scoreValue == null) return -1;
		return scoreAsc
			? a.scoreValue - b.scoreValue
			: b.scoreValue - a.scoreValue;
	};
}

const fetchLeaderboard = async (
	workoutId: string,
	scoringType: string,
	sectionId?: string,
	sortDirection?: 'asc' | 'desc' | null,
): Promise<LeaderboardEntry[]> => {
	const resource = sectionId ? 'section_results' : 'workout_results';
	const scope: Record<string, string> = sectionId
		? { section_id: `eq.${sectionId}` }
		: { workout_id: `eq.${workoutId}` };
	const rows = await wsApi()
		.get(resource, {
			searchParams: {
				select: SELECT_WITH_PROFILES,
				...scope,
			},
		})
		.json<RawLeaderboardRow[]>()
		.catch(async () =>
			wsApi()
				.get(resource, {
					searchParams: {
						select: SELECT_NO_PROFILES,
						...scope,
					},
				})
				.json<Omit<RawLeaderboardRow, 'profiles'>[]>()
				.then(r => r.map(row => ({ ...row, profiles: null }))),
		);

	const comparator = makeComparator(scoringType, sortDirection);
	const ranked = rows.map(row => mapRow(row, scoringType)).sort(comparator);
	const athleteIds = new Set<string>();
	return ranked.filter(entry => {
		if (athleteIds.has(entry.athleteId)) return false;
		athleteIds.add(entry.athleteId);
		return true;
	});
};

export const useWorkoutLeaderboard = (
	workoutId: string,
	scoringType: string,
	enabled: boolean,
	sectionId?: string,
	sortDirection?: 'asc' | 'desc' | null,
) =>
	useQuery({
		queryKey: ['ws-leaderboard', workoutId, sectionId, sortDirection],
		queryFn: () =>
			fetchLeaderboard(workoutId, scoringType, sectionId, sortDirection),
		enabled,
		staleTime: 300_000,
	});
