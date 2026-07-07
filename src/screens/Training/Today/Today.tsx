import { syncNow } from '@/services/healthKit';
import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type {
	AthleteRM,
	ProgramContext,
	WellnessResponse,
	WorkoutAssignment,
} from '@/services/workoutStudio/types';
import { mmkvStorage } from '@/storage';
import { useTheme } from '@/theme';
import type { TrainingStackParamList } from '@/types/navigation';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
	AppState,
	Platform,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRef, useEffect, useMemo } from 'react';
import { useCustomWorkouts } from '../hooks/useCustomWorkouts';
import SkeletonCard from '../components/SkeletonCard';

type Nav = StackNavigationProp<TrainingStackParamList>;

type ProgramRowEmbed = {
	id: string;
	name: string;
	total_weeks: number | null;
	duration_weeks: number | null;
};

type ProgramWeekRowEmbed = {
	week_number: number;
	program: ProgramRowEmbed | ProgramRowEmbed[] | null;
};

type ProgramDayRowEmbed = {
	day_index: number;
	label: string | null;
	week: ProgramWeekRowEmbed | ProgramWeekRowEmbed[] | null;
};

type ProgramDayWorkoutRow = {
	workout_id: string;
	sort_order: number | null;
	day: ProgramDayRowEmbed | ProgramDayRowEmbed[] | null;
};

const normalizeOne = <T,>(v: T | T[] | null | undefined): T | null =>
	Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

function buildProgramCtxMap(
	rows: ProgramDayWorkoutRow[],
): Map<string, ProgramContext> {
	const map = new Map<string, ProgramContext>();
	const sorted = [...rows].sort((a, b) => {
		const dayA = normalizeOne(a.day);
		const dayB = normalizeOne(b.day);
		const weekA = normalizeOne(dayA?.week ?? null);
		const weekB = normalizeOne(dayB?.week ?? null);
		const wn = (weekA?.week_number ?? 0) - (weekB?.week_number ?? 0);
		if (wn !== 0) return wn;
		return (dayA?.day_index ?? 0) - (dayB?.day_index ?? 0);
	});
	sorted.forEach(row => {
		if (map.has(row.workout_id)) return;
		const pd = normalizeOne(row.day);
		if (!pd) return;
		const pw = normalizeOne(pd.week);
		if (!pw) return;
		const prog = normalizeOne(pw.program);
		if (!prog) return;
		map.set(row.workout_id, {
			programName: prog.name,
			dayIndex: pd.day_index,
			weekNumber: pw.week_number,
			totalWeeks: prog.total_weeks ?? prog.duration_weeks ?? null,
		});
	});
	return map;
}

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

	const ids = useMemo(
		() =>
			Array.from(
				new Set((assignments.data ?? []).map(a => a.workout_id)),
			).sort(),
		[assignments.data],
	);
	const workoutIdsKey = ids.join(',');

	const programDayCtx = useQuery({
		queryKey: ['ws-program-ctx-today', workoutIdsKey],
		enabled: (assignments.data?.length ?? 0) > 0,
		staleTime: 300_000,
		queryFn: () =>
			wsApi()
				.get('program_day_workouts', {
					searchParams: {
						select: 'workout_id,sort_order,day:program_days(day_index,label,week:program_weeks(week_number,program:programs(id,name,total_weeks,duration_weeks)))',
						workout_id: `in.(${ids.join(',')})`,
						limit: '50',
					},
				})
				.json<ProgramDayWorkoutRow[]>(),
	});

	const programCtxMap = useMemo(
		() => buildProgramCtxMap(programDayCtx.data ?? []),
		[programDayCtx.data],
	);

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

	return {
		assignments,
		wellness,
		coachNotes,
		recentPRs,
		firstName,
		programCtxMap,
	};
};

const Today = () => {
	const { colors } = useTheme();
	const nav = useNavigation<Nav>();
	const {
		assignments,
		wellness,
		coachNotes,
		recentPRs,
		firstName,
		programCtxMap,
	} = useToday();
	const session = getStoredWSSession();
	const persona = session?.user.persona;
	const isSolo = persona === 'solo';
	const { data: hasCustomWorkouts } = useCustomWorkouts();

	const appStateRef = useRef(AppState.currentState);

	useEffect(() => {
		if (Platform.OS !== 'ios') return undefined;

		const subscription = AppState.addEventListener('change', nextState => {
			const prevState = appStateRef.current;
			appStateRef.current = nextState;

			const isForegrounding =
				(prevState === 'background' || prevState === 'inactive') &&
				nextState === 'active';

			if (
				isForegrounding &&
				mmkvStorage.getString('healthkit.authorized') === 'true'
			) {
				syncNow().catch(e => {
					// eslint-disable-next-line no-console
					console.error('[HealthSync] foreground sync error', e);
				});
			}
		});

		return () => {
			subscription.remove();
		};
	}, []);

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
						No workouts today
					</Text>
					<Text style={styles.emptySubtext}>
						Your coach hasn&apos;t added you to a program yet.
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
		return assignments.data?.map(a => {
			const programContext = programCtxMap.get(a.workout_id);

			return (
				<TouchableOpacity
					key={a.id}
					style={[styles.workoutCard, { backgroundColor: '#FFFFFF' }]}
					onPress={() =>
						nav.navigate('TrainingWorkoutDetail', {
							workoutId: a.workout_id,
							assignmentId: a.id,
							programContext,
						})
					}
				>
					<View style={styles.workoutCardLeft}>
						<Text
							style={[styles.workoutName, { color: '#111827' }]}
						>
							{a.workouts.name}
						</Text>
						{a.workouts.estimated_duration_minutes && (
							<Text
								style={[
									styles.workoutMeta,
									{ color: '#6B7280' },
								]}
							>
								~{a.workouts.estimated_duration_minutes} min
							</Text>
						)}
						{programContext ? (
							<Text
								numberOfLines={1}
								style={[
									styles.programStrip,
									{ color: '#6B7280' },
								]}
							>
								{programContext.programName} · Week{' '}
								{programContext.weekNumber}
								{programContext.totalWeeks
									? ` of ${programContext.totalWeeks}`
									: ''}{' '}
								· Day {programContext.dayIndex}
							</Text>
						) : null}
					</View>
					<Ionicons name="chevron-right" size={20} color="#6B7280" />
				</TouchableOpacity>
			);
		});
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
	programStrip: { fontSize: 12, marginTop: 3 },
	emptyCard: { borderRadius: 12, padding: 20, alignItems: 'center', gap: 8 },
	emptyText: { fontSize: 14 },
	emptySubtext: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
	link: { fontSize: 14, fontWeight: '600' },
	prScroll: { gap: 10, paddingBottom: 4 },
	prCard: { borderRadius: 12, padding: 14, width: 140, gap: 6 },
	prName: { fontSize: 13, fontWeight: '600' },
	prWeight: { fontSize: 15, fontWeight: '700' },
});

export default Today;
