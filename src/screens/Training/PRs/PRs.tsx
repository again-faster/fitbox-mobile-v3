import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { AthleteRM } from '@/services/workoutStudio/types';
import { useTheme } from '@/theme';
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
import SkeletonCard from '../components/SkeletonCard';

type Nav = StackNavigationProp<TrainingStackParamList, 'TrainingPRs'>;

const PRs = () => {
	const { colors } = useTheme();
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
			style={{ backgroundColor: '#F9FAFB' }}
			contentContainerStyle={styles.container}
			data={data}
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
					<View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
						<Ionicons name="trophy" size={22} color="#FFB300" />
						<View style={styles.info}>
							<Text
								style={[
									styles.movementName,
									{ color: '#111827' },
								]}
							>
								{item.movements.name}
							</Text>
							<Text style={[styles.date, { color: '#6B7280' }]}>
								{moment(item.achieved_on).format('MMM D, YYYY')}
							</Text>
						</View>
						<Text style={[styles.weight, { color: '#3B82F6' }]}>
							{item.weight_kg}kg x {item.rep_max}RM
						</Text>
						{item.workout_id ? (
							<Text style={styles.chevron}>›</Text>
						) : null}
					</View>
				</TouchableOpacity>
			)}
		/>
	);
};

const styles = StyleSheet.create({
	container: { padding: 16, paddingBottom: 40 },
	card: {
		borderRadius: 12,
		padding: 14,
		marginBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	info: { flex: 1 },
	movementName: { fontSize: 15, fontWeight: '600' },
	date: { fontSize: 12, marginTop: 2 },
	weight: { fontSize: 16, fontWeight: '700' },
	empty: { alignItems: 'center', padding: 40 },
	emptyText: { fontSize: 15, textAlign: 'center' },
	emptySubtext: {
		fontSize: 13,
		color: '#9CA3AF',
		textAlign: 'center',
		marginTop: 4,
	},
	chevron: { fontSize: 20, color: '#9CA3AF', marginLeft: 'auto' },
});

export default PRs;
