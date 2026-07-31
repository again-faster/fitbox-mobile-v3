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
import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { TrainingStackParamList } from '@/types/navigation';
import { trainingTheme } from '@/theme/training';
import SkeletonCard from '../components/SkeletonCard';
import TrainingState from '../components/TrainingState';
import { buildProgressContent } from './progressFeatures';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingProgress'>;
type Range = '30' | '90' | '365' | 'all';
type ProgressResult = {
	id: string;
	workout_id: string;
	completed_at: string;
	duration_seconds: number | null;
	total_volume_kg: number | null;
	workouts: { name: string };
};
type ProgressRM = { id: string; achieved_on: string };
const RANGES: Array<{ key: Range; label: string }> = [
	{ key: '30', label: '30D' },
	{ key: '90', label: '90D' },
	{ key: '365', label: '1Y' },
	{ key: 'all', label: 'All' },
];

const Progress = ({ navigation }: Props) => {
	const { features } = useWorkoutStudio();
	const content = useMemo(() => buildProgressContent(features), [features]);
	const uid = getStoredWSSession()?.user.id;
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
		enabled: !!uid && content.needsResultQuery,
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
		enabled: !!uid && content.needsRMQuery,
		staleTime: 120_000,
	});
	const totals = useMemo(() => {
		const rows = results.data ?? [];
		return {
			workouts: rows.length,
			minutes: Math.round(
				rows.reduce(
					(sum, item) => sum + (item.duration_seconds ?? 0),
					0,
				) / 60,
			),
			volume: Math.round(
				rows.reduce(
					(sum, item) => sum + (item.total_volume_kg ?? 0),
					0,
				),
			),
			prs: prs.data?.length ?? 0,
		};
	}, [results.data, prs.data]);
	const refresh = () => {
		if (content.needsResultQuery) void results.refetch();
		if (content.needsRMQuery) void prs.refetch();
	};
	const loading =
		(content.needsResultQuery && results.isLoading) ||
		(content.needsRMQuery && prs.isLoading);
	const hasError =
		(content.needsResultQuery && results.isError) ||
		(content.needsRMQuery && prs.isError);

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
			refreshControl={
				<RefreshControl
					refreshing={
						(content.needsResultQuery && results.isRefetching) ||
						(content.needsRMQuery && prs.isRefetching)
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
						accessibilityState={{ selected: range === item.key }}
						onPress={() => setRange(item.key)}
						style={[
							styles.rangeButton,
							range === item.key && styles.rangeSelected,
						]}
					>
						<Text
							style={[
								styles.rangeLabel,
								range === item.key && styles.rangeLabelSelected,
							]}
						>
							{item.label}
						</Text>
					</TouchableOpacity>
				))}
			</View>
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
					{content.showKpis && <View style={styles.kpiGrid}>
						<View style={styles.kpi}>
							<Text style={styles.kpiValue}>
								{totals.workouts}
							</Text>
							<Text style={styles.kpiLabel}>Workouts</Text>
						</View>
						<View style={styles.kpi}>
							<Text style={styles.kpiValue}>
								{totals.minutes.toLocaleString()}
							</Text>
							<Text style={styles.kpiLabel}>Minutes</Text>
						</View>
						<View style={styles.kpi}>
							<Text style={styles.kpiValue}>
								{totals.volume.toLocaleString()}
							</Text>
							<Text style={styles.kpiLabel}>Kg volume</Text>
						</View>
						<View style={styles.kpi}>
							<Text style={styles.kpiValue}>{totals.prs}</Text>
							<Text style={styles.kpiLabel}>RM records</Text>
						</View>
					</View>}
					{content.links.length > 0 && <>
					<Text style={styles.sectionTitle}>Explore</Text>
					<View style={styles.linkCard}>
						{content.links.map(item => (
							<TouchableOpacity
								key={item.route}
								accessibilityRole="button"
								style={styles.linkRow}
								onPress={() => navigation.navigate(item.route)}
							>
								<Ionicons
									name={item.icon}
									size={21}
									color={trainingTheme.colors.primary}
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
									color={trainingTheme.colors.textMuted}
								/>
							</TouchableOpacity>
						))}
					</View>
					</>}
					{content.showRecentActivity && <>
					<Text style={styles.sectionTitle}>Recent activity</Text>
					{(results.data?.length ?? 0) === 0 ? (
						<TrainingState
							kind="empty"
							title="No activity in this period"
							message="Choose a longer time range or complete your next workout."
						/>
					) : (
						results.data?.slice(0, 5).map(item => (
							<TouchableOpacity
								key={item.id}
								style={styles.activity}
								onPress={() =>
									navigation.navigate(
										'TrainingResultDetail',
										{ workoutResultId: item.id },
									)
								}
							>
								<View style={styles.activityDot} />
								<View style={styles.linkCopy}>
									<Text style={styles.linkLabel}>
										{item.workouts.name}
									</Text>
									<Text style={styles.linkDetail}>
										{moment(item.completed_at).format(
											'ddd, D MMM',
										)}{' '}
										{item.duration_seconds != null
											? `· ${Math.round(item.duration_seconds / 60)} min`
											: ''}
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
					</>}
				</>
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
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
