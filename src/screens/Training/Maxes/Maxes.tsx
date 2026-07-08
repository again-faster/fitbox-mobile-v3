import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { AthleteRM } from '@/services/workoutStudio/types';
import { useTheme } from '@/theme';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import SkeletonCard from '../components/SkeletonCard';

const Maxes = () => {
	const { colors } = useTheme();
	const session = getStoredWSSession();
	const uid = session?.user.id;

	const { data, isLoading, isRefetching, refetch } = useQuery({
		queryKey: ['ws-maxes', uid],
		queryFn: () =>
			wsApi()
				.get('athlete_rms', {
					searchParams: {
						select: 'id,rep_max,weight_kg,achieved_on,notes,movements(name)',
						athlete_id: `eq.${uid}`,
						rep_max: 'in.(1,3,5)',
						order: 'movements(name).asc,rep_max.asc',
					},
				})
				.json<AthleteRM[]>(),
		enabled: !!uid,
		staleTime: 300_000,
	});

	const sections = useMemo(() => {
		if (!data) return [];
		const grouped: Record<string, AthleteRM[]> = {};
		data.forEach(rm => {
			const { name } = rm.movements;
			if (!grouped[name]) grouped[name] = [];
			grouped[name]!.push(rm);
		});
		return Object.entries(grouped).map(([name, items]) => ({
			title: name,
			data: items,
		}));
	}, [data]);

	return (
		<SectionList
			style={{ backgroundColor: '#F9FAFB' }}
			contentContainerStyle={styles.container}
			sections={sections}
			keyExtractor={item => item.id}
			refreshControl={
				<RefreshControl
					refreshing={isRefetching}
					onRefresh={() => {
						void refetch();
					}}
					tintColor={colors.brand}
				/>
			}
			ListEmptyComponent={
				isLoading ? (
					<View style={{ padding: 16 }}>
						<SkeletonCard />
						<SkeletonCard />
					</View>
				) : (
					<View style={styles.empty}>
						<Text style={[styles.emptyText, { color: '#6B7280' }]}>
							No maxes recorded yet
						</Text>
					</View>
				)
			}
			renderSectionHeader={({ section }) => (
				<Text style={[styles.sectionHeader, { color: '#111827' }]}>
					{section.title}
				</Text>
			)}
			renderItem={({ item }) => (
				<View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
					<View style={styles.row}>
						<Text style={[styles.rmLabel, { color: '#6B7280' }]}>
							{item.rep_max}RM
						</Text>
						<Text style={[styles.weight, { color: '#3B82F6' }]}>
							{item.weight_kg} kg
						</Text>
						<Text style={[styles.date, { color: '#6B7280' }]}>
							{item.achieved_on}
						</Text>
					</View>
				</View>
			)}
		/>
	);
};

const styles = StyleSheet.create({
	container: { padding: 16, paddingBottom: 40 },
	sectionHeader: {
		fontSize: 16,
		fontWeight: '700',
		marginTop: 16,
		marginBottom: 6,
	},
	card: { borderRadius: 10, padding: 12, marginBottom: 8 },
	row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	rmLabel: { width: 36, fontSize: 14, fontWeight: '600' },
	weight: { fontSize: 16, fontWeight: '700', flex: 1 },
	date: { fontSize: 12 },
	empty: { alignItems: 'center', padding: 40 },
	emptyText: { fontSize: 15 },
});

export default Maxes;
