import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/theme';
import useStore from '@/zustand/Store';
import getAttendanceGraph from '@/services/leaderboards/getAttendanceGraph';
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
	const { colors } = useTheme();
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
		<View style={styles.card}>
			{/* Streak section */}
			<View style={styles.streakSection}>
				{streak > 0 ? (
					<>
						<Text
							style={styles.streakHeadline}
							accessibilityLabel={`${streak}-month streak`}
						>
							🔥 {streak}-month streak
						</Text>
						<Text style={styles.streakSub}>
							Active for {streak} consecutive{' '}
							{streak === 1 ? 'month' : 'months'}
						</Text>
					</>
				) : (
					<Text style={styles.noStreakText}>
						📅 Start your streak this month
					</Text>
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
								backgroundColor: colors.brand,
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
		backgroundColor: '#FFFFFF',
		borderRadius: 16,
		padding: 16,
		marginHorizontal: 16,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
		elevation: 2,
	},
	streakSection: {
		marginBottom: 12,
	},
	streakHeadline: {
		fontSize: 18,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 4,
	},
	streakSub: {
		fontSize: 13,
		color: '#6B7280',
	},
	noStreakText: {
		fontSize: 15,
		fontWeight: '500',
		color: '#6B7280',
	},
	divider: {
		height: 1,
		backgroundColor: '#E5E7EB',
		marginBottom: 12,
	},
	goalSection: {},
	goalHeader: {
		fontSize: 14,
		fontWeight: '600',
		color: '#111827',
		marginBottom: 8,
	},
	progressTrack: {
		height: 8,
		backgroundColor: '#E5E7EB',
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
		color: '#111827',
		marginBottom: 4,
	},
	rationale: {
		fontSize: 12,
		color: '#6B7280',
		fontStyle: 'italic',
	},
});

export default ConsistencyCard;
