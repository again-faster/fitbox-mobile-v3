import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { WorkoutResult } from '@/services/workoutStudio/types';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	View,
	TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { TrainingStackParamList } from '@/types/navigation';

import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { trainingTheme } from '@/theme/training';
import SkeletonCard from '../components/SkeletonCard';

type Nav = StackNavigationProp<TrainingStackParamList>;

const Results = () => {
	const navigation = useNavigation<Nav>();
	const session = getStoredWSSession();
	const uid = session?.user.id;

	const { data, isLoading, isRefetching, refetch } = useQuery({
		queryKey: ['ws-results', uid],
		queryFn: () =>
			wsApi()
				.get('workout_results', {
					searchParams: {
						select: 'id,workout_id,completed_at,total_volume_kg,duration_seconds,score_time_seconds,score_rounds,score_partial_reps,score_weight_kg,score_reps,scaling_level,workouts(name)',
						athlete_id: `eq.${uid}`,
						order: 'completed_at.desc',
						limit: '25',
					},
				})
				.json<WorkoutResult[]>(),
		enabled: !!uid,
		staleTime: 300_000,
	});

	return (
		<FlatList
			style={styles.screen}
			contentContainerStyle={styles.container}
			data={data}
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
						<SkeletonCard />
					</View>
				) : (
					<View style={styles.empty}>
						<Text style={styles.emptyText}>
							No workout results yet
						</Text>
					</View>
				)
			}
			renderItem={({ item }) => (
				<TouchableOpacity
					style={styles.card}
					accessibilityRole="button"
					accessibilityLabel={`Open result for ${item.workouts.name}`}
					onPress={() =>
						navigation.navigate('TrainingResultDetail', {
							workoutResultId: item.id,
						})
					}
				>
					<View style={styles.cardHeading}>
						<View style={styles.cardCopy}>
							<Text style={styles.workoutName}>
								{item.workouts.name}
							</Text>
							<Text style={styles.date}>
								{moment(item.completed_at).format(
									'ddd, MMM D [·] h:mm A',
								)}
							</Text>
							<View style={styles.statsRow}>
								{item.duration_seconds != null && (
									<Text style={styles.stat}>
										{Math.round(item.duration_seconds / 60)}{' '}
										min
									</Text>
								)}
								{item.total_volume_kg != null && (
									<Text style={styles.stat}>
										{item.total_volume_kg.toLocaleString()}{' '}
										kg volume
									</Text>
								)}
							</View>
						</View>
						<Ionicons
							name="chevron-right"
							size={21}
							color={trainingTheme.colors.primary}
						/>
					</View>
				</TouchableOpacity>
			)}
		/>
	);
};

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	container: { padding: 16, paddingBottom: 40 },
	card: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: 18,
		padding: trainingTheme.spacing.lg,
		marginBottom: 10,
	},
	cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	cardCopy: { flex: 1 },
	workoutName: {
		color: trainingTheme.colors.text,
		fontSize: 16,
		fontWeight: '700',
	},
	date: { color: trainingTheme.colors.textMuted, fontSize: 13, marginTop: 4 },
	statsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
	stat: { color: trainingTheme.colors.textMuted, fontSize: 13 },
	empty: { alignItems: 'center', padding: 40 },
	emptyText: { color: trainingTheme.colors.textMuted, fontSize: 15 },
});

export default Results;
