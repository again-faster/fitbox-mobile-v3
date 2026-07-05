import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type {
	AthleteRM,
	WellnessResponse,
	WorkoutAssignment,
} from '@/services/workoutStudio/types';
import { useTheme } from '@/theme';
import type { TrainingStackParamList } from '@/types/navigation';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCustomWorkouts } from '../hooks/useCustomWorkouts';
import SkeletonCard from '../components/SkeletonCard';

type Nav = StackNavigationProp<TrainingStackParamList>;

const greeting = () => {
	const h = new Date().getHours();
	if (h < 12) return 'Good morning';
	if (h < 17) return 'Good afternoon';
	return 'Good evening';
};

const todayStr = moment().format('YYYY-MM-DD');
const fourteenAgo = moment().subtract(14, 'days').format('YYYY-MM-DD');

const useToday = () => {
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const firstName = session?.user.full_name?.split(' ')[0] ?? '';

	const assignments = useQuery({
		queryKey: ['ws-assignments-today', uid, tenantId],
		queryFn: () =>
			wsApi()
				.get('workout_assignments', {
					searchParams: {
						select: 'id,workout_id,due_date,notes,workouts(name,estimated_duration_minutes)',
						athlete_id: `eq.${uid}`,
						due_date: `eq.${todayStr}`,
					},
				})
				.json<WorkoutAssignment[]>(),
		enabled: !!uid && !!tenantId,
		staleTime: 60_000,
	});

	const wellness = useQuery({
		queryKey: ['ws-wellness-today', uid],
		queryFn: () =>
			wsApi()
				.get('wellness_responses', {
					searchParams: {
						select: 'id',
						user_id: `eq.${uid}`,
						recorded_for: `eq.${todayStr}`,
					},
				})
				.json<WellnessResponse[]>(),
		enabled: !!uid,
		staleTime: 60_000,
	});

	const coachNotes = useQuery({
		queryKey: ['ws-coach-notes-unread', uid],
		queryFn: () =>
			wsApi()
				.get('section_athlete_notes', {
					searchParams: {
						select: 'id',
						athlete_id: `eq.${uid}`,
						read_at: 'is.null',
					},
					headers: { Prefer: 'count=exact', Range: '0-0' },
				})
				.then(r => {
					const contentRange = r.headers.get('content-range') ?? '';
					const total = parseInt(
						contentRange.split('/')[1] ?? '0',
						10,
					);
					return total;
				}),
		enabled: !!uid,
		staleTime: 60_000,
	});

	const recentPRs = useQuery({
		queryKey: ['ws-recent-prs', uid],
		queryFn: () =>
			wsApi()
				.get('athlete_rms', {
					searchParams: {
						select: 'id,rep_max,weight_kg,achieved_on,movements(name)',
						user_id: `eq.${uid}`,
						achieved_on: `gte.${fourteenAgo}`,
						order: 'achieved_on.desc',
					},
				})
				.json<AthleteRM[]>(),
		enabled: !!uid,
		staleTime: 300_000,
	});

	return { assignments, wellness, coachNotes, recentPRs, firstName };
};

const Today = () => {
	const { colors } = useTheme();
	const nav = useNavigation<Nav>();
	const { assignments, wellness, coachNotes, recentPRs, firstName } =
		useToday();
	const session = getStoredWSSession();
	const persona = session?.user.persona;
	const isSolo = persona === 'solo';
	const { data: hasCustomWorkouts } = useCustomWorkouts();

	const isLoading = assignments.isLoading || wellness.isLoading;
	const isRefreshing = assignments.isRefetching || wellness.isRefetching;
	const hasWellnessToday = (wellness.data?.length ?? 0) > 0;

	const refresh = () => {
		void assignments.refetch();
		void wellness.refetch();
		void coachNotes.refetch();
		void recentPRs.refetch();
	};

	const renderTraining = () => {
		if (isLoading) {
			return (
				<>
					<SkeletonCard />
					<SkeletonCard />
				</>
			);
		}
		if (assignments.data?.length === 0) {
			return (
				<View
					style={[styles.emptyCard, { backgroundColor: '#FFFFFF' }]}
				>
					<Text style={[styles.emptyText, { color: '#6B7280' }]}>
						No workouts scheduled for today
					</Text>
					{isSolo || hasCustomWorkouts ? (
						<TouchableOpacity
							onPress={() => nav.navigate('TrainingBuildList')}
						>
							<Text style={[styles.link, { color: '#3B82F6' }]}>
								Build a workout
							</Text>
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							onPress={() => nav.navigate('TrainingWorkouts')}
						>
							<Text style={[styles.link, { color: '#3B82F6' }]}>
								Browse workouts
							</Text>
						</TouchableOpacity>
					)}
				</View>
			);
		}
		return assignments.data?.map(a => (
			<TouchableOpacity
				key={a.id}
				style={[styles.workoutCard, { backgroundColor: '#FFFFFF' }]}
				onPress={() =>
					nav.navigate('TrainingWorkoutDetail', {
						workoutId: a.workout_id,
						assignmentId: a.id,
					})
				}
			>
				<View style={styles.workoutCardLeft}>
					<Text style={[styles.workoutName, { color: '#111827' }]}>
						{a.workouts.name}
					</Text>
					{a.workouts.estimated_duration_minutes && (
						<Text
							style={[styles.workoutMeta, { color: '#6B7280' }]}
						>
							~{a.workouts.estimated_duration_minutes} min
						</Text>
					)}
				</View>
				<Ionicons name="chevron-right" size={20} color="#6B7280" />
			</TouchableOpacity>
		));
	};

	return (
		<ScrollView
			style={{ backgroundColor: '#F9FAFB' }}
			contentContainerStyle={styles.container}
			refreshControl={
				<RefreshControl
					refreshing={isRefreshing}
					onRefresh={refresh}
					tintColor={colors.brand}
				/>
			}
		>
			{/* Greeting */}
			<View style={styles.greetingRow}>
				<View>
					<Text style={[styles.greeting, { color: '#111827' }]}>
						{greeting()}, {firstName}
					</Text>
					<Text style={[styles.date, { color: '#6B7280' }]}>
						{moment().format('dddd, MMMM D')}
					</Text>
				</View>
				<TouchableOpacity
					onPress={() => nav.navigate('TrainingNotifications')}
					style={styles.bellWrap}
				>
					<Ionicons name="bell-outline" size={24} color="#111827" />
					{(coachNotes.data ?? 0) > 0 && (
						<View
							style={[
								styles.badge,
								{ backgroundColor: '#3B82F6' },
							]}
						>
							<Text style={styles.badgeText}>
								{coachNotes.data}
							</Text>
						</View>
					)}
				</TouchableOpacity>
			</View>

			{/* Wellness check-in card */}
			<TouchableOpacity
				style={[styles.card, { backgroundColor: '#FFFFFF' }]}
				onPress={() => nav.navigate('TrainingWellness')}
			>
				<View style={styles.cardRow}>
					<Ionicons
						name={hasWellnessToday ? 'heart' : 'heart-outline'}
						size={22}
						color={hasWellnessToday ? '#3B82F6' : '#6B7280'}
					/>
					<View style={styles.cardText}>
						<Text style={[styles.cardTitle, { color: '#111827' }]}>
							{hasWellnessToday
								? "Today's wellness logged"
								: "Log today's check-in"}
						</Text>
						<Text style={[styles.cardSub, { color: '#6B7280' }]}>
							{hasWellnessToday ? 'Tap to edit' : '≈ 10 seconds'}
						</Text>
					</View>
					<Ionicons name="chevron-right" size={20} color="#6B7280" />
				</View>
			</TouchableOpacity>

			{/* Today's training */}
			<Text style={[styles.sectionHeader, { color: '#111827' }]}>
				Today&apos;s training
			</Text>

			{renderTraining()}

			{/* Recent PRs */}
			{(recentPRs.data?.length ?? 0) > 0 && (
				<>
					<Text style={[styles.sectionHeader, { color: '#111827' }]}>
						Recent PRs
					</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.prScroll}
					>
						{recentPRs.data?.map(pr => (
							<TouchableOpacity
								key={pr.id}
								style={[
									styles.prCard,
									{ backgroundColor: '#FFFFFF' },
								]}
								onPress={() => nav.navigate('TrainingPRs')}
							>
								<Ionicons
									name="trophy-outline"
									size={18}
									color="#FFB300"
								/>
								<Text
									style={[
										styles.prName,
										{ color: '#111827' },
									]}
								>
									{pr.movements.name}
								</Text>
								<Text
									style={[
										styles.prWeight,
										{ color: '#3B82F6' },
									]}
								>
									{pr.weight_kg}kg x {pr.rep_max}RM
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</>
			)}

			{/* Coach notes — members only */}
			{!isSolo && (coachNotes.data ?? 0) > 0 && (
				<TouchableOpacity
					style={[styles.card, { backgroundColor: '#FFFFFF' }]}
					onPress={() => nav.navigate('TrainingCoachNotes')}
				>
					<View style={styles.cardRow}>
						<Ionicons
							name="message-text-outline"
							size={22}
							color="#3B82F6"
						/>
						<Text style={[styles.cardTitle, { color: '#111827' }]}>
							{coachNotes.data} unread coach note
							{(coachNotes.data ?? 0) > 1 ? 's' : ''}
						</Text>
						<Ionicons
							name="chevron-right"
							size={20}
							color="#6B7280"
						/>
					</View>
				</TouchableOpacity>
			)}

			{/* Build card */}
			{(isSolo || hasCustomWorkouts) && (
				<TouchableOpacity
					style={[styles.card, { backgroundColor: '#FFFFFF' }]}
					onPress={() => nav.navigate('TrainingBuildList')}
				>
					<View style={styles.cardRow}>
						<Ionicons
							name="pencil-ruler"
							size={22}
							color="#3B82F6"
						/>
						<View style={styles.cardText}>
							<Text
								style={[styles.cardTitle, { color: '#111827' }]}
							>
								My workouts
							</Text>
							<Text
								style={[styles.cardSub, { color: '#6B7280' }]}
							>
								Build and schedule personal workouts
							</Text>
						</View>
						<Ionicons
							name="chevron-right"
							size={20}
							color="#6B7280"
						/>
					</View>
				</TouchableOpacity>
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: { padding: 16, paddingBottom: 40, gap: 12 },
	greetingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	greeting: { fontSize: 24, fontWeight: '700' },
	date: { fontSize: 14, marginTop: 2 },
	bellWrap: { position: 'relative', padding: 4 },
	badge: {
		position: 'absolute',
		top: 0,
		right: 0,
		minWidth: 16,
		height: 16,
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
	},
	badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
	sectionHeader: { fontSize: 17, fontWeight: '600', marginTop: 8 },
	card: { borderRadius: 12, padding: 14 },
	cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	cardText: { flex: 1 },
	cardTitle: { fontSize: 15, fontWeight: '600' },
	cardSub: { fontSize: 13, marginTop: 2 },
	workoutCard: {
		borderRadius: 12,
		padding: 14,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	workoutCardLeft: { flex: 1 },
	workoutName: { fontSize: 16, fontWeight: '600' },
	workoutMeta: { fontSize: 13, marginTop: 2 },
	emptyCard: { borderRadius: 12, padding: 20, alignItems: 'center', gap: 8 },
	emptyText: { fontSize: 14 },
	link: { fontSize: 14, fontWeight: '600' },
	prScroll: { gap: 10, paddingBottom: 4 },
	prCard: { borderRadius: 12, padding: 14, width: 140, gap: 6 },
	prName: { fontSize: 13, fontWeight: '600' },
	prWeight: { fontSize: 15, fontWeight: '700' },
});

export default Today;
