import { wsApi } from '@/services/workoutStudio/api';
import type { MovementDetail } from '@/services/workoutStudio/types';
import { useQuery } from '@tanstack/react-query';

type BestRM = {
	rep_max: number;
	weight_kg: number;
	achieved_on: string;
};

async function fetchMovementDetail(
	movementId: string,
): Promise<MovementDetail | null> {
	try {
		const rows = await wsApi()
			.get('movements', {
				searchParams: {
					select: 'id,name,description,video_url',
					id: `eq.${movementId}`,
				},
			})
			.json<MovementDetail[]>();
		return rows[0] ?? null;
	} catch {
		const rows = await wsApi()
			.get('movements', {
				searchParams: {
					select: 'id,name',
					id: `eq.${movementId}`,
				},
			})
			.json<{ id: string; name: string }[]>();
		const row = rows[0];
		if (!row) return null;
		return {
			id: row.id,
			name: row.name,
			description: null,
			video_url: null,
		};
	}
}

async function fetchBestRM(
	movementId: string,
	uid: string,
): Promise<BestRM | null> {
	const rows = await wsApi()
		.get('athlete_rms', {
			searchParams: {
				select: 'rep_max,weight_kg,achieved_on',
				movement_id: `eq.${movementId}`,
				user_id: `eq.${uid}`,
				rep_max: 'eq.1',
				order: 'weight_kg.desc',
				limit: '1',
			},
		})
		.json<BestRM[]>();
	return rows[0] ?? null;
}

export function useMovementDetail(
	movementId: string | null,
	uid: string | null,
) {
	const detailQuery = useQuery({
		queryKey: ['ws-movement-detail', movementId],
		queryFn: () => fetchMovementDetail(movementId as string),
		enabled: !!movementId && !!uid,
		staleTime: 300_000,
	});

	const rmQuery = useQuery({
		queryKey: ['ws-movement-best-rm', movementId, uid],
		queryFn: () => fetchBestRM(movementId as string, uid as string),
		enabled: !!movementId && !!uid,
		staleTime: 300_000,
	});

	return {
		detail: detailQuery.data ?? null,
		bestRM: rmQuery.data ?? null,
		isLoading: detailQuery.isLoading || rmQuery.isLoading,
	};
}
