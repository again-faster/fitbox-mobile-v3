import { MemberCard, MemberScreen, MemberText } from '@/components/member';
import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { WorkoutResult } from '@/services/workoutStudio/types';
import type { TrainingStackParamList } from '@/types/navigation';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
	FlatList,
	RefreshControl,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
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
		<MemberScreen contentContainerStyle={styles.screenContent}>
			<FlatList
				style={styles.screen}
				contentContainerStyle={styles.container}
				data={data}
				keyExtractor={item => item.id}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => void refetch()}
						tintColor={trainingTheme.colors.primary}
					/>
				}
				ListEmptyComponent={
					isLoading ? (
						<View style={styles.loading}>
							<SkeletonCard />
							<SkeletonCard />
							<SkeletonCard />
						</View>
					) : (
						<View style={styles.empty}>
							<MemberText
								role="body"
								muted
								style={styles.emptyText}
							>
								No workout results yet
							</MemberText>
						</View>
					)
				}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={styles.cardPressable}
						accessibilityRole="button"
						accessibilityLabel={`Open result for ${item.workouts.name}`}
						onPress={() =>
							navigation.navigate('TrainingResultDetail', {
								workoutResultId: item.id,
							})
						}
					>
						<MemberCard elevated={false}>
							<View style={styles.cardHeading}>
								<View style={styles.cardCopy}>
									<MemberText role="sectionTitle">
										{item.workouts.name}
									</MemberText>
									<MemberText role="meta" muted>
										{moment(item.completed_at).format(
											'ddd, MMM D [·] h:mm A',
										)}
									</MemberText>
									<View style={styles.statsRow}>
										{item.duration_seconds != null ? (
											<MemberText role="meta" muted>
												{Math.round(
													item.duration_seconds / 60,
												)}{' '}
												min
											</MemberText>
										) : null}
										{item.total_volume_kg != null ? (
											<MemberText role="meta" muted>
												{item.total_volume_kg.toLocaleString()}{' '}
												kg volume
											</MemberText>
										) : null}
									</View>
								</View>
								<Ionicons
									name="chevron-right"
									size={21}
									color={trainingTheme.colors.primary}
								/>
							</View>
						</MemberCard>
					</TouchableOpacity>
				)}
			/>
		</MemberScreen>
	);
};

const styles = StyleSheet.create({
	screenContent: { paddingHorizontal: 0 },
	screen: { backgroundColor: trainingTheme.colors.background },
	container: { padding: trainingTheme.spacing.lg, paddingBottom: 40 },
	loading: { padding: trainingTheme.spacing.lg },
	cardPressable: { marginBottom: trainingTheme.spacing.sm },
	cardHeading: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
	},
	cardCopy: { flex: 1 },
	statsRow: {
		flexDirection: 'row',
		gap: trainingTheme.spacing.md,
		marginTop: trainingTheme.spacing.xs,
	},
	empty: { alignItems: 'center', padding: trainingTheme.spacing.xxl },
	emptyText: { textAlign: 'center' },
});

export default Results;
