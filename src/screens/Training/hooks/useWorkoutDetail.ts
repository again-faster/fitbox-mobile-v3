import { wsApi } from '@/services/workoutStudio/api';
import type {
	BlockMovement,
	SectionBlock,
	WorkoutDetail,
} from '@/services/workoutStudio/types';
import { useQuery } from '@tanstack/react-query';

type RawSection = Omit<
	WorkoutDetail['workout_sections'][number],
	'section_blocks'
>;
type RawBlock = {
	id: string;
	section_id: string;
	label: string | null;
	intent: string;
	position: number;
	rest_seconds: number | null;
	scaled_notes: string | null;
	foundations_notes: string | null;
};
type RawBM = {
	id: string;
	block_id: string;
	position: number;
	sets: number | null;
	reps_scheme: string | null;
	weight_kg: number | null;
	weight_scheme: string | null;
	duration_seconds: number | null;
	distance_meters: number | null;
	calories: number | null;
	set_scheme: Array<Record<string, unknown>> | null;
	advanced: Record<string, unknown> | null;
	notes: string | null;
	movements: { id: string; name: string };
};

const fetchWorkoutDetail = async (
	workoutId: string,
): Promise<WorkoutDetail | undefined> => {
	// Step 1+2 in parallel — both only need workoutId
	const [workoutRows, rawSections] = await Promise.all([
		wsApi()
			.get('workouts', {
				searchParams: {
					select: 'id,name,estimated_duration_minutes',
					id: `eq.${workoutId}`,
				},
			})
			.json<
				Pick<
					WorkoutDetail,
					'id' | 'name' | 'estimated_duration_minutes'
				>[]
			>(),
		wsApi()
			.get('workout_sections', {
				searchParams: {
					select: 'id,name,position,section_mode,coach_notes,scoring_type,is_scored,score_collection_mode,time_cap_seconds,rounds,leaderboard_enabled,leaderboard_calculation,leaderboard_sort_direction,leaderboard_score_type,aggregate_formula,aggregate_group_id',
					workout_id: `eq.${workoutId}`,
					order: 'position.asc',
				},
			})
			.json<RawSection[]>(),
	]);

	const workout = workoutRows[0];
	if (!workout) return undefined;
	if (rawSections.length === 0) {
		return { ...workout, workout_sections: [] };
	}

	const sectionIds = rawSections.map(s => s.id).join(',');

	// Step 3 — needs sectionIds
	const rawBlocks = await wsApi()
		.get('section_blocks', {
			searchParams: {
				select: 'id,section_id,label,intent,position,rest_seconds,scaled_notes,foundations_notes',
				section_id: `in.(${sectionIds})`,
				order: 'position.asc',
			},
		})
		.json<RawBlock[]>();

	if (rawBlocks.length === 0) {
		return {
			...workout,
			workout_sections: rawSections.map(s => ({
				...s,
				section_blocks: [] as SectionBlock[],
			})),
		};
	}

	const blockIds = rawBlocks.map(b => b.id).join(',');

	// Step 4 — needs blockIds
	const rawBMs = await wsApi()
		.get('block_movements', {
			searchParams: {
				select: 'id,block_id,position,sets,reps_scheme,weight_kg,weight_scheme,duration_seconds,distance_meters,calories,set_scheme,advanced,notes,movements(id,name)',
				block_id: `in.(${blockIds})`,
				order: 'position.asc',
			},
		})
		.json<RawBM[]>();

	// Assemble block_movements → blocks
	const bmByBlock = new Map<string, BlockMovement[]>();
	rawBMs.forEach(({ block_id: blockId, ...bm }) => {
		const arr = bmByBlock.get(blockId) ?? [];
		arr.push(bm);
		bmByBlock.set(blockId, arr);
	});

	// Assemble blocks → sections
	const blocksBySection = new Map<string, SectionBlock[]>();
	rawBlocks.forEach(({ section_id: sectionId, ...block }) => {
		const arr = blocksBySection.get(sectionId) ?? [];
		arr.push({ ...block, block_movements: bmByBlock.get(block.id) ?? [] });
		blocksBySection.set(sectionId, arr);
	});

	return {
		...workout,
		workout_sections: rawSections.map(s => ({
			...s,
			section_blocks: blocksBySection.get(s.id) ?? [],
		})),
	};
};

export const useWorkoutDetail = (workoutId: string) =>
	useQuery({
		queryKey: ['ws-workout', workoutId],
		queryFn: () => fetchWorkoutDetail(workoutId),
		staleTime: 300_000,
	});
