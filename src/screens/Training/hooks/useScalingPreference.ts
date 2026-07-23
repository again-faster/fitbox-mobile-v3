import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { wsApi } from '@/services/workoutStudio/api';
import type { ScalingLevel } from '@/services/workoutStudio/types';

type TenantLevel = {
	id: string;
	name: string;
	is_default: boolean;
	ordinal: number;
};

type AthleteLevel = { scaling_level_id: string };

const toMobileLevel = (name?: string | null): ScalingLevel | null => {
	const normalized = (name ?? '').toLowerCase().replace(/[\s_-]+/g, '');
	if (normalized === 'rx') return 'rx';
	if (normalized === 'scaled') return 'scaled';
	if (normalized === 'foundations' || normalized === 'foundation')
		return 'foundations';
	return null;
};

export const useScalingPreference = (athleteId?: string, tenantId?: string) => {
	const queryClient = useQueryClient();
	const queryKey = ['ws-scaling-preference', athleteId, tenantId] as const;
	const query = useQuery({
		queryKey,
		enabled: !!athleteId && !!tenantId,
		staleTime: 300_000,
		queryFn: async () => {
			const [levels, athleteRows] = await Promise.all([
				wsApi()
					.get('scaling_levels', {
						searchParams: {
							select: 'id,name,is_default,ordinal',
							tenant_id: `eq.${tenantId}`,
							order: 'ordinal.desc',
						},
					})
					.json<TenantLevel[]>(),
				wsApi()
					.get('athlete_scaling_levels', {
						searchParams: {
							select: 'scaling_level_id',
							athlete_id: `eq.${athleteId}`,
							tenant_id: `eq.${tenantId}`,
							limit: '1',
						},
					})
					.json<AthleteLevel[]>(),
			]);
			const athleteLevelId = athleteRows[0]?.scaling_level_id;
			const athleteLevel = levels.find(
				level => level.id === athleteLevelId,
			);
			const defaultLevel = levels.find(level => level.is_default);
			return {
				levels,
				preferredLevel:
					toMobileLevel(athleteLevel?.name) ??
					toMobileLevel(defaultLevel?.name) ??
					('rx' as ScalingLevel),
			};
		},
	});

	const levelIdByMobileKey = useMemo(() => {
		const map = new Map<ScalingLevel, string>();
		(query.data?.levels ?? []).forEach(level => {
			const key = toMobileLevel(level.name);
			if (key) map.set(key, level.id);
		});
		return map;
	}, [query.data?.levels]);

	const mutation = useMutation({
		mutationFn: async (level: ScalingLevel) => {
			if (!athleteId || !tenantId) return;
			const scalingLevelId = levelIdByMobileKey.get(level);
			if (!scalingLevelId) return;
			await wsApi().post('athlete_scaling_levels', {
				searchParams: { on_conflict: 'athlete_id,tenant_id' },
				json: {
					athlete_id: athleteId,
					tenant_id: tenantId,
					scaling_level_id: scalingLevelId,
				},
				headers: {
					Prefer: 'resolution=merge-duplicates,return=minimal',
				},
			});
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey }),
	});

	return {
		...query,
		preferredLevel: query.data?.preferredLevel,
		savePreference: mutation.mutateAsync,
		isSavingPreference: mutation.isPending,
	};
};
