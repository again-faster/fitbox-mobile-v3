import { getMemberWorkouts } from '@/services/workoutStudio/workouts';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { WorkoutAssignment } from '@/services/workoutStudio/types';
import { useTheme } from '@/theme';
import type { TrainingStackParamList } from '@/types/navigation';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useMemo } from 'react';
import {
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { trainingTheme } from '@/theme/training';
import SkeletonCard from '../components/SkeletonCard';

type Nav = StackNavigationProp<TrainingStackParamList>;

const WorkoutList = () => {
	const { colors } = useTheme();
	const nav = useNavigation<Nav>();
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;

	const from = moment().format('YYYY-MM-DD');
	const to = moment().add(14, 'days').format('YYYY-MM-DD');

	const { data, isLoading, isRefetching, refetch } = useQuery({
		queryKey: ['ws-assignments', uid, tenantId, from],
		queryFn: () => getMemberWorkouts(tenantId!, from, to),
		enabled: !!uid && !!tenantId,
		staleTime: 300_000,
	});

	const sections = useMemo(() => {
		if (!data) return [];
		const grouped: Record<string, WorkoutAssignment[]> = {};
		data.forEach(a => {
			const d = a.due_date;
			if (!grouped[d]) grouped[d] = [];
			grouped[d]!.push(a);
		});
		return Object.entries(grouped).map(([date, items]) => ({
			title: moment(date).format('dddd, MMM D'),
			data: items,
		}));
	}, [data]);

	return (
		<SectionList
			style={{ backgroundColor: '#F9FAFB' }}
			contentContainerStyle={styles.container}
			sections={sections}
			keyExtractor={item => item.id}
			ListHeaderComponent={
				<TouchableOpacity
					accessibilityRole="button"
					style={styles.benchmarkCard}
					onPress={() => nav.navigate('TrainingBenchmarks')}
				>
					<View style={styles.benchmarkIcon}>
						<Ionicons
							name="trophy-outline"
							size={22}
							color={trainingTheme.colors.warning}
						/>
					</View>
					<View style={styles.cardLeft}>
						<Text style={styles.benchmarkTitle}>Benchmarks</Text>
						<Text style={styles.benchmarkCopy}>
							Browse, repeat and track recognised workouts
						</Text>
					</View>
					<Ionicons
						name="chevron-right"
						size={21}
						color={trainingTheme.colors.textMuted}
					/>
				</TouchableOpacity>
			}
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
						<SkeletonCard />
					</View>
				) : (
					<View style={styles.empty}>
						<Text style={[styles.emptyText, { color: '#6B7280' }]}>
							No workouts scheduled for the next 14 days
						</Text>
					</View>
				)
			}
			renderSectionHeader={({ section }) => (
				<Text style={[styles.sectionHeader, { color: '#6B7280' }]}>
					{section.title}
				</Text>
			)}
			renderItem={({ item }) => (
				<TouchableOpacity
					style={[styles.card, { backgroundColor: '#FFFFFF' }]}
					onPress={() =>
						nav.navigate('TrainingWorkoutDetail', {
							workoutId: item.workout_id,
							assignmentId:
								item.source?.type === 'class'
									? undefined
									: item.id,
						})
					}
				>
					<View style={styles.cardLeft}>
						<Text
							style={[styles.workoutName, { color: '#111827' }]}
						>
							{item.workouts.name}
						</Text>
						{item.workouts.estimated_duration_minutes && (
							<Text style={[styles.meta, { color: '#6B7280' }]}>
								~{item.workouts.estimated_duration_minutes} min
							</Text>
						)}
						{item.source?.type === 'class' &&
							item.source.class_name && (
								<Text
									style={[styles.meta, { color: '#6B7280' }]}
								>
									{item.source.class_name}
								</Text>
							)}
					</View>
				</TouchableOpacity>
			)}
		/>
	);
};

const styles = StyleSheet.create({
	container: { padding: 16, paddingBottom: 40 },
	sectionHeader: {
		fontSize: 13,
		fontWeight: '600',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginTop: 16,
		marginBottom: 8,
	},
	card: {
		borderRadius: 12,
		padding: 14,
		marginBottom: 10,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	cardLeft: { flex: 1 },
	workoutName: { fontSize: 16, fontWeight: '600' },
	meta: { fontSize: 13, marginTop: 2 },
	benchmarkCard: {
		minHeight: 78,
		borderRadius: 16,
		padding: 14,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		marginBottom: 8,
	},
	benchmarkIcon: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.warningSoft,
	},
	benchmarkTitle: {
		color: trainingTheme.colors.text,
		fontSize: 16,
		fontWeight: '700',
	},
	benchmarkCopy: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 3,
	},

	empty: { alignItems: 'center', padding: 40 },
	emptyText: { fontSize: 15, textAlign: 'center' },
});

export default WorkoutList;
