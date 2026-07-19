import { getMemberWorkouts } from '@/services/workoutStudio/workouts';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { WorkoutAssignment } from '@/services/workoutStudio/types';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { trainingTheme } from '@/theme/training';
import SkeletonCard from '../components/SkeletonCard';

type Nav = StackNavigationProp<TrainingStackParamList>;

const WorkoutList = () => {
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
		<SafeAreaView style={styles.screen} edges={['top']}>
			<View style={styles.header}>
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityLabel="Go back"
					style={styles.backButton}
					onPress={() => nav.goBack()}
				>
					<Ionicons
						name="arrow-left"
						size={24}
						color={trainingTheme.colors.text}
					/>
				</TouchableOpacity>
				<View style={styles.headerCopy}>
					<Text style={styles.headerTitle}>Workouts</Text>
					<Text style={styles.headerSubtitle}>
						Your next 14 days of training.
					</Text>
				</View>
			</View>

			<SectionList
				style={styles.list}
				contentContainerStyle={styles.container}
				sections={sections}
				keyExtractor={item => item.id}
				showsVerticalScrollIndicator={false}
				ListHeaderComponent={
					<TouchableOpacity
						accessibilityRole="button"
						accessibilityLabel="Open benchmark workouts"
						style={styles.benchmarkCard}
						onPress={() => nav.navigate('TrainingBenchmarks')}
					>
						<View style={styles.benchmarkIcon}>
							<Ionicons
								name="trophy-outline"
								size={23}
								color={trainingTheme.colors.warning}
							/>
						</View>
						<View style={styles.cardLeft}>
							<Text style={styles.benchmarkTitle}>
								Benchmarks
							</Text>
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
							<View style={styles.emptyIcon}>
								<Ionicons
									name="calendar-blank-outline"
									size={30}
									color={trainingTheme.colors.primary}
								/>
							</View>
							<Text style={styles.emptyTitle}>
								Nothing scheduled yet
							</Text>
							<Text style={styles.emptyText}>
								Assigned workouts for the next 14 days will
								appear here.
							</Text>
						</View>
					)
				}
				renderSectionHeader={({ section }) => (
					<Text style={styles.sectionHeader}>{section.title}</Text>
				)}
				renderItem={({ item }) => (
					<TouchableOpacity
						accessibilityRole="button"
						accessibilityLabel={`Open ${item.workouts.name}`}
						style={styles.card}
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
						<View style={styles.workoutIcon}>
							<Ionicons
								name="dumbbell"
								size={23}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<View style={styles.cardLeft}>
							<Text style={styles.workoutName}>
								{item.workouts.name}
							</Text>
							{item.workouts.estimated_duration_minutes && (
								<Text style={styles.meta}>
									~{item.workouts.estimated_duration_minutes}{' '}
									min
								</Text>
							)}
							{item.source?.type === 'class' &&
								item.source.class_name && (
									<Text style={styles.meta}>
										{item.source.class_name}
									</Text>
								)}
						</View>
						<Ionicons
							name="chevron-right"
							size={21}
							color={trainingTheme.colors.textMuted}
						/>
					</TouchableOpacity>
				)}
			/>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: trainingTheme.spacing.lg,
		paddingTop: trainingTheme.spacing.md,
		paddingBottom: trainingTheme.spacing.lg,
		gap: trainingTheme.spacing.md,
	},
	backButton: {
		width: trainingTheme.touchTarget,
		height: trainingTheme.touchTarget,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerCopy: { flex: 1 },
	headerTitle: {
		fontSize: 28,
		lineHeight: 34,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	headerSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	list: { flex: 1, backgroundColor: trainingTheme.colors.background },
	container: {
		paddingHorizontal: trainingTheme.spacing.lg,
		paddingBottom: trainingTheme.spacing.xxl,
	},
	sectionHeader: {
		fontSize: 12,
		fontWeight: '800',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		color: trainingTheme.colors.textMuted,
		backgroundColor: trainingTheme.colors.background,
		paddingTop: trainingTheme.spacing.lg,
		paddingBottom: trainingTheme.spacing.sm,
	},
	card: {
		minHeight: 82,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.sm,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		backgroundColor: trainingTheme.colors.surface,
		...trainingTheme.shadow,
	},
	cardLeft: { flex: 1 },
	workoutIcon: {
		width: 46,
		height: 46,
		borderRadius: trainingTheme.radius.md,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	workoutName: {
		fontSize: 16,
		lineHeight: 21,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	meta: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	benchmarkCard: {
		minHeight: 78,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: trainingTheme.colors.surface,
		...trainingTheme.shadow,
		marginBottom: trainingTheme.spacing.sm,
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

	loading: { paddingVertical: trainingTheme.spacing.lg },
	empty: {
		alignItems: 'center',
		padding: trainingTheme.spacing.xl,
		marginTop: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surface,
	},
	emptyIcon: {
		width: 58,
		height: 58,
		borderRadius: trainingTheme.radius.md,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
		marginBottom: trainingTheme.spacing.md,
	},
	emptyTitle: {
		fontSize: 18,
		lineHeight: 24,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		textAlign: 'center',
	},
	emptyText: {
		fontSize: 14,
		lineHeight: 20,
		color: trainingTheme.colors.textMuted,
		textAlign: 'center',
		marginTop: trainingTheme.spacing.sm,
	},
});

export default WorkoutList;
