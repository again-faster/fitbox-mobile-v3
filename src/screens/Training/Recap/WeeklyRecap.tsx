/* eslint-disable no-nested-ternary */
import { useMemo } from 'react';
import {
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { StackScreenProps } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import {
	getMemberEngagement,
	getWeeklyRecapSnapshot,
	type EngagementSnapshot,
	type WeeklyRecapSnapshot,
	type WeeklyRecapWorkout,
} from '@/services/workoutStudio/recap';
import {
	createLoadingReadinessResult,
	getMemberReadiness,
	type ProviderId,
	type ReadinessResult,
} from '@/services/workoutStudio/readiness';
import type { TrainingStackParamList } from '@/types/navigation';
import { trainingTheme } from '@/theme/training';
import SkeletonCard from '../components/SkeletonCard';
import TrainingState from '../components/TrainingState';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingWeeklyRecap'>;
type RecapSession = ReturnType<typeof getStoredWSSession>;

export type WeeklyRecapState = 'loading' | 'error' | 'empty' | 'ready';

export type WeeklyRecapStateCopy = {
	state: WeeklyRecapState;
	title: string;
	detail: string;
};

export const hasMemberRecapSession = (
	session: RecapSession,
): boolean =>
	session?.user.persona === 'member' &&
	!!session.user.id &&
	!!session.user.active_tenant_id;

export const shouldEnableWeeklyRecapQuery = (
	featureEnabled: boolean,
	session: RecapSession,
): boolean => featureEnabled && hasMemberRecapSession(session);

export const weeklyRecapStateCopy = (
	state: WeeklyRecapState,
): WeeklyRecapStateCopy => {
	if (state === 'loading')
		return {
			state,
			title: 'Loading your weekly recap',
			detail: 'Fetching the latest training summary.',
		};
	if (state === 'error')
		return {
			state,
			title: 'Weekly recap unavailable',
			detail: 'We could not load your recap. Try again shortly.',
		};
	if (state === 'empty')
		return {
			state,
			title: 'No recap available yet',
			detail: 'Your weekly summary will appear when recap data is available.',
		};
	return {
		state,
		title: 'Your week at a glance',
		detail: 'A summary of the training data available for this week.',
	};
};

const providerNames: Record<ProviderId, string> = {
	apple_health: 'Apple Health',
	health_connect: 'Health Connect',
	whoop: 'WHOOP',
	garmin: 'Garmin',
	fitbit: 'Fitbit',
	strava: 'Strava',
};

type WeeklyRecapReadinessCopy = {
	status: ReadinessResult['status'];
	title: string;
	detail: string;
	asOfDate: string | null;
	providers: string[];
};

const formatServerDate = (value: string | null): string => {
	if (!value) return 'Date not available';
	const date = moment.utc(value, 'YYYY-MM-DD', true);
	return date.isValid() ? date.format('D MMM YYYY') : 'Date not available';
};

const formatServerRange = (snapshot: WeeklyRecapSnapshot): string =>
	`Week of ${formatServerDate(snapshot.windowStart)} – ${formatServerDate(snapshot.windowEnd)}`;

const formatMetric = (value: number | null, suffix = ''): string =>
	typeof value === 'number' && Number.isFinite(value)
		? `${value}${suffix}`
		: 'Not available';

const workoutName = (workout: WeeklyRecapWorkout): string =>
	workout.name?.trim() || 'Workout';

const workoutDate = (workout: WeeklyRecapWorkout): string =>
	formatServerDate(workout.completedAt);

const workoutAccessibilityLabel = (workout: WeeklyRecapWorkout): string =>
	`${workoutName(workout)}. Completed ${workoutDate(workout)}.`;

export const weeklyRecapReadinessCopy = (
	result: ReadinessResult,
): WeeklyRecapReadinessCopy => {
	if (result.status === 'loading')
		return {
			status: result.status,
			title: 'Loading readiness context',
			detail: 'Checking the readiness information available for this period.',
			asOfDate: null,
			providers: [],
		};
	if (result.status === 'error')
		return {
			status: result.status,
			title: 'Readiness context unavailable',
			detail: 'Readiness information could not be loaded.',
			asOfDate: null,
			providers: [],
		};

	const providers = result.data
		? Array.from(
				new Set(result.data.metrics.map(metric => providerNames[metric.provider])),
			)
		: [];
	if (result.status === 'empty')
		return {
			status: result.status,
			title: 'No readiness context yet',
			detail: 'No readiness information is available for this period.',
			asOfDate: result.asOfDate,
			providers,
		};
	if (result.status === 'baseline')
		return {
			status: result.status,
			title: 'Readiness baseline building',
			detail: 'More connected data is needed before readiness context is established.',
			asOfDate: result.asOfDate,
			providers,
		};
	return {
		status: result.status,
		title: 'Readiness context available',
		detail: 'Readiness context is shown separately from your workout recap.',
		asOfDate: result.asOfDate,
		providers,
	};
};

export const weeklyRecapViewState = (
	enabled: boolean,
	isLoading: boolean,
	isError: boolean,
	snapshot: WeeklyRecapSnapshot | null | undefined,
): WeeklyRecapState => {
	if (!enabled) return 'empty';
	if (isLoading) return 'loading';
	if (isError) return 'error';
	if (!snapshot) return 'empty';
	return 'ready';
};

const Metric = ({ label, value }: { label: string; value: string }) => (
	<View style={styles.stat} accessibilityRole="text">
		<Text style={styles.statValue}>{value}</Text>
		<Text style={styles.statLabel}>{label}</Text>
	</View>
);

const EngagementCard = ({
	engagement,
	isError,
}: {
	engagement: EngagementSnapshot | null | undefined;
	isError: boolean;
}) => (
	<View
		style={styles.card}
		accessibilityRole="summary"
		accessibilityLabel={
			engagement && !isError
				? `Engagement. Active days ${formatMetric(engagement.activeDays)}. Current streak ${formatMetric(engagement.currentStreakDays)} days. Longest streak ${formatMetric(engagement.longestStreakDays)} days.`
				: 'Engagement unavailable. The engagement summary is not available.'
		}
	>
		<Text style={styles.sectionTitle}>Engagement</Text>
		{engagement && !isError ? (
			<View style={styles.grid}>
				<Metric
					label="Active days"
					value={formatMetric(engagement.activeDays)}
				/>
				<Metric
					label="Current streak"
					value={formatMetric(engagement.currentStreakDays, ' days')}
				/>
				<Metric
					label="Longest streak"
					value={formatMetric(engagement.longestStreakDays, ' days')}
				/>
				<Metric
					label="Goals completed"
					value={formatMetric(engagement.goalsCompleted)}
				/>
				<Metric
					label="Badges earned"
					value={formatMetric(engagement.badgesEarned)}
				/>
			</View>
		) : (
			<Text style={styles.cardDetail}>
				Engagement information is not available for this period.
			</Text>
		)}
	</View>
);

const ReadinessCard = ({ result }: { result: ReadinessResult }) => {
	const copy = weeklyRecapReadinessCopy(result);
	const asOf = copy.asOfDate
		? `As of ${formatServerDate(copy.asOfDate)}`
		: 'As of date not available';
	const providers =
		copy.providers.length > 0
			? `Provider signals: ${copy.providers.join(', ')}`
			: 'Provider signals not available';

	return (
		<View
			style={styles.card}
			accessibilityRole="summary"
			accessibilityLabel={`Readiness context. ${copy.title}. ${asOf}. ${providers}.`}
		>
			<Text style={styles.sectionTitle}>Readiness context</Text>
			<Text style={styles.cardTitle}>{copy.title}</Text>
			<Text style={styles.cardDetail}>{copy.detail}</Text>
			<Text style={styles.meta}>{asOf}</Text>
			<Text style={styles.meta}>{providers}</Text>
		</View>
	);
};

const WeeklyRecap = ({ navigation }: Props) => {
	const { isEnabled } = useWorkoutStudio();
	const session = getStoredWSSession();
	const digestEnabled = isEnabled('digest');
	const readinessFeatureEnabled = isEnabled('wearables');
	const recapQueryEnabled = shouldEnableWeeklyRecapQuery(
		digestEnabled,
		session,
	);
	const readinessQueryEnabled =
		recapQueryEnabled && readinessFeatureEnabled;
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;

	const recapQuery = useQuery<WeeklyRecapSnapshot | null>({
		queryKey: ['ws-member-weekly-recap', uid, tenantId],
		queryFn: () => getWeeklyRecapSnapshot(),
		enabled: recapQueryEnabled,
		staleTime: 120_000,
	});
	const engagementQuery = useQuery<EngagementSnapshot | null>({
		queryKey: ['ws-member-engagement', uid, tenantId],
		queryFn: () => getMemberEngagement(),
		enabled: recapQueryEnabled,
		staleTime: 120_000,
	});
	const readinessQuery = useQuery<ReadinessResult>({
		queryKey: ['ws-member-readiness-weekly-recap', uid, tenantId],
		queryFn: () =>
			getMemberReadiness({
				windowDays: 31,
				featureEnabled: readinessFeatureEnabled,
			}),
		enabled: readinessQueryEnabled,
		staleTime: 120_000,
	});
	const snapshot = recapQuery.data;
	const state = weeklyRecapViewState(
		recapQueryEnabled,
		recapQuery.isLoading,
		recapQuery.isError,
		snapshot,
	);
	const copy = weeklyRecapStateCopy(state);
	const readinessResult = readinessQueryEnabled
		? (readinessQuery.data ?? createLoadingReadinessResult())
		: null;

	const refresh = () => {
		if (!recapQueryEnabled) return;
		void recapQuery.refetch();
		void engagementQuery.refetch();
		if (readinessQueryEnabled) void readinessQuery.refetch();
	};

	const summaryLabel = snapshot
		? `Weekly recap. ${formatServerRange(snapshot)}. ${formatMetric(snapshot.completedWorkouts)} workouts. As of ${formatServerDate(snapshot.asOfDate)}.`
		: `Weekly recap. ${copy.title}.`;

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
			refreshControl={
				<RefreshControl
					refreshing={
						(recapQueryEnabled && recapQuery.isRefetching) ||
						(recapQueryEnabled && engagementQuery.isRefetching) ||
						(readinessQueryEnabled && readinessQuery.isRefetching)
					}
					onRefresh={refresh}
					tintColor={trainingTheme.colors.primary}
				/>
			}
		>
			<View>
				<Text style={styles.eyebrow}>WEEKLY RECAP</Text>
				<Text style={styles.title}>
					{snapshot ? formatServerRange(snapshot) : 'Your training week'}
				</Text>
				<Text style={styles.subtitle}>
					{snapshot
						? `Server summary as of ${formatServerDate(snapshot.asOfDate)}.`
						: copy.detail}
				</Text>
			</View>

			{state === 'loading' ? (
				<>
					<SkeletonCard />
					<SkeletonCard />
				</>
			) : state === 'error' ? (
				<TrainingState
					kind="error"
					title={copy.title}
					message={copy.detail}
					actionLabel="Try again"
					onAction={refresh}
				/>
			) : state === 'empty' || !snapshot ? (
				<TrainingState
					kind="empty"
					title={copy.title}
					message={copy.detail}
					actionLabel={recapQueryEnabled ? 'Refresh recap' : undefined}
					onAction={recapQueryEnabled ? refresh : undefined}
				/>
			) : (
				<>
					<View
						style={styles.hero}
						accessibilityRole="summary"
						accessibilityLabel={summaryLabel}
					>
						<View style={styles.heroIcon}>
							<Ionicons
								name="calendar-check-outline"
								size={27}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<Text style={styles.heroValue}>
							{formatMetric(snapshot.completedWorkouts)}
						</Text>
						<Text style={styles.heroLabel}>Workouts completed</Text>
					</View>

					<View style={styles.grid}>
						<Metric
							label="Minutes"
							value={formatMetric(snapshot.completedMinutes)}
						/>
						<Metric
							label="Kg volume"
							value={formatMetric(snapshot.totalVolumeKg)}
						/>
						<Metric
							label="Personal records"
							value={formatMetric(snapshot.personalRecords)}
						/>
						<Metric
							label="Active days"
							value={formatMetric(snapshot.activeDays)}
						/>
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionTitle}>This week</Text>
						{snapshot.workouts.length === 0 ? (
							<Text style={styles.cardDetail}>
								No individual workout details are available for this period.
							</Text>
						) : (
							snapshot.workouts.map(workout => (
								<TouchableOpacity
									key={workout.id}
									style={styles.activity}
									accessibilityRole="button"
									accessibilityLabel={workoutAccessibilityLabel(workout)}
									onPress={() =>
										navigation.navigate(
											'TrainingResultDetail',
											{ workoutResultId: workout.id },
										)
									}
								>
									<View style={styles.check}>
										<Ionicons
											name="check"
											size={16}
											color="#FFFFFF"
										/>
									</View>
									<View style={styles.copy}>
										<Text style={styles.activityName}>
											{workoutName(workout)}
										</Text>
										<Text style={styles.activityMeta}>
											{workoutDate(workout)}
										</Text>
									</View>
									<Ionicons
										name="chevron-right"
										size={20}
										color={trainingTheme.colors.textMuted}
									/>
								</TouchableOpacity>
							))
						)}
					</View>

					<EngagementCard
						engagement={engagementQuery.data}
						isError={engagementQuery.isError}
					/>
					{readinessResult && (
						<ReadinessCard result={readinessResult} />
					)}

					<TouchableOpacity
						style={styles.progressLink}
						accessibilityRole="button"
						accessibilityLabel="View all progress"
						onPress={() => navigation.navigate('TrainingProgress')}
					>
						<Text style={styles.progressLabel}>View all progress</Text>
						<Ionicons
							name="arrow-right"
							size={19}
							color={trainingTheme.colors.primary}
						/>
					</TouchableOpacity>
				</>
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	container: { padding: 16, paddingBottom: 48, gap: 14 },
	eyebrow: {
		color: trainingTheme.colors.primary,
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 1,
	},
	title: {
		color: trainingTheme.colors.text,
		fontSize: 27,
		fontWeight: '700',
		marginTop: 3,
	},
	subtitle: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		lineHeight: 18,
		marginTop: 3,
	},
	hero: {
		alignItems: 'center',
		padding: 22,
		borderRadius: 20,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	heroIcon: {
		width: 50,
		height: 50,
		borderRadius: 25,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	heroValue: {
		color: trainingTheme.colors.text,
		fontSize: 34,
		fontWeight: '800',
		marginTop: 8,
	},
	heroLabel: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		marginTop: 2,
	},
	grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
	stat: {
		width: '48%',
		minHeight: 90,
		justifyContent: 'center',
		padding: 14,
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	statValue: {
		color: trainingTheme.colors.text,
		fontSize: 21,
		fontWeight: '700',
	},
	statLabel: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 4,
	},
	card: {
		padding: 14,
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		gap: 8,
	},
	sectionTitle: {
		color: trainingTheme.colors.text,
		fontSize: 17,
		fontWeight: '700',
	},
	cardTitle: {
		color: trainingTheme.colors.text,
		fontSize: 14,
		fontWeight: '700',
	},
	cardDetail: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		lineHeight: 19,
	},
	meta: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 18,
	},
	activity: {
		minHeight: 62,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: trainingTheme.colors.border,
		paddingTop: 10,
	},
	check: {
		width: 30,
		height: 30,
		borderRadius: 15,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primary,
	},
	copy: { flex: 1 },
	activityName: {
		color: trainingTheme.colors.text,
		fontSize: 14,
		fontWeight: '700',
	},
	activityMeta: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 3,
	},
	progressLink: {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	progressLabel: {
		color: trainingTheme.colors.primary,
		fontSize: 14,
		fontWeight: '700',
	},
});

export default WeeklyRecap;
