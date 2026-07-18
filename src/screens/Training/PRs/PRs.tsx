import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { AthleteRM } from '@/services/workoutStudio/types';
import type { TrainingStackParamList } from '@/types/navigation';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { trainingTheme } from '@/theme/training';
import SkeletonCard from '../components/SkeletonCard';

type Nav = StackNavigationProp<TrainingStackParamList, 'TrainingPRs'>;

const PRs = () => {
	const navigation = useNavigation<Nav>();
	const session = getStoredWSSession();
	const uid = session?.user.id;

	const { data, isLoading, isRefetching, refetch } = useQuery({
		queryKey: ['ws-prs', uid],
		queryFn: () =>
			wsApi()
				.get('athlete_rms', {
					searchParams: {
						select: 'id,rep_max,weight_kg,achieved_on,workout_id,movements(name)',
						athlete_id: `eq.${uid}`,
						order: 'achieved_on.desc',
					},
				})
				.json<AthleteRM[]>(),
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
					</View>
				) : (
					<View style={styles.empty}>
						<Text style={styles.emptyText}>
							No personal records yet.
						</Text>
						<Text style={styles.emptySubtext}>
							Log a benchmark workout to start tracking your
							progress.
						</Text>
					</View>
				)
			}
			renderItem={({ item }) => (
				<TouchableOpacity
					activeOpacity={item.workout_id ? 0.7 : 1}
					onPress={() => {
						if (item.workout_id) {
							navigation.navigate('TrainingWorkoutDetail', {
								workoutId: item.workout_id,
							});
						}
					}}
				>
					<View style={styles.card}>
						<View style={styles.icon}>
							<Ionicons
								name="trophy"
								size={22}
								color={trainingTheme.colors.warning}
							/>
						</View>
						<View style={styles.info}>
							<Text style={[styles.movementName]}>
								{item.movements.name}
							</Text>
							<Text style={styles.date}>
								{moment(item.achieved_on).format('MMM D, YYYY')}
							</Text>
						</View>
						<Text style={styles.weight}>
							{item.weight_kg}kg x {item.rep_max}RM
						</Text>
						{item.workout_id ? (
							<Ionicons
								name="chevron-right"
								size={20}
								color={trainingTheme.colors.textMuted}
							/>
						) : null}
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
		padding: 14,
		marginBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	icon: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.warningSoft,
	},
	info: { flex: 1 },
	movementName: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '700',
	},
	date: { color: trainingTheme.colors.textMuted, fontSize: 12, marginTop: 2 },
	weight: {
		color: trainingTheme.colors.primary,
		fontSize: 16,
		fontWeight: '700',
	},
	empty: { alignItems: 'center', padding: 40 },
	emptyText: {
		color: trainingTheme.colors.textMuted,
		fontSize: 15,
		textAlign: 'center',
	},
	emptySubtext: {
		fontSize: 13,
		color: trainingTheme.colors.textMuted,
		textAlign: 'center',
		marginTop: 4,
	},
});

export default PRs;
