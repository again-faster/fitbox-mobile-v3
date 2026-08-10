import { syncNow } from '@/services/healthKit';
import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type {
	AthleteRM,
	ProgramContext,
	WellnessResponse,
} from '@/services/workoutStudio/types';
import { getMemberWorkouts } from '@/services/workoutStudio/workouts';
import { mmkvStorage } from '@/storage';
import type { TrainingStackParamList } from '@/types/navigation';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
	AppState,
	Modal,
	Platform,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { MemberScreen } from '@/components/member';
import { trainingTheme } from '@/theme/training';
import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';
import { useCustomWorkouts } from '../hooks/useCustomWorkouts';
import SkeletonCard from '../components/SkeletonCard';
import ConsistencyCard from './components/ConsistencyCard';
import SectionHeading from '../components/SectionHeading';
import OfflineBanner from '../components/OfflineBanner';
import TrainingState from '../components/TrainingState';
import { useTrainingConnectivity } from '../hooks/useTrainingConnectivity';
import { shouldShowTodayProgressCard } from '../Progress/progressFeatures';
import {
	createLoadingReadinessResult,
	getMemberReadiness,
	type ProviderId,
	type ReadinessMetric,
	type ReadinessResult,
} from '@/services/workoutStudio/readiness';

type Nav = StackNavigationProp<TrainingStackParamList>;

const providerNames: Record<ProviderId, string> = {
	apple_health: 'Apple Health',
	health_connect: 'Health Connect',
	whoop: 'WHOOP',
	garmin: 'Garmin',
	fitbit: 'Fitbit',
	strava: 'Strava',
};

const latestReadinessMetric = (
	metrics: ReadinessMetric[],
): ReadinessMetric | null =>
	[...metrics].sort((left, right) =>
		right.asOfDate.localeCompare(left.asOfDate),
	)[0] ?? null;

const formatReadinessMetric = (
	value: number | null,
	suffix = '',
): string => (value === null ? 'Not available' : `${value}${suffix}`);

export const readinessCopy = (result: ReadinessResult) => {
	if (result.status === 'loading')
		return {
			title: 'Loading readiness',
			detail: 'Checking your latest recovery signals.',
			score: 'Not available',
			band: 'Not available',
			confidence: 'Not available',
			freshness: 'Not available',
			metric: null,
		};
	if (result.status === 'error')
		return {
			title: 'Readiness unavailable',
			detail: result.error.message,
			score: 'Not available',
			band: 'Not available',
			confidence: 'Not available',
			freshness: 'Not available',
			metric: null,
		};

	const metric = latestReadinessMetric(result.data.metrics);
	return {
		title:
			result.status === 'ready'
				? 'Readiness is ready'
				: result.status === 'baseline'
					? 'Building your baseline'
					: 'No readiness data yet',
		detail:
			result.status === 'ready'
				? 'A provider-native readiness score is available.'
				: result.status === 'baseline'
					? 'More connected data is needed before a readiness score is available.'
					: 'Connect a supported provider to add recovery context.',
		score: formatReadinessMetric(metric?.nativeReadinessScore ?? null),
		band:
			result.status === 'ready'
				? 'Ready'
				: result.status === 'baseline'
					? 'Baseline'
					: 'No data',
		confidence:
			result.status === 'ready'
				? 'Measured'
				: result.status === 'baseline'
					? 'Building'
					: 'Not available',
		freshness: `As of ${result.asOfDate}`,
		metric,
	};
};

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

type ActiveWorkoutDraft = {
	version: 1;
	userId: string;
	workoutId: string;
	workoutName: string;
	assignmentId: string | null;
	startedAt: number;
};

const findActiveWorkout = (userId?: string): ActiveWorkoutDraft | null => {
	if (!userId) return null;
	const prefix = `ws:active-workout:${userId}:`;
	const drafts = mmkvStorage
		.getAllKeys()
		.filter(key => key.startsWith(prefix))
		.map(key => {
			try {
				return JSON.parse(
					mmkvStorage.getString(key) ?? '',
				) as ActiveWorkoutDraft;
			} catch {
				return null;
			}
		})
		.filter(
			(value): value is ActiveWorkoutDraft =>
				value?.version === 1 &&
				value.userId === userId &&
				typeof value.workoutId === 'string' &&
				typeof value.workoutName === 'string' &&
				typeof value.startedAt === 'number',
		)
		.sort((a, b) => b.startedAt - a.startedAt);
	return drafts[0] ?? null;
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
const wellnessPromptsEnabledKey = 'training.wellnessPromptsEnabled';
const wellnessPromptDismissedDateKey = 'training.wellnessPromptDismissedDate';

const useToday = () => {
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const firstName = session?.user.full_name?.split(' ')[0] ?? '';

	const assignments = useQuery({
		queryKey: ['ws-assignments-today', uid, tenantId],
		queryFn: () => getMemberWorkouts(tenantId!, todayStr, todayStr),
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
						athlete_id: `eq.${uid}`,
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
	const nav = useNavigation<Nav>();
	const { features, isEnabled } = useWorkoutStudio();
	const {
		assignments,
		wellness,
		coachNotes,
		recentPRs,
		firstName,
		programCtxMap,
	} = useToday();
	const session = getStoredWSSession();
	const readinessFeatureEnabled = isEnabled('wearables');
	const readinessQuery = useQuery<ReadinessResult>({
		queryKey: [
			'ws-member-readiness-today',
			session?.user.id,
			session?.user.active_tenant_id,
		],
		queryFn: () =>
			getMemberReadiness({
				windowDays: 7,
				featureEnabled: readinessFeatureEnabled,
			}),
		enabled:
			readinessFeatureEnabled &&
			!!session?.user.id &&
			!!session?.user.active_tenant_id,
		staleTime: 60_000,
	});
	const readinessResult = readinessFeatureEnabled
		? (readinessQuery.data ?? createLoadingReadinessResult())
		: null;
	const persona = session?.user.persona;
	const activeWorkout = findActiveWorkout(session?.user.id);
	const isSolo = persona === 'solo';
	const { data: hasCustomWorkouts } = useCustomWorkouts();
	const { isOffline, refresh: refreshConnectivity } =
		useTrainingConnectivity();
	const [wellnessPromptsEnabled, setWellnessPromptsEnabled] = useState(
		() => mmkvStorage.getString(wellnessPromptsEnabledKey) !== 'false',
	);
	const [wellnessPromptDismissedDate, setWellnessPromptDismissedDate] =
		useState(() => mmkvStorage.getString(wellnessPromptDismissedDateKey));
	const [wellnessPromptVisible, setWellnessPromptVisible] = useState(false);
	const wellnessPromptPresentedDate = useRef<string | null>(null);

	useFocusEffect(
		useCallback(() => {
			setWellnessPromptsEnabled(
				mmkvStorage.getString(wellnessPromptsEnabledKey) !== 'false',
			);
			setWellnessPromptDismissedDate(
				mmkvStorage.getString(wellnessPromptDismissedDateKey),
			);
		}, []),
	);

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
	const isRefreshing =
		assignments.isRefetching ||
		wellness.isRefetching ||
		readinessQuery.isRefetching;
	const hasWellnessToday = (wellness.data?.length ?? 0) > 0;
	const showWellnessPrompt =
		!hasWellnessToday &&
		wellnessPromptsEnabled &&
		wellnessPromptDismissedDate !== todayStr;

	useEffect(() => {
		if (
			!wellness.isLoading &&
			showWellnessPrompt &&
			wellnessPromptPresentedDate.current !== todayStr
		) {
			wellnessPromptPresentedDate.current = todayStr;
			setWellnessPromptVisible(true);
		}
	}, [showWellnessPrompt, wellness.isLoading]);

	const dismissWellnessPromptToday = () => {
		mmkvStorage.set(wellnessPromptDismissedDateKey, todayStr);
		setWellnessPromptDismissedDate(todayStr);
		setWellnessPromptVisible(false);
	};

	const turnOffWellnessPrompts = () => {
		mmkvStorage.set(wellnessPromptsEnabledKey, 'false');
		setWellnessPromptsEnabled(false);
		setWellnessPromptVisible(false);
	};

	const startWellnessCheckIn = () => {
		setWellnessPromptVisible(false);
		nav.navigate('TrainingWellness');
	};

	const renderReadiness = () => {
		if (!readinessResult) return null;
		const summary = readinessCopy(readinessResult);
		const native = summary.metric;
		const nativeText = native
			? `${providerNames[native.provider]} native · Sleep ${formatReadinessMetric(native.sleepMinutes, ' min')} · HRV ${formatReadinessMetric(native.hrvMs, ' ms')} · Resting HR ${formatReadinessMetric(native.restingHr, ' bpm')} · Recovery ${formatReadinessMetric(native.nativeRecoveryScore)} · Native readiness ${formatReadinessMetric(native.nativeReadinessScore)}`
			: 'No provider-native metrics available';
		return (
			<TouchableOpacity
				style={styles.readinessCard}
				accessibilityRole="button"
				accessibilityLabel={`Readiness. ${summary.title}. Score ${summary.score}. Band ${summary.band}. Confidence ${summary.confidence}. Freshness ${summary.freshness}. ${nativeText}`}
				onPress={() => nav.navigate('TrainingWearables')}
			>
				<View style={styles.readinessIcon}>
					<Ionicons
						name="weather-sunset-up"
						size={22}
						color={trainingTheme.colors.primary}
					/>
				</View>
				<View style={styles.cardText}>
					<Text style={styles.progressTitle}>Readiness</Text>
					<Text style={styles.progressSubtitle}>{summary.title}</Text>
					<Text style={styles.readinessDetail}>{summary.detail}</Text>
					<View style={styles.readinessStats}>
						<Text style={styles.readinessMeta}>
							Score {summary.score}
						</Text>
						<Text style={styles.readinessMeta}>
							Band {summary.band}
						</Text>
						<Text style={styles.readinessMeta}>
							Confidence {summary.confidence}
						</Text>
					</View>
					<Text style={styles.readinessMeta}>
						{summary.freshness}
					</Text>
					<Text style={styles.readinessMeta}>{nativeText}</Text>
				</View>
				<Ionicons
					name="chevron-right"
					size={21}
					color={trainingTheme.colors.textMuted}
				/>
			</TouchableOpacity>
		);
	};

	const refresh = () => {
		void assignments.refetch();
		void wellness.refetch();
		void coachNotes.refetch();
		void recentPRs.refetch();
		if (readinessFeatureEnabled) void readinessQuery.refetch();
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
		if (assignments.isError) {
			return (
				<View style={styles.stateCard}>
					<TrainingState
						kind={isOffline ? 'offline' : 'error'}
						title="Today's training couldn't load"
						message={
							isOffline
								? 'Reconnect to load your latest assigned workouts.'
								: 'Your other Training information is still available.'
						}
						actionLabel="Try again"
						onAction={() => void assignments.refetch()}
					/>
				</View>
			);
		}
		if (assignments.data?.length === 0) {
			return (
				<View
					style={[styles.emptyCard, { backgroundColor: trainingTheme.colors.surface }]}
				>
					<Text style={[styles.emptyText, { color: trainingTheme.colors.textMuted }]}>
						No workouts today
					</Text>
					<Text style={styles.emptySubtext}>
						Your coach hasn&apos;t added you to a program yet.
					</Text>
					{isSolo || hasCustomWorkouts ? (
						<TouchableOpacity
							onPress={() => nav.navigate('TrainingBuildList')}
						>
							<Text
								style={[
									styles.link,
									{ color: trainingTheme.colors.primary },
								]}
							>
								Build a workout
							</Text>
						</TouchableOpacity>
					) : (
						<TouchableOpacity
							onPress={() => nav.navigate('TrainingWorkouts')}
						>
							<Text
								style={[
									styles.link,
									{ color: trainingTheme.colors.primary },
								]}
							>
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
					style={[styles.workoutCard, { backgroundColor: trainingTheme.colors.surface }]}
					onPress={() =>
						nav.navigate('TrainingWorkoutDetail', {
							workoutId: a.workout_id,
							assignmentId:
								a.source?.type === 'class' ? undefined : a.id,
							programContext,
						})
					}
				>
					<View style={styles.workoutCardLeft}>
						<Text
							style={[styles.workoutName, { color: trainingTheme.colors.text }]}
						>
							{a.workouts.name}
						</Text>
						{a.workouts.estimated_duration_minutes && (
							<Text
								style={[
									styles.workoutMeta,
									{ color: trainingTheme.colors.textMuted },
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
									{ color: trainingTheme.colors.textMuted },
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
					<Ionicons name="chevron-right" size={20} color={trainingTheme.colors.textMuted} />
				</TouchableOpacity>
			);
		});
	};

	return (
		<MemberScreen style={styles.safeArea} contentContainerStyle={styles.screenContent} edges={['top']}>
			<ScrollView
				style={styles.screen}
				contentContainerStyle={styles.container}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={refresh}
						tintColor={trainingTheme.colors.primary}
					/>
				}
			>
				{isOffline ? (
					<OfflineBanner
						onRetry={() => {
							void refreshConnectivity();
							refresh();
						}}
					/>
				) : null}
				{/* Greeting */}
				<View style={styles.greetingRow}>
					<View style={styles.greetingCopy}>
						<Text
							style={styles.greeting}
							numberOfLines={1}
							adjustsFontSizeToFit
							minimumFontScale={0.78}
						>
							{greeting()}, {firstName}
						</Text>
						<Text style={styles.date}>
							{moment().format('dddd, MMMM D')}
						</Text>
					</View>
					<View style={styles.greetingActions}>
						<TouchableOpacity
							onPress={() => nav.navigate('TrainingMore')}
							style={styles.moreButton}
							accessibilityRole="button"
							accessibilityLabel="Open more training options"
						>
							<Ionicons
								name="dots-horizontal"
								size={19}
								color={trainingTheme.colors.text}
							/>
							<Text style={styles.moreText}>More</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() =>
								nav.navigate('TrainingNotifications')
							}
							style={styles.bellWrap}
							accessibilityRole="button"
							accessibilityLabel="Open training notifications"
						>
							<Ionicons
								name="bell-outline"
								size={24}
								color={trainingTheme.colors.text}
							/>
							{(coachNotes.data ?? 0) > 0 && (
								<View
									style={[
										styles.badge,
										{
											backgroundColor:
												trainingTheme.colors.primary,
										},
									]}
								>
									<Text style={styles.badgeText}>
										{coachNotes.data}
									</Text>
								</View>
							)}
						</TouchableOpacity>
					</View>
				</View>

				{activeWorkout ? (
					<View style={styles.headerActions}>
						<TouchableOpacity
							style={styles.continueCard}
							accessibilityRole="button"
							accessibilityLabel={`Continue ${activeWorkout.workoutName}`}
							onPress={() =>
								nav.navigate('TrainingRunWorkout', {
									workoutId: activeWorkout.workoutId,
									assignmentId:
										activeWorkout.assignmentId ?? undefined,
									workoutName: activeWorkout.workoutName,
								})
							}
						>
							<View style={styles.continueIcon}>
								<Ionicons
									name="play"
									size={22}
									color={trainingTheme.colors.surface}
								/>
							</View>
							<View style={styles.cardText}>
								<Text style={styles.continueEyebrow}>
									WORKOUT IN PROGRESS
								</Text>
								<Text
									style={styles.continueTitle}
									numberOfLines={1}
								>
									{activeWorkout.workoutName}
								</Text>
								<Text style={styles.continueMeta}>
									Tap to continue
								</Text>
							</View>
							<Ionicons
								name="chevron-right"
								size={22}
								color={trainingTheme.colors.primary}
							/>
						</TouchableOpacity>
					</View>
				) : null}

				{/* Today's training is the member's primary next action. */}
				<SectionHeading title="Today's training" />

				{renderTraining()}

				<ConsistencyCard />

				{shouldShowTodayProgressCard(features) && (
					<TouchableOpacity
						style={styles.progressCard}
						accessibilityRole="button"
						onPress={() => nav.navigate('TrainingProgress')}
					>
						<View style={styles.progressIcon}>
							<Ionicons
								name="chart-line"
								size={22}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<View style={styles.cardText}>
							<Text style={styles.progressTitle}>
								My Progress
							</Text>
							<Text style={styles.progressSubtitle}>
								Results, PRs, maxes and benchmarks
							</Text>
						</View>
						<Ionicons
							name="chevron-right"
							size={21}
							color={trainingTheme.colors.textMuted}
						/>
					</TouchableOpacity>
				)}

				{renderReadiness()}

				{/* Wellness check-in card */}
				{showWellnessPrompt ? (
					<View style={[styles.card, { backgroundColor: trainingTheme.colors.surface }]}>
						<TouchableOpacity
							onPress={() => nav.navigate('TrainingWellness')}
							accessibilityRole="button"
							accessibilityLabel="Complete today's wellness check-in"
						>
							<View style={styles.cardRow}>
								<Ionicons
									name="heart-outline"
									size={22}
									color={trainingTheme.colors.textMuted}
								/>
								<View style={styles.cardText}>
									<Text
										style={[
											styles.cardTitle,
											{ color: trainingTheme.colors.text },
										]}
									>
										Wellness check-in
									</Text>
									<Text
										style={[
											styles.cardSub,
											{ color: trainingTheme.colors.textMuted },
										]}
									>
										≈ 10 seconds
									</Text>
								</View>
								<Ionicons
									name="chevron-right"
									size={20}
									color={trainingTheme.colors.textMuted}
								/>
							</View>
						</TouchableOpacity>
						<View style={styles.wellnessPromptActions}>
							<TouchableOpacity
								onPress={dismissWellnessPromptToday}
								accessibilityRole="button"
							>
								<Text style={styles.wellnessPromptAction}>
									Not today
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={turnOffWellnessPrompts}
								accessibilityRole="button"
							>
								<Text style={styles.wellnessPromptAction}>
									Turn off prompts
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				) : null}

				{!showWellnessPrompt && hasWellnessToday ? (
					<View style={styles.wellnessDoneRow}>
						<Ionicons
							name="check-circle"
							size={16}
							color={trainingTheme.colors.success}
						/>
						<Text style={styles.wellnessDoneText}>
							Wellness check-in done
						</Text>
					</View>
				) : null}

				{/* Recent PRs */}
				{(recentPRs.data?.length ?? 0) > 0 && (
					<>
						<SectionHeading title="Recent PRs" action="View all" />
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
										{ backgroundColor: trainingTheme.colors.surface },
									]}
									onPress={() => nav.navigate('TrainingPRs')}
								>
									<Ionicons
										name="trophy-outline"
										size={18}
									color={trainingTheme.colors.warning}
									/>
									<Text
										style={[
											styles.prName,
											{ color: trainingTheme.colors.text },
										]}
									>
										{pr.movements.name}
									</Text>
									<Text
										style={[
											styles.prWeight,
											{
												color: trainingTheme.colors
													.primary,
											},
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
						style={[styles.card, { backgroundColor: trainingTheme.colors.surface }]}
						onPress={() => nav.navigate('TrainingCoachNotes')}
					>
						<View style={styles.cardRow}>
							<Ionicons
								name="message-text-outline"
								size={22}
								color={trainingTheme.colors.primary}
							/>
							<Text
								style={[styles.cardTitle, { color: trainingTheme.colors.text }]}
							>
								{coachNotes.data} unread coach note
								{(coachNotes.data ?? 0) > 1 ? 's' : ''}
							</Text>
							<Ionicons
								name="chevron-right"
								size={20}
								color={trainingTheme.colors.textMuted}
							/>
						</View>
					</TouchableOpacity>
				)}

				{/* Build card */}
				{(isSolo || hasCustomWorkouts) && (
					<TouchableOpacity
						style={[styles.card, { backgroundColor: trainingTheme.colors.surface }]}
						onPress={() => nav.navigate('TrainingBuildList')}
					>
						<View style={styles.cardRow}>
							<Ionicons
								name="pencil-ruler"
								size={22}
								color={trainingTheme.colors.primary}
							/>
							<View style={styles.cardText}>
								<Text
									style={[
										styles.cardTitle,
										{ color: trainingTheme.colors.text },
									]}
								>
									My workouts
								</Text>
								<Text
									style={[
										styles.cardSub,
										{ color: trainingTheme.colors.textMuted },
									]}
								>
									Build and schedule personal workouts
								</Text>
							</View>
							<Ionicons
								name="chevron-right"
								size={20}
								color={trainingTheme.colors.textMuted}
							/>
						</View>
					</TouchableOpacity>
				)}
			</ScrollView>
			<Modal
				visible={wellnessPromptVisible && showWellnessPrompt}
				transparent
				animationType="slide"
				onRequestClose={dismissWellnessPromptToday}
			>
				<View style={styles.wellnessModalBackdrop}>
					<View style={styles.wellnessSheet}>
						<View style={styles.wellnessSheetHandle} />
						<View style={styles.wellnessSheetIcon}>
							<Ionicons
								name="heart-pulse"
								size={28}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<Text style={styles.wellnessSheetTitle}>
							How are you feeling today?
						</Text>
						<Text style={styles.wellnessSheetBody}>
							A 10-second check-in helps personalise your training
							and gives your coach useful recovery context.
						</Text>
						<TouchableOpacity
							style={styles.wellnessSheetPrimary}
							onPress={startWellnessCheckIn}
							accessibilityRole="button"
						>
							<Text style={styles.wellnessSheetPrimaryText}>
								Check in now
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.wellnessSheetSecondary}
							onPress={dismissWellnessPromptToday}
							accessibilityRole="button"
						>
							<Text style={styles.wellnessSheetSecondaryText}>
								Not today
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={turnOffWellnessPrompts}
							accessibilityRole="button"
						>
							<Text style={styles.wellnessSheetOptOut}>
								Don’t remind me daily
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</MemberScreen>
	);
};

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: trainingTheme.colors.background },
	screenContent: { paddingHorizontal: 0 },
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	container: {
		padding: trainingTheme.spacing.lg,
		paddingBottom: 40,
		gap: trainingTheme.spacing.md,
	},
	greetingRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	greetingCopy: {
		flex: 1,
		paddingRight: trainingTheme.spacing.sm,
	},
	greeting: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 26,
		fontWeight: '700',
		letterSpacing: -0.6,
	},
	date: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		marginTop: 3,
	},
	headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	greetingActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	moreButton: {
		height: trainingTheme.touchTarget,
		paddingHorizontal: 12,
		borderRadius: trainingTheme.radius.pill,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 5,
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
	},
	moreText: {
		color: trainingTheme.colors.text,
		fontSize: 12,
		fontWeight: '600',
	},
	bellWrap: {
		position: 'relative',
		width: trainingTheme.touchTarget,
		height: trainingTheme.touchTarget,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		alignItems: 'center',
		justifyContent: 'center',
	},
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
	badgeText: { color: trainingTheme.colors.surface, fontSize: 10, fontWeight: '700' },
	sectionHeader: { fontSize: 17, fontWeight: '600', marginTop: 8 },
	card: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: trainingTheme.radius.md,
		padding: trainingTheme.spacing.lg,
	},
	cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	cardText: { flex: 1 },
	cardTitle: { fontSize: 15, fontWeight: '600' },
	cardSub: { fontSize: 13, marginTop: 2 },
	workoutCard: {
		minHeight: 96,
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		borderLeftColor: trainingTheme.colors.primary,
		borderLeftWidth: 4,
		borderRadius: trainingTheme.radius.md,
		padding: trainingTheme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	workoutCardLeft: { flex: 1 },
	workoutName: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 17,
		fontWeight: '700',
	},
	workoutMeta: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		marginTop: 4,
	},
	programStrip: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 5,
	},
	emptyCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: trainingTheme.radius.md,
		padding: trainingTheme.spacing.xl,
		alignItems: 'center',
		gap: trainingTheme.spacing.sm,
	},
	emptyText: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '600',
	},
	emptySubtext: { fontSize: 13, color: trainingTheme.colors.disabled, textAlign: 'center' },
	link: {
		color: trainingTheme.colors.primary,
		fontSize: 14,
		fontWeight: '700',
	},
	prScroll: { gap: 10, paddingBottom: 4 },
	prCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: trainingTheme.radius.md,
		padding: trainingTheme.spacing.lg,
		width: 152,
		gap: 6,
	},
	prName: { fontSize: 13, fontWeight: '600' },
	prWeight: { fontSize: 15, fontWeight: '700' },
	wellnessDoneRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 4,
		paddingVertical: 2,
	},
	progressCard: {
		minHeight: 76,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 14,
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	progressIcon: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	progressTitle: {
		color: trainingTheme.colors.text,
		fontSize: 16,
		fontWeight: '700',
	},
	progressSubtitle: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 3,
	},
	readinessCard: {
		minHeight: 150,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 14,
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	readinessIcon: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	readinessDetail: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 17,
		marginTop: 4,
	},
	readinessStats: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginTop: 7,
	},
	readinessMeta: {
		color: trainingTheme.colors.textMuted,
		fontSize: 11,
		lineHeight: 16,
		marginTop: 3,
	},
	wellnessDoneText: {
		fontSize: 13,
		color: trainingTheme.colors.textMuted,
	},
	wellnessPromptActions: {
		borderTopColor: trainingTheme.colors.border,
		borderTopWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 20,
		marginTop: trainingTheme.spacing.md,
		paddingTop: trainingTheme.spacing.md,
	},
	wellnessPromptAction: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		fontWeight: '600',
	},
	wellnessModalBackdrop: {
		backgroundColor: 'rgba(17, 24, 39, 0.48)',
		flex: 1,
		justifyContent: 'flex-end',
	},
	wellnessSheet: {
		alignItems: 'center',
		backgroundColor: trainingTheme.colors.surface,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingBottom: 32,
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	wellnessSheetHandle: {
		backgroundColor: trainingTheme.colors.disabled,
		borderRadius: 2,
		height: 4,
		marginBottom: 22,
		width: 42,
	},
	wellnessSheetIcon: {
		alignItems: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: 28,
		height: 56,
		justifyContent: 'center',
		marginBottom: 16,
		width: 56,
	},
	wellnessSheetTitle: {
		color: trainingTheme.colors.text,
		fontSize: 22,
		fontWeight: '700',
		textAlign: 'center',
	},
	wellnessSheetBody: {
		color: trainingTheme.colors.textMuted,
		fontSize: 14,
		lineHeight: 21,
		marginBottom: 22,
		marginTop: 8,
		textAlign: 'center',
	},
	wellnessSheetPrimary: {
		alignItems: 'center',
		backgroundColor: trainingTheme.colors.primary,
		borderRadius: 14,
		justifyContent: 'center',
		minHeight: 52,
		width: '100%',
	},
	wellnessSheetPrimaryText: {
		color: trainingTheme.colors.surface,
		fontSize: 16,
		fontWeight: '700',
	},
	wellnessSheetSecondary: {
		alignItems: 'center',
		paddingVertical: 15,
		width: '100%',
	},
	wellnessSheetSecondaryText: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '600',
	},
	wellnessSheetOptOut: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		padding: 6,
	},
	stateCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: trainingTheme.radius.md,
	},
	continueCard: {
		minHeight: 88,
		backgroundColor: trainingTheme.colors.primarySoft,
		borderColor: trainingTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: trainingTheme.radius.md,
		padding: trainingTheme.spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
	},
	continueIcon: {
		width: 46,
		height: 46,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
	},
	continueEyebrow: {
		color: trainingTheme.colors.primary,
		fontFamily: 'Inter-Variable',
		fontSize: 10,
		fontWeight: '800',
		letterSpacing: 0.8,
	},
	continueTitle: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 16,
		fontWeight: '700',
		marginTop: 2,
	},
	continueMeta: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 12,
		marginTop: 2,
	},
});

export default Today;
