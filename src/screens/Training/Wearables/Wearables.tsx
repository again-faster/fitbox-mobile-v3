import { mmkvStorage } from '@/storage';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import {
	createLoadingReadinessResult,
	getMemberReadiness,
	type ProviderId,
	type ReadinessMetric,
	type ReadinessResult,
} from '@/services/workoutStudio/readiness';
import TrainingState from '../components/TrainingState';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingWearables'>;
type ProviderProps = {
	name: string;
	description: string;
	icon: string;
	status: string;
	active?: boolean;
	available?: boolean;
	onPress?: () => void;
};

const providerNames: Record<ProviderId, string> = {
	apple_health: 'Apple Health',
	health_connect: 'Health Connect',
	whoop: 'WHOOP',
	garmin: 'Garmin',
	fitbit: 'Fitbit',
	strava: 'Strava',
};

const latestMetric = (
	metrics: ReadinessMetric[],
): ReadinessMetric | null =>
	[...metrics].sort((left, right) =>
		right.asOfDate.localeCompare(left.asOfDate),
	)[0] ?? null;

const formatMetric = (value: number | null, suffix = ''): string =>
	value === null ? 'Not available' : `${value}${suffix}`;

type ReadinessCopy = {
	status: ReadinessResult['status'];
	statusLabel: string;
	title: string;
	detail: string;
	score: string;
	band: string;
	confidence: string;
	freshness: string;
	metric: ReadinessMetric | null;
};

export const wearablesReadinessCopy = (
	result: ReadinessResult,
): ReadinessCopy => {
	if (result.status === 'loading')
		return {
			status: result.status,
			statusLabel: 'Loading',
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
			status: result.status,
			statusLabel: 'Error',
			title: 'Readiness unavailable',
			detail: result.error.message,
			score: 'Not available',
			band: 'Not available',
			confidence: 'Not available',
			freshness: 'Not available',
			metric: null,
		};

	const metric = latestMetric(result.data.metrics);
	const stateCopy = {
		ready: {
			statusLabel: 'Ready',
			title: 'Readiness is ready',
			detail: 'A provider-native readiness score is available.',
			band: 'Ready',
			confidence: 'Measured',
		},
		baseline: {
			statusLabel: 'Baseline',
			title: 'Building your baseline',
			detail:
				'More connected data is needed before a readiness score is available.',
			band: 'Baseline',
			confidence: 'Building',
		},
		empty: {
			statusLabel: 'Empty',
			title: 'No readiness data yet',
			detail: 'Connect a supported provider to add recovery context.',
			band: 'No data',
			confidence: 'Not available',
		},
	} as const;
	const copy = stateCopy[result.status];

	return {
		status: result.status,
		...copy,
		score: formatMetric(metric?.nativeReadinessScore ?? null),
		freshness: `As of ${result.asOfDate}`,
		metric,
	};
};

type WearablesReadinessSummaryProps = {
	result: ReadinessResult;
};

export const WearablesReadinessSummary = ({
	result,
}: WearablesReadinessSummaryProps) => {
	const copy = wearablesReadinessCopy(result);

	return (
		<View
			style={styles.readinessCard}
			accessibilityRole="summary"
			accessibilityLabel={`Fitbox readiness. Status ${copy.statusLabel}. ${copy.title}. Score ${copy.score}. Band ${copy.band}. Confidence ${copy.confidence}. Freshness ${copy.freshness}.`}
		>
			<View style={styles.readinessIcon}>
				<Ionicons
					name="weather-sunset-up"
					size={27}
					color={trainingTheme.colors.primary}
				/>
			</View>
			<View style={styles.providerCopy}>
				<Text style={styles.providerName}>Fitbox readiness</Text>
				<Text style={styles.providerDescription}>{copy.title}</Text>
				<Text style={styles.readinessDetail}>{copy.detail}</Text>
				<View style={styles.readinessStats}>
					<Text style={styles.readinessMeta}>Status {copy.statusLabel}</Text>
					<Text style={styles.readinessMeta}>Score {copy.score}</Text>
					<Text style={styles.readinessMeta}>Band {copy.band}</Text>
					<Text style={styles.readinessMeta}>
						Confidence {copy.confidence}
					</Text>
				</View>
				<Text style={styles.readinessMeta}>{copy.freshness}</Text>
			</View>
		</View>
	);
};

type ProviderNativeStatusProps = {
	metric: ReadinessMetric | null;
	connectionStatus: string;
};

export const ProviderNativeStatus = ({
	metric,
	connectionStatus,
}: ProviderNativeStatusProps) => {
	const metricText = metric
		? `${providerNames[metric.provider]} native metrics. Native readiness ${formatMetric(metric.nativeReadinessScore)}. Recovery ${formatMetric(metric.nativeRecoveryScore)}. Sleep ${formatMetric(metric.sleepMinutes, ' min')}. HRV ${formatMetric(metric.hrvMs, ' ms')}. Resting HR ${formatMetric(metric.restingHr, ' bpm')}. As of ${metric.asOfDate}.`
		: 'No provider-native metrics available.';

	return (
		<View
			style={styles.nativeStatusCard}
			accessibilityRole="summary"
			accessibilityLabel={`Provider-native status. ${connectionStatus}. ${metricText}`}
		>
			<View style={styles.nativeStatusHeader}>
				<Ionicons
					name="chart-timeline-variant"
					size={22}
					color={trainingTheme.colors.primary}
				/>
				<Text style={styles.nativeStatusTitle}>Provider-native status</Text>
			</View>
			<Text style={styles.nativeStatusText}>{connectionStatus}</Text>
			<Text style={styles.nativeStatusText}>{metricText}</Text>
		</View>
	);
};

const Provider = ({
	name,
	description,
	icon,
	status,
	active = false,
	available = false,
	onPress,
}: ProviderProps) => (
	<TouchableOpacity
		accessibilityRole={onPress ? 'button' : undefined}
		accessibilityLabel={`${name}. ${description}. ${status}`}
		accessibilityState={{ disabled: !onPress }}
		disabled={!onPress}
		onPress={onPress}
		activeOpacity={0.75}
		style={styles.provider}
	>
		<View
			style={[
				styles.providerIcon,
				(active || available) && styles.providerIconAvailable,
			]}
		>
			<Ionicons
				name={icon}
				size={25}
				color={
					active || available
						? trainingTheme.colors.primary
						: trainingTheme.colors.textMuted
				}
			/>
		</View>
		<View style={styles.providerCopy}>
			<Text style={styles.providerName}>{name}</Text>
			<Text style={styles.providerDescription}>{description}</Text>
		</View>
		<View
			style={[
				styles.statusPill,
				available && styles.statusAvailable,
				active && styles.statusActive,
			]}
		>
			<Text
				style={[
					styles.statusText,
					available && styles.statusTextAvailable,
					active && styles.statusTextActive,
				]}
			>
				{status}
			</Text>
		</View>
		{onPress && (
			<Ionicons
				name="chevron-right"
				size={20}
				color={trainingTheme.colors.textMuted}
			/>
		)}
	</TouchableOpacity>
);

const Wearables = ({ navigation }: Props) => {
	const { isEnabled } = useWorkoutStudio();
	const readinessFeatureEnabled = isEnabled('wearables');
	const session = getStoredWSSession();
	const readinessQuery = useQuery<ReadinessResult>({
		queryKey: [
			'ws-member-readiness-wearables',
			session?.user.id,
			session?.user.active_tenant_id,
		],
		queryFn: () =>
			getMemberReadiness({
				windowDays: 7,
				featureEnabled: readinessFeatureEnabled,
			}),
		enabled: readinessFeatureEnabled,
		staleTime: 60_000,
	});
	const readinessResult = readinessFeatureEnabled
		? (readinessQuery.data ?? createLoadingReadinessResult())
		: null;
	const appleConnected =
		Platform.OS === 'ios' &&
		mmkvStorage.getString('healthkit.authorized') === 'true';
	const lastSync = mmkvStorage.getString('healthkit.lastSyncedAt');

	if (!readinessFeatureEnabled) {
		return (
			<TrainingState
				kind="empty"
				title="Wearables unavailable"
				message="Your gym hasn't enabled wearable readiness for members."
			/>
		);
	}

	const readinessMetric = readinessResult
		? wearablesReadinessCopy(readinessResult).metric
		: null;
	const nativeConnectionStatus =
		Platform.OS === 'ios'
			? appleConnected
				? 'Apple Health connected'
				: 'Apple Health not connected'
			: 'Health Connect not connected';

	return (
		<SafeAreaView style={styles.screen} edges={['top']}>
			<View style={styles.header}>
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityLabel="Go back"
					style={styles.backButton}
					onPress={() => navigation.goBack()}
				>
					<Ionicons
						name="arrow-left"
						size={24}
						color={trainingTheme.colors.text}
					/>
				</TouchableOpacity>
				<View style={styles.headerCopy}>
					<Text style={styles.headerTitle}>Wearables</Text>
					<Text style={styles.headerSubtitle}>
						Your health data, connected.
					</Text>
				</View>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.heroCard}>
					<View style={styles.heroIcon}>
						<Ionicons
							name="watch-variant"
							size={37}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<Text style={styles.heroEyebrow}>HEALTH CONNECTIONS</Text>
					<Text style={styles.heroTitle}>
						Bring recovery into focus
					</Text>
					<Text style={styles.heroBody}>
						Connect approved health metrics and recorded sessions to
						your Fitbox training history.
					</Text>
				</View>

				<View style={styles.privacyCard}>
					<View style={styles.privacyIcon}>
						<Ionicons
							name="shield-check-outline"
							size={24}
							color={trainingTheme.colors.success}
						/>
					</View>
					<View style={styles.providerCopy}>
						<Text style={styles.privacyTitle}>
							You stay in control
						</Text>
						<Text style={styles.privacyBody}>
							Only approved categories are read. Disconnecting
							stops future syncs.
						</Text>
					</View>
				</View>

				<View style={styles.sectionHeading}>
					<Text style={styles.sectionTitle}>On this phone</Text>
					<Text style={styles.sectionHint}>
						{Platform.OS === 'ios' ? 'iPhone' : 'Android'}
					</Text>
				</View>
				{Platform.OS === 'ios' ? (
					<Provider
						name="Apple Health"
						description={
							lastSync
								? `Last synced ${moment(lastSync).fromNow()}`
								: 'Workouts, sleep, heart and activity metrics'
						}
						icon="heart-pulse"
						status={appleConnected ? 'Connected' : 'Set up'}
						active={appleConnected}
						available
						onPress={() =>
							navigation.navigate('TrainingAppleHealth')
						}
					/>
				) : (
					<Provider
						name="Health Connect"
						description="Android health connection support is planned"
						icon="heart-pulse"
						status="Coming soon"
					/>
				)}

				<View style={styles.sectionHeading}>
					<Text style={styles.sectionTitle}>Other providers</Text>
					<Text style={styles.sectionHint}>Web managed</Text>
				</View>
				<View style={styles.providerGroup}>
					<Provider
						name="WHOOP"
						description="Recovery, strain and sleep"
						icon="watch-variant"
						status="Web only"
					/>
					<View style={styles.providerDivider} />
					<Provider
						name="Fitbit"
						description="Activity, sleep and heart metrics"
						icon="watch"
						status="Web only"
					/>
				</View>
				<View style={styles.webNote}>
					<Ionicons
						name="web"
						size={20}
						color={trainingTheme.colors.primary}
					/>
					<Text style={styles.webNoteText}>
						WHOOP and Fitbit connections are currently managed in
						Workout Studio on the web.
					</Text>
				</View>

				<Text style={styles.sectionTitle}>Fitbox readiness</Text>
				{readinessResult && (
					<WearablesReadinessSummary result={readinessResult} />
				)}
				<ProviderNativeStatus
					metric={readinessMetric}
					connectionStatus={nativeConnectionStatus}
				/>
			</ScrollView>
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
	content: {
		paddingHorizontal: trainingTheme.spacing.lg,
		paddingBottom: trainingTheme.spacing.xxl,
		gap: trainingTheme.spacing.lg,
	},
	heroCard: {
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.xl,
		alignItems: 'flex-start',
	},
	heroIcon: {
		width: 68,
		height: 68,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: trainingTheme.spacing.lg,
	},
	heroEyebrow: {
		fontSize: 11,
		lineHeight: 15,
		fontWeight: '800',
		letterSpacing: 1,
		color: trainingTheme.colors.primary,
	},
	heroTitle: {
		fontSize: 26,
		lineHeight: 32,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		marginTop: trainingTheme.spacing.sm,
	},
	heroBody: {
		fontSize: 15,
		lineHeight: 22,
		color: trainingTheme.colors.textMuted,
		marginTop: trainingTheme.spacing.sm,
	},
	privacyCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.successSoft,
	},
	privacyIcon: {
		width: 46,
		height: 46,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
	privacyTitle: {
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	privacyBody: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	sectionHeading: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: trainingTheme.spacing.sm,
	},
	sectionTitle: {
		fontSize: 20,
		lineHeight: 26,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	sectionHint: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
	},
	provider: {
		minHeight: 86,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surface,
	},
	providerGroup: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		...trainingTheme.shadow,
	},
	providerDivider: {
		height: 1,
		backgroundColor: trainingTheme.colors.border,
		marginHorizontal: trainingTheme.spacing.lg,
	},
	providerIcon: {
		width: 48,
		height: 48,
		borderRadius: trainingTheme.radius.md,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.surfaceMuted,
	},
	providerIconAvailable: {
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	providerCopy: { flex: 1 },
	providerName: {
		fontSize: 16,
		lineHeight: 21,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	providerDescription: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 3,
	},
	statusPill: {
		borderRadius: trainingTheme.radius.pill,
		paddingHorizontal: trainingTheme.spacing.sm,
		paddingVertical: 6,
		backgroundColor: trainingTheme.colors.surfaceMuted,
	},
	statusAvailable: { backgroundColor: trainingTheme.colors.primarySoft },
	statusActive: { backgroundColor: trainingTheme.colors.successSoft },
	statusText: {
		fontSize: 10,
		fontWeight: '800',
		color: trainingTheme.colors.textMuted,
	},
	statusTextAvailable: { color: trainingTheme.colors.primary },
	statusTextActive: { color: trainingTheme.colors.success },
	webNote: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: trainingTheme.spacing.sm,
		paddingHorizontal: trainingTheme.spacing.sm,
	},
	webNoteText: {
		flex: 1,
		fontSize: 12,
		lineHeight: 18,
		color: trainingTheme.colors.textMuted,
	},
	readinessCard: {
		minHeight: 164,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surface,
		...trainingTheme.shadow,
	},
	readinessIcon: {
		width: 54,
		height: 54,
		borderRadius: trainingTheme.radius.md,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	readinessDetail: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 4,
	},
	readinessStats: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: trainingTheme.spacing.sm,
		marginTop: trainingTheme.spacing.sm,
	},
	readinessMeta: {
		fontSize: 11,
		lineHeight: 16,
		color: trainingTheme.colors.textMuted,
		marginTop: 3,
	},
	nativeStatusCard: {
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surfaceMuted,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		gap: trainingTheme.spacing.xs,
	},
	nativeStatusHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.sm,
		marginBottom: trainingTheme.spacing.xs,
	},
	nativeStatusTitle: {
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	nativeStatusText: {
		fontSize: 12,
		lineHeight: 18,
		color: trainingTheme.colors.textMuted,
	},
});

export default Wearables;
