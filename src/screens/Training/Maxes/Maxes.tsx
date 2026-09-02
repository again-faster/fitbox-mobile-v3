import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { AthleteRM } from '@/services/workoutStudio/types';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
	Alert,
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { trainingTheme } from '@/theme/training';
import SkeletonCard from '../components/SkeletonCard';

const Maxes = () => {
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

	const confirmDelete = (item: AthleteRM) => {
		Alert.alert(
			'Delete this max?',
			`${item.rep_max}RM at ${item.weight_kg} kg will be permanently removed.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						void wsApi()
							.delete('athlete_rms', {
								searchParams: { id: `eq.${item.id}` },
							})
							.then(() => refetch())
							.catch(() => {
								Alert.alert(
									"Max couldn't be deleted",
									'Check your connection and try again.',
								);
							});
					},
				},
			],
		);
	};

	return (
		<SectionList
			style={styles.screen}
			contentContainerStyle={styles.container}
			sections={sections}
			keyExtractor={item => item.id}
			refreshControl={
				<RefreshControl
					refreshing={isRefetching}
					onRefresh={() => {
						void refetch();
					}}
					tintColor={trainingTheme.colors.primary}
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
						<Text style={styles.emptyText}>
							No maxes recorded yet
						</Text>
					</View>
				)
			}
			renderSectionHeader={({ section }) => (
				<Text style={styles.sectionHeader}>{section.title}</Text>
			)}
			renderItem={({ item }) => (
				<View style={styles.card}>
					<View style={styles.row}>
						<Text style={styles.rmLabel}>{item.rep_max}RM</Text>
						<Text style={styles.weight}>{item.weight_kg} kg</Text>
						<Text style={styles.date}>{item.achieved_on}</Text>
						<TouchableOpacity
							accessibilityRole="button"
							accessibilityLabel={`Delete ${item.rep_max} rep max at ${item.weight_kg} kilograms`}
							onPress={() => confirmDelete(item)}
							style={styles.deleteButton}
						>
							<Ionicons
								name="trash-can-outline"
								size={20}
								color={trainingTheme.colors.danger}
							/>
						</TouchableOpacity>
					</View>
				</View>
			)}
		/>
	);
};

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	container: { padding: 16, paddingBottom: 40 },
	sectionHeader: {
		fontSize: 16,
		fontWeight: '700',
		marginTop: 16,
		marginBottom: 6,
		color: trainingTheme.colors.text,
	},
	card: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: 16,
		padding: 14,
		marginBottom: 8,
	},
	row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	rmLabel: {
		color: trainingTheme.colors.textMuted,
		width: 36,
		fontSize: 14,
		fontWeight: '600',
	},
	weight: {
		color: trainingTheme.colors.primary,
		fontSize: 16,
		fontWeight: '700',
		flex: 1,
	},
	date: { color: trainingTheme.colors.textMuted, fontSize: 12 },
	deleteButton: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
		marginVertical: -10,
		marginRight: -8,
	},
	empty: { alignItems: 'center', padding: 40 },
	emptyText: { color: trainingTheme.colors.textMuted, fontSize: 15 },
});

export default Maxes;
