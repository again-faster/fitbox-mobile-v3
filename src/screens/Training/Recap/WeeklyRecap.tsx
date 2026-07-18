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
import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { TrainingStackParamList } from '@/types/navigation';
import { trainingTheme } from '@/theme/training';
import SkeletonCard from '../components/SkeletonCard';
import TrainingState from '../components/TrainingState';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingWeeklyRecap'>;
type Row = {
	id: string;
	completed_at: string;
	duration_seconds: number | null;
	total_volume_kg: number | null;
	workouts: { name: string };
};
type RM = { id: string; achieved_on: string };
const sum = (rows: Row[]) => ({
	workouts: rows.length,
	minutes: Math.round(
		rows.reduce((n, r) => n + (r.duration_seconds ?? 0), 0) / 60,
	),
	volume: Math.round(rows.reduce((n, r) => n + (r.total_volume_kg ?? 0), 0)),
});
const comparison = (current: number, previous: number) =>
	previous === 0
		? current > 0
			? 'New this week'
			: 'No change'
		: `${current >= previous ? '↑' : '↓'} ${Math.abs(Math.round(((current - previous) / previous) * 100))}% vs last week`;

const WeeklyRecap = ({ navigation }: Props) => {
	const uid = getStoredWSSession()?.user.id;
	const now = moment();
	const thisStart = moment().startOf('isoWeek');
	const previousStart = moment(thisStart).subtract(1, 'week');
	const previousCutoff = moment(previousStart).add(now.diff(thisStart));
	const results = useQuery({
		queryKey: [
			'ws-weekly-recap-results',
			uid,
			thisStart.format('YYYY-MM-DD'),
		],
		queryFn: () =>
			wsApi()
				.get('workout_results', {
					searchParams: {
						select: 'id,completed_at,duration_seconds,total_volume_kg,workouts(name)',
						athlete_id: `eq.${uid}`,
						completed_at: `gte.${previousStart.toISOString()}`,
						order: 'completed_at.desc',
						limit: '100',
					},
				})
				.json<Row[]>(),
		enabled: !!uid,
		staleTime: 120_000,
	});
	const rms = useQuery({
		queryKey: ['ws-weekly-recap-rms', uid, thisStart.format('YYYY-MM-DD')],
		queryFn: () =>
			wsApi()
				.get('athlete_rms', {
					searchParams: {
						select: 'id,achieved_on',
						athlete_id: `eq.${uid}`,
						achieved_on: `gte.${previousStart.format('YYYY-MM-DD')}`,
						limit: '100',
					},
				})
				.json<RM[]>(),
		enabled: !!uid,
		staleTime: 120_000,
	});
	const data = useMemo(() => {
		const current = (results.data ?? []).filter(r =>
			moment(r.completed_at).isSameOrAfter(thisStart),
		);
		const previous = (results.data ?? []).filter(r =>
			moment(r.completed_at).isBetween(
				previousStart,
				previousCutoff,
				undefined,
				'[]',
			),
		);
		return {
			current,
			currentTotals: sum(current),
			previousTotals: sum(previous),
			rmCount: (rms.data ?? []).filter(r =>
				moment(r.achieved_on).isSameOrAfter(thisStart, 'day'),
			).length,
		};
	}, [results.data, rms.data, thisStart, previousStart, previousCutoff]);
	const refresh = () => {
		void results.refetch();
		void rms.refetch();
	};
	const loading = results.isLoading || rms.isLoading;
	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
			refreshControl={
				<RefreshControl
					refreshing={results.isRefetching || rms.isRefetching}
					onRefresh={refresh}
					tintColor={trainingTheme.colors.primary}
				/>
			}
		>
			<View>
				<Text style={styles.eyebrow}>WEEKLY RECAP</Text>
				<Text style={styles.title}>
					{thisStart.format('D MMM')} – {now.format('D MMM')}
				</Text>
				<Text style={styles.subtitle}>
					Compared with the same point last week.
				</Text>
			</View>
			{loading ? (
				<>
					<SkeletonCard />
					<SkeletonCard />
				</>
			) : results.isError || rms.isError ? (
				<TrainingState
					kind="error"
					title="Your recap couldn't load"
					message="Check your connection and try again."
					actionLabel="Try again"
					onAction={refresh}
				/>
			) : (
				<>
					<View style={styles.hero}>
						<View style={styles.heroIcon}>
							<Ionicons
								name="calendar-check-outline"
								size={27}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<Text style={styles.heroValue}>
							{data.currentTotals.workouts}
						</Text>
						<Text style={styles.heroLabel}>
							workout
							{data.currentTotals.workouts === 1 ? '' : 's'}{' '}
							completed
						</Text>
						<Text style={styles.compare}>
							{comparison(
								data.currentTotals.workouts,
								data.previousTotals.workouts,
							)}
						</Text>
					</View>
					<View style={styles.grid}>
						<View style={styles.stat}>
							<Text style={styles.statValue}>
								{data.currentTotals.minutes}
							</Text>
							<Text style={styles.statLabel}>Minutes</Text>
							<Text style={styles.statCompare}>
								{comparison(
									data.currentTotals.minutes,
									data.previousTotals.minutes,
								)}
							</Text>
						</View>
						<View style={styles.stat}>
							<Text style={styles.statValue}>
								{data.currentTotals.volume.toLocaleString()}
							</Text>
							<Text style={styles.statLabel}>Kg volume</Text>
							<Text style={styles.statCompare}>
								{comparison(
									data.currentTotals.volume,
									data.previousTotals.volume,
								)}
							</Text>
						</View>
						<View style={styles.stat}>
							<Text style={styles.statValue}>{data.rmCount}</Text>
							<Text style={styles.statLabel}>RM records</Text>
							<Text style={styles.statCompare}>
								{data.rmCount > 0
									? 'Strong work'
									: 'Keep building'}
							</Text>
						</View>
					</View>
					<Text style={styles.sectionTitle}>This week</Text>
					{data.current.length === 0 ? (
						<TrainingState
							kind="empty"
							title="Your week is ready"
							message="Complete a workout and your recap will build here."
							actionLabel="View workouts"
							onAction={() =>
								navigation.navigate('TrainingWorkouts')
							}
						/>
					) : (
						data.current.map(item => (
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
								<View style={styles.check}>
									<Ionicons
										name="check"
										size={16}
										color="#FFFFFF"
									/>
								</View>
								<View style={styles.copy}>
									<Text style={styles.activityName}>
										{item.workouts.name}
									</Text>
									<Text style={styles.activityMeta}>
										{moment(item.completed_at).format(
											'dddd',
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
					<TouchableOpacity
						style={styles.progressLink}
						onPress={() => navigation.navigate('TrainingProgress')}
					>
						<Text style={styles.progressLabel}>
							View all progress
						</Text>
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
		fontSize: 38,
		fontWeight: '700',
		marginTop: 8,
	},
	heroLabel: { color: trainingTheme.colors.textMuted, fontSize: 14 },
	compare: {
		color: trainingTheme.colors.success,
		fontSize: 12,
		fontWeight: '600',
		marginTop: 7,
	},
	grid: { flexDirection: 'row', gap: 8 },
	stat: {
		flex: 1,
		minHeight: 106,
		padding: 11,
		borderRadius: 14,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	statValue: {
		color: trainingTheme.colors.text,
		fontSize: 20,
		fontWeight: '700',
	},
	statLabel: {
		color: trainingTheme.colors.textMuted,
		fontSize: 11,
		marginTop: 3,
	},
	statCompare: {
		color: trainingTheme.colors.primary,
		fontSize: 10,
		lineHeight: 14,
		marginTop: 7,
	},
	sectionTitle: {
		color: trainingTheme.colors.text,
		fontSize: 17,
		fontWeight: '700',
		marginTop: 4,
	},
	activity: {
		minHeight: 65,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 13,
		borderRadius: 14,
		backgroundColor: trainingTheme.colors.surface,
	},
	check: {
		width: 30,
		height: 30,
		borderRadius: 15,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.success,
	},
	copy: { flex: 1 },
	activityName: {
		color: trainingTheme.colors.text,
		fontSize: 14,
		fontWeight: '600',
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
