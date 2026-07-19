import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import useStore from '@/zustand/Store';
import getAttendanceGraph from '@/services/leaderboards/getAttendanceGraph';
import { trainingTheme } from '@/theme/training';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import SkeletonCard from '../../components/SkeletonCard';

const deriveTarget = (lastWeek: number): number => {
	if (lastWeek === 0) return 2;
	if (lastWeek <= 2) return 2;
	return Math.min(lastWeek, 5);
};

const deriveRationale = (lastWeek: number): string => {
	if (lastWeek === 0)
		return "Missed last week? No worries — let's reset with 2 sessions.";
	if (lastWeek === 1) return "You hit 1 last week. Let's build on that.";
	if (lastWeek === 2) return "You hit 2 last week. Let's keep that going.";
	return `You hit ${lastWeek} last week. Let's keep that up.`;
};

const computeMonthStreak = (
	monthlyData: { label: string; value: number }[],
	currentMonth: number,
): number => {
	const relevant = monthlyData.slice(0, currentMonth + 1);
	let streak = 0;
	for (let i = relevant.length - 1; i >= 0; i--) {
		if ((relevant[i]?.value ?? 0) > 0) streak += 1;
		else break;
	}
	return streak;
};

const ConsistencyCard = (): React.JSX.Element => {
	const currentYear = String(new Date().getFullYear());
	const currentMonth = new Date().getMonth();

	const graphQuery = useQuery({
		queryKey: ['attendance-graph-month', currentYear],
		queryFn: () =>
			getAttendanceGraph('month', currentYear).then(r => r.data),
	});

	const attendanceReportState = useStore(s => s.attendanceReportState);
	const { weekToDate, lastWeek } = attendanceReportState;

	const target = deriveTarget(lastWeek);
	const rationale = deriveRationale(lastWeek);
	const fillPercent = Math.min((weekToDate / target) * 100, 100);
	const streak = graphQuery.data
		? computeMonthStreak(graphQuery.data, currentMonth)
		: 0;

	if (graphQuery.isLoading) {
		return <SkeletonCard />;
	}

	return (
		<View style={styles.card} accessibilityLabel="Training consistency">
			{/* Streak section */}
			<View style={styles.streakSection}>
				{streak > 0 ? (
					<>
						<View style={styles.streakHeadlineRow}>
							<Ionicons
								name="fire"
								size={22}
								color={trainingTheme.colors.warning}
							/>
							<Text
								style={styles.streakHeadline}
								accessibilityLabel={`${streak}-month streak`}
							>
								{streak}-month streak
							</Text>
						</View>
						<Text style={styles.streakSub}>
							Active for {streak} consecutive{' '}
							{streak === 1 ? 'month' : 'months'}
						</Text>
					</>
				) : (
					<View style={styles.streakHeadlineRow}>
						<Ionicons
							name="calendar-check-outline"
							size={20}
							color={trainingTheme.colors.primary}
						/>
						<Text style={styles.noStreakText}>
							Start your streak this month
						</Text>
					</View>
				)}
			</View>

			<View style={styles.divider} />

			{/* Weekly goal section */}
			<View style={styles.goalSection}>
				<Text style={styles.goalHeader}>This week&apos;s goal</Text>
				<View style={styles.progressTrack}>
					<View
						style={[
							styles.progressFill,
							{
								width: `${fillPercent}%`,
								backgroundColor: trainingTheme.colors.primary,
							},
						]}
						accessibilityRole="progressbar"
						accessibilityValue={{
							min: 0,
							max: target,
							now: weekToDate,
						}}
					/>
				</View>
				<Text style={styles.sessionCount}>
					{weekToDate} / {target} sessions
				</Text>
				<Text style={styles.rationale}>{rationale}</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		marginHorizontal: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.md,
		...trainingTheme.shadow,
	},
	streakSection: {
		marginBottom: trainingTheme.spacing.md,
	},
	streakHeadlineRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.sm,
	},
	streakHeadline: {
		fontSize: 18,
		fontWeight: '700',
		color: trainingTheme.colors.text,
		marginBottom: 4,
	},
	streakSub: {
		fontSize: 13,
		color: trainingTheme.colors.textMuted,
		marginTop: trainingTheme.spacing.xs,
	},
	noStreakText: {
		fontSize: 15,
		fontWeight: '500',
		color: trainingTheme.colors.textMuted,
	},
	divider: {
		height: 1,
		backgroundColor: trainingTheme.colors.border,
		marginBottom: trainingTheme.spacing.md,
	},
	goalSection: {},
	goalHeader: {
		fontSize: 14,
		fontWeight: '600',
		color: trainingTheme.colors.text,
		marginBottom: 8,
	},
	progressTrack: {
		height: 8,
		backgroundColor: trainingTheme.colors.border,
		borderRadius: 4,
		overflow: 'hidden',
		marginBottom: 6,
	},
	progressFill: {
		height: 8,
		borderRadius: 4,
	},
	sessionCount: {
		fontSize: 13,
		fontWeight: '500',
		color: trainingTheme.colors.text,
		marginBottom: 4,
	},
	rationale: {
		fontSize: 12,
		color: trainingTheme.colors.textMuted,
		fontStyle: 'italic',
	},
});

export default ConsistencyCard;
