/* eslint-disable no-nested-ternary */
import { useMemo, useState } from 'react';
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
import { MemberScreen } from '@/components/member';
import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import {
	createLoadingReadinessResult,
	getMemberReadiness,
	type ProviderId,
	type ReadinessMetric,
	type ReadinessResult,
} from '@/services/workoutStudio/readiness';
import type { TrainingStackParamList } from '@/types/navigation';
import { trainingTheme } from '@/theme/training';
import SkeletonCard from '../components/SkeletonCard';
import TrainingState from '../components/TrainingState';
import TrainingTabShell from '../Tabs/TrainingTabShell';
import {
	buildProgressContent,
	shouldRenderProgressScreen,
	type ProgressContent,
} from './progressFeatures';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingProgress'>;
type Range = '30' | '90' | '365' | 'all';
export type ProgressResult = {
	id: string;
	workout_id: string;
	completed_at: string;
	duration_seconds: number | null | undefined;
	total_volume_kg: number | null | undefined;
	workouts: { name?: string | null } | null | undefined;
};
type ProgressRM = { id: string; achieved_on: string };

export type ProgressTotals = {
	workouts: number;
	minutes: number | null;
	volume: number | null;
	prs: number;
};

const hasMetricValue = (value: number | null | undefined): value is number =>
	typeof value === 'number' && Number.isFinite(value);

const sumPresent = (
	values: Array<number | null | undefined>,
): number | null => {
	const present = values.filter(hasMetricValue);
	return present.length > 0
		? present.reduce((sum, value) => sum + value, 0)
		: null;
};

export const summarizeProgress = (
	rows: ProgressResult[],
	prs: number,
): ProgressTotals => {
	const seconds = sumPresent(rows.map(item => item.duration_seconds));
	const volume = sumPresent(rows.map(item => item.total_volume_kg));
	return {
		workouts: rows.length,
		minutes: seconds === null ? null : Math.round(seconds / 60),
		volume: volume === null ? null : Math.round(volume),
		prs,
	};
};

export type ProgressActivityCopy = {
	name: string;
	detail: string;
	accessibilityLabel: string;
};

export const progressActivityCopy = (
	item: Pick<
		ProgressResult,
		'completed_at' | 'duration_seconds' | 'workouts'
	>,
): ProgressActivityCopy => {
	const name = item.workouts?.name?.trim() || 'Workout';
	const date = moment(item.completed_at).format('ddd, D MMM');
	const duration = hasMetricValue(item.duration_seconds)
		? `${Math.round(item.duration_seconds / 60)} min`
		: 'Duration not available';
	return {
		name,
		detail: `${date} · ${duration}`,
		accessibilityLabel: `${name}. Completed ${date}. ${duration}.`,
	};
};
const RANGES: Array<{ key: Range; label: string }> = [
	{ key: '30', label: '30D' },
	{ key: '90', label: '90D' },
	{ key: '365', label: '1Y' },
	{ key: 'all', label: 'All' },
];

type ProgressScreenProps = Pick<Props, 'navigation'> & {
	content: ProgressContent;
	readinessFeatureEnabled: boolean;
};

type ReadinessSession = ReturnType<typeof getStoredWSSession>;

export const shouldEnableReadinessQuery = (
	featureEnabled: boolean,
	session: ReadinessSession,
): boolean =>
	featureEnabled && !!session?.user.id && !!session?.user.active_tenant_id;

export const hasAuthenticatedProgressSession = (
	session: ReadinessSession,
): boolean => !!session?.user.id && !!session?.user.active_tenant_id;

const providerNames: Record<ProviderId, string> = {
	apple_health: 'Apple Health',
	health_connect: 'Health Connect',
	whoop: 'WHOOP',
	garmin: 'Garmin',
	fitbit: 'Fitbit',
	strava: 'Strava',
};

export type ReadinessHistoryPoint = {
	date: string;
	score: number | null;
};

export type ReadinessHistoryCopy = {
	status: ReadinessResult['status'];
	statusLabel: string;
	title: string;
	detail: string;
	confidence: string;
	freshness: string;
	trend: string;
	points: ReadinessHistoryPoint[];
	nativeMetrics: ReadinessMetric[];
};

export const formatNativeMetric = (
	value: number | null | undefined,
	suffix = '',
): string => (hasMetricValue(value) ? `${value}${suffix}` : 'Not available');

const hasNativeMetric = (metric: ReadinessMetric): boolean =>
	hasMetricValue(metric.sleepMinutes) ||
	hasMetricValue(metric.hrvMs) ||
	hasMetricValue(metric.restingHr) ||
	hasMetricValue(metric.nativeRecoveryScore) ||
	hasMetricValue(metric.nativeReadinessScore);

const formatScore = (score: number | null | undefined): string =>
	formatNativeMetric(score);

export const readinessHistoryCopy = (
	result: ReadinessResult,
): ReadinessHistoryCopy => {
	if (result.status === 'loading')
		return {
			status: result.status,
			statusLabel: 'Loading',
			title: 'Loading readiness history',
			detail: 'Checking your recent readiness signals.',
			confidence: 'Not available',
			freshness: 'Not available',
			trend: 'Not available',
			points: [],
			nativeMetrics: [],
		};
	if (result.status === 'error')
		return {
			status: result.status,
			statusLabel: 'Error',
			title: 'Readiness history unavailable',
			detail: result.error.message,
			confidence: 'Not available',
			freshness: 'Not available',
			trend: 'Not available',
			points: [],
			nativeMetrics: [],
		};

	const sortedMetrics = [...result.data.metrics].sort((left, right) =>
		left.asOfDate.localeCompare(right.asOfDate),
	);
	const points: ReadinessHistoryPoint[] = [];
	const nativeMetrics = sortedMetrics.filter(hasNativeMetric).slice(-7);

	let statusLabel = 'Empty';
	let title = 'No readiness history yet';
	let detail = 'Connect a supported provider to add recovery context.';
	let confidence = 'Not available';
	if (result.status === 'ready') {
		statusLabel = 'Unavailable';
		title = 'Fitbox readiness unavailable';
		detail =
			'No Fitbox readiness score is available in this window. Provider-native scores are shown separately.';
	} else if (result.status === 'baseline') {
		statusLabel = 'Baseline';
		title = 'Building your baseline';
		detail =
			'More connected data is needed before a readiness score is available.';
		confidence = 'Building';
	}

	return {
		status: result.status,
		statusLabel,
		title,
		detail,
		confidence,
		freshness: 'Not available',
		trend: 'Not available',
		points,
		nativeMetrics,
	};
};

type ProgressReadinessHistoryProps = {
	result: ReadinessResult;
};

export const ProgressReadinessHistory = ({
	result,
}: ProgressReadinessHistoryProps) => {
	const copy = readinessHistoryCopy(result);

	return (
		<View
			style={styles.readinessCard}
			accessibilityRole="summary"
			accessibilityLabel={`Readiness history. Status ${copy.statusLabel}. ${copy.title}. Trend ${copy.trend}. Confidence ${copy.confidence}. Freshness ${copy.freshness}.`}
		>
			<View style={styles.readinessHeader}>
				<View style={styles.readinessIcon}>
					<Ionicons
						name="chart-timeline-variant"
						size={22}
						color={trainingTheme.colors.primary}
					/>
				</View>
				<View style={styles.readinessCopy}>
					<Text style={styles.readinessTitle}>Readiness trend</Text>
					<Text style={styles.readinessSubtitle}>{copy.title}</Text>
				</View>
			</View>
			<Text style={styles.readinessDetail}>{copy.detail}</Text>
			<View style={styles.readinessStats}>
				<Text style={styles.readinessMeta}>
					Status {copy.statusLabel}
				</Text>
				<Text style={styles.readinessMeta}>Trend {copy.trend}</Text>
				<Text style={styles.readinessMeta}>
					Confidence {copy.confidence}
				</Text>
			</View>
			<Text style={styles.readinessMeta}>Freshness {copy.freshness}</Text>

			{copy.points.length > 0 && (
				<View style={styles.historyRows}>
					{copy.points.map((point, index) => (
						<View
							key={`${point.date}-${index}`}
							style={styles.historyRow}
						>
							<Text style={styles.historyDate}>{point.date}</Text>
							<Text style={styles.historyScore}>
								{point.score === null
									? 'Score not available'
									: `Score ${formatScore(point.score)}`}
							</Text>
						</View>
					))}
				</View>
			)}

			<View style={styles.nativeMetricsCard}>
				<Text style={styles.nativeMetricsTitle}>
					Provider-native signals
				</Text>
				{copy.nativeMetrics.length === 0 ? (
					<Text style={styles.nativeMetricsText}>
						No provider-native metrics available.
					</Text>
				) : (
					copy.nativeMetrics.map(metric => (
						<View
							key={`${metric.provider}-${metric.asOfDate}`}
							style={styles.nativeMetricRow}
						>
							<Text style={styles.nativeMetricProvider}>
								{providerNames[metric.provider]} ·{' '}
								{metric.asOfDate}
							</Text>
							<Text style={styles.nativeMetricsText}>
								Native readiness{' '}
								{formatNativeMetric(
									metric.nativeReadinessScore,
								)}{' '}
								· Recovery{' '}
								{formatScore(metric.nativeRecoveryScore)} ·
								Sleep{' '}
								{!hasMetricValue(metric.sleepMinutes)
									? 'Not available'
									: `${metric.sleepMinutes} min`}{' '}
								· HRV{' '}
								{!hasMetricValue(metric.hrvMs)
									? 'Not available'
									: `${metric.hrvMs} ms`}
								· Resting HR{' '}
								{!hasMetricValue(metric.restingHr)
									? 'Not available'
									: `${metric.restingHr} bpm`}
							</Text>
						</View>
					))
				)}
			</View>
		</View>
	);
};

const Progress = ({ navigation }: Props) => {
	const { features, isEnabled } = useWorkoutStudio();
	const content = useMemo(() => buildProgressContent(features), [features]);

	if (!shouldRenderProgressScreen(features)) {
		return (
			<TrainingState
				kind="empty"
				title="Progress unavailable"
				message="Your gym hasn't enabled a progress feature for members."
			/>
		);
	}

	return (
		<ProgressScreen
			navigation={navigation}
			content={content}
			readinessFeatureEnabled={isEnabled('wearables')}
		/>
	);
};

const ProgressScreen = ({
	navigation,
	content,
	readinessFeatureEnabled,
}: ProgressScreenProps) => {
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const hasAuthenticatedSession = hasAuthenticatedProgressSession(session);
	const readinessQueryEnabled =
		readinessFeatureEnabled && hasAuthenticatedSession;
	const [range, setRange] = useState<Range>('90');
	const from =
		range === 'all'
			? null
			: moment().subtract(Number(range), 'days').toISOString();
	const results = useQuery({
		queryKey: ['ws-progress-results', uid, range],
		queryFn: () =>
			wsApi()
				.get('workout_results', {
					searchParams: {
						select: 'id,workout_id,completed_at,duration_seconds,total_volume_kg,workouts(name)',
						athlete_id: `eq.${uid}`,
						...(from ? { completed_at: `gte.${from}` } : {}),
						order: 'completed_at.desc',
						limit: '1000',
					},
				})
				.json<ProgressResult[]>(),
		enabled: hasAuthenticatedSession && content.needsResultQuery,
		staleTime: 120_000,
	});
	const prs = useQuery({
		queryKey: ['ws-progress-prs', uid, range],
		queryFn: () =>
			wsApi()
				.get('athlete_rms', {
					searchParams: {
						select: 'id,achieved_on',
						athlete_id: `eq.${uid}`,
						...(from
							? {
									achieved_on: `gte.${moment(from).format('YYYY-MM-DD')}`,
								}
							: {}),
						limit: '1000',
					},
				})
				.json<ProgressRM[]>(),
		enabled: hasAuthenticatedSession && content.needsRMQuery,
		staleTime: 120_000,
	});
	const readinessQuery = useQuery<ReadinessResult>({
		queryKey: [
			'ws-member-readiness-progress',
			session?.user.id,
			session?.user.active_tenant_id,
		],
		queryFn: () =>
			getMemberReadiness({
				windowDays: 31,
				featureEnabled: readinessFeatureEnabled,
			}),
		enabled: readinessQueryEnabled,
		staleTime: 120_000,
	});
	const readinessResult = readinessQueryEnabled
		? (readinessQuery.data ?? createLoadingReadinessResult())
		: null;
	const totals = useMemo(
		() => summarizeProgress(results.data ?? [], prs.data?.length ?? 0),
		[results.data, prs.data],
	);
	const refresh = () => {
		if (!hasAuthenticatedSession) return;
		if (content.needsResultQuery) void results.refetch();
		if (content.needsRMQuery) void prs.refetch();
		if (readinessQueryEnabled) void readinessQuery.refetch();
	};
	const loading =
		(hasAuthenticatedSession &&
			content.needsResultQuery &&
			results.isLoading) ||
		(hasAuthenticatedSession && content.needsRMQuery && prs.isLoading);
	const hasError =
		(hasAuthenticatedSession &&
			content.needsResultQuery &&
			results.isError) ||
		(hasAuthenticatedSession && content.needsRMQuery && prs.isError);

	return (
		<MemberScreen contentContainerStyle={styles.screenContent}>
			<TrainingTabShell selectedTab="progress" navigation={navigation} />
			<ScrollView
				style={styles.screen}
				contentContainerStyle={styles.container}
				refreshControl={
					<RefreshControl
						refreshing={
							(hasAuthenticatedSession &&
								content.needsResultQuery &&
								results.isRefetching) ||
							(hasAuthenticatedSession &&
								content.needsRMQuery &&
								prs.isRefetching) ||
							(readinessQueryEnabled &&
								readinessQuery.isRefetching)
						}
						onRefresh={refresh}
						tintColor={trainingTheme.colors.primary}
					/>
				}
			>
				<Text style={styles.title}>My Progress</Text>
				<Text style={styles.subtitle}>
					A simple view of your training consistency and output.
				</Text>
				<View style={styles.rangeRow}>
					{RANGES.map(item => (
						<TouchableOpacity
							key={item.key}
							accessibilityRole="button"
							accessibilityState={{
								selected: range === item.key,
							}}
							onPress={() => setRange(item.key)}
							style={[
								styles.rangeButton,
								range === item.key && styles.rangeSelected,
							]}
						>
							<Text
								style={[
									styles.rangeLabel,
									range === item.key &&
										styles.rangeLabelSelected,
								]}
							>
								{item.label}
							</Text>
						</TouchableOpacity>
					))}
				</View>
				{readinessResult && (
					<ProgressReadinessHistory result={readinessResult} />
				)}
				{loading ? (
					<>
						<SkeletonCard />
						<SkeletonCard />
					</>
				) : hasError ? (
					<TrainingState
						kind="error"
						title="Progress couldn't load"
						message="Check your connection and try again."
						actionLabel="Try again"
						onAction={refresh}
					/>
				) : (
					<>
						{content.showKpis && (
							<View style={styles.kpiGrid}>
								<View style={styles.kpi}>
									<Text style={styles.kpiValue}>
										{totals.workouts}
									</Text>
									<Text style={styles.kpiLabel}>
										Workouts
									</Text>
								</View>
								<View style={styles.kpi}>
									<Text style={styles.kpiValue}>
										{totals.minutes === null
											? 'Not available'
											: totals.minutes.toLocaleString()}
									</Text>
									<Text style={styles.kpiLabel}>Minutes</Text>
								</View>
								<View style={styles.kpi}>
									<Text style={styles.kpiValue}>
										{totals.volume === null
											? 'Not available'
											: totals.volume.toLocaleString()}
									</Text>
									<Text style={styles.kpiLabel}>
										Kg volume
									</Text>
								</View>
								<View style={styles.kpi}>
									<Text style={styles.kpiValue}>
										{totals.prs}
									</Text>
									<Text style={styles.kpiLabel}>
										RM records
									</Text>
								</View>
							</View>
						)}
						{content.links.length > 0 && (
							<>
								<Text style={styles.sectionTitle}>Explore</Text>
								<View style={styles.linkCard}>
									{content.links.map(item => (
										<TouchableOpacity
											key={item.route}
											accessibilityRole="button"
											style={styles.linkRow}
											onPress={() =>
												navigation.navigate(item.route)
											}
										>
											<Ionicons
												name={item.icon}
												size={21}
												color={
													trainingTheme.colors.primary
												}
											/>
											<View style={styles.linkCopy}>
												<Text style={styles.linkLabel}>
													{item.label}
												</Text>
												<Text style={styles.linkDetail}>
													{item.detail}
												</Text>
											</View>
											<Ionicons
												name="chevron-right"
												size={20}
												color={
													trainingTheme.colors
														.textMuted
												}
											/>
										</TouchableOpacity>
									))}
								</View>
							</>
						)}
						{content.showRecentActivity && (
							<>
								<Text style={styles.sectionTitle}>
									Recent activity
								</Text>
								{(results.data?.length ?? 0) === 0 ? (
									<TrainingState
										kind="empty"
										title="No activity in this period"
										message="Choose a longer time range or complete your next workout."
									/>
								) : (
									results.data
										?.slice(0, 5)
										.map((item: ProgressResult) => (
											<TouchableOpacity
												key={item.id}
												style={styles.activity}
												accessibilityRole="button"
												accessibilityLabel={
													progressActivityCopy(item)
														.accessibilityLabel
												}
												onPress={() =>
													navigation.navigate(
														'TrainingResultDetail',
														{
															workoutResultId:
																item.id,
														},
													)
												}
											>
												<View
													style={styles.activityDot}
												/>
												<View style={styles.linkCopy}>
													<Text
														style={styles.linkLabel}
													>
														{
															progressActivityCopy(
																item,
															).name
														}
													</Text>
													<Text
														style={
															styles.linkDetail
														}
													>
														{
															progressActivityCopy(
																item,
															).detail
														}
													</Text>
												</View>
												<Ionicons
													name="chevron-right"
													size={20}
													color={
														trainingTheme.colors
															.textMuted
													}
												/>
											</TouchableOpacity>
										))
								)}
							</>
						)}
					</>
				)}
			</ScrollView>
		</MemberScreen>
	);
};

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	screenContent: { paddingHorizontal: 0 },
	container: { padding: 16, paddingBottom: 48, gap: 14 },
	title: {
		color: trainingTheme.colors.text,
		fontSize: 26,
		fontWeight: '700',
	},
	subtitle: {
		color: trainingTheme.colors.textMuted,
		fontSize: 14,
		marginTop: -9,
	},
	readinessCard: {
		padding: 14,
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		gap: 8,
	},
	readinessHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	readinessIcon: {
		width: 42,
		height: 42,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	readinessCopy: { flex: 1 },
	readinessTitle: {
		color: trainingTheme.colors.text,
		fontSize: 16,
		fontWeight: '700',
	},
	readinessSubtitle: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 2,
	},
	readinessDetail: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 18,
	},
	readinessStats: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	readinessMeta: {
		color: trainingTheme.colors.textMuted,
		fontSize: 11,
		lineHeight: 16,
	},
	historyRows: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: trainingTheme.colors.border,
		paddingTop: 6,
		gap: 4,
	},
	historyRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 8,
	},
	historyDate: {
		color: trainingTheme.colors.textMuted,
		fontSize: 11,
	},
	historyScore: {
		color: trainingTheme.colors.text,
		fontSize: 11,
		fontWeight: '600',
	},
	nativeMetricsCard: {
		marginTop: 4,
		paddingTop: 8,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: trainingTheme.colors.border,
		gap: 4,
	},
	nativeMetricsTitle: {
		color: trainingTheme.colors.text,
		fontSize: 12,
		fontWeight: '700',
	},
	nativeMetricRow: { gap: 2 },
	nativeMetricProvider: {
		color: trainingTheme.colors.text,
		fontSize: 11,
		fontWeight: '600',
	},
	nativeMetricsText: {
		color: trainingTheme.colors.textMuted,
		fontSize: 11,
		lineHeight: 16,
	},
	rangeRow: {
		flexDirection: 'row',
		padding: 4,
		borderRadius: 12,
		backgroundColor: trainingTheme.colors.surfaceMuted,
	},
	rangeButton: {
		flex: 1,
		minHeight: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 9,
	},
	rangeSelected: { backgroundColor: trainingTheme.colors.surface },
	rangeLabel: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		fontWeight: '600',
	},
	rangeLabelSelected: { color: trainingTheme.colors.primary },
	kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
	kpi: {
		width: '48%',
		minHeight: 92,
		justifyContent: 'center',
		padding: 14,
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	kpiValue: {
		color: trainingTheme.colors.text,
		fontSize: 23,
		fontWeight: '700',
	},
	kpiLabel: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 4,
	},
	sectionTitle: {
		color: trainingTheme.colors.text,
		fontSize: 17,
		fontWeight: '700',
		marginTop: 4,
	},
	linkCard: {
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		overflow: 'hidden',
	},
	linkRow: {
		minHeight: 65,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: trainingTheme.colors.border,
	},
	linkCopy: { flex: 1 },
	linkLabel: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '600',
	},
	linkDetail: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 3,
	},
	activity: {
		minHeight: 64,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 14,
		borderRadius: 14,
		backgroundColor: trainingTheme.colors.surface,
	},
	activityDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: trainingTheme.colors.success,
	},
});
export default Progress;
