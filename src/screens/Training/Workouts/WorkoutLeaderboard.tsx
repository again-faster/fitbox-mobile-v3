import type {
	LeaderboardEntry,
	ScalingLevel,
} from '@/services/workoutStudio/types';
import { trainingTheme } from '@/theme/training';
import { useState } from 'react';
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

type FilterMode = 'all' | 'rx';

type Props = {
	entries: LeaderboardEntry[];
	isLoading: boolean;
	isError?: boolean;
	onRetry?: () => void;
	currentAthleteId?: string;
};

const CHIP_LABELS: Record<string, string> = {
	rx: 'Rx',
	scaled: 'Scaled',
	foundations: 'Foundations',
};

const PODIUM_COLORS = [
	{ background: '#FFF4DA', foreground: '#A86C00' },
	{ background: '#EFF0F5', foreground: '#686A76' },
	{ background: '#FFF0E8', foreground: '#B85A2E' },
] as const;

const scalingChip = (level: ScalingLevel | null) => {
	if (!level) return 'No level';
	return CHIP_LABELS[level] ?? level;
};

const WorkoutLeaderboard = ({
	entries,
	isLoading,
	isError = false,
	onRetry,
	currentAthleteId,
}: Props) => {
	const [filter, setFilter] = useState<FilterMode>('all');

	if (isLoading) {
		return (
			<View style={styles.stateContainer}>
				<View style={styles.stateIcon}>
					<ActivityIndicator
						size="large"
						color={trainingTheme.colors.primary}
					/>
				</View>
				<Text style={styles.stateTitle}>Loading the leaderboard</Text>
			</View>
		);
	}

	if (isError) {
		return (
			<View style={styles.stateContainer}>
				<View style={styles.stateIcon}>
					<Ionicons
						name="alert-circle-outline"
						size={36}
						color={trainingTheme.colors.primary}
					/>
				</View>
				<Text style={styles.stateTitle}>
					Leaderboard couldn&apos;t load
				</Text>
				<Text style={styles.stateBody}>
					Check your connection and try again.
				</Text>
				{onRetry && (
					<TouchableOpacity
						accessibilityRole="button"
						style={styles.retryButton}
						onPress={onRetry}
					>
						<Text style={styles.retryText}>Try again</Text>
					</TouchableOpacity>
				)}
			</View>
		);
	}

	const visibleEntries =
		filter === 'rx'
			? entries.filter(entry => entry.scalingLevel === 'rx')
			: entries;
	const currentEntry = entries.find(
		entry => entry.athleteId === currentAthleteId,
	);
	const currentRank = currentEntry
		? entries.findIndex(entry => entry.athleteId === currentAthleteId) + 1
		: null;

	return (
		<View style={styles.container}>
			{currentEntry && currentRank && (
				<View style={styles.yourPositionCard}>
					<View style={styles.yourPositionIcon}>
						<Ionicons
							name="account-star-outline"
							size={25}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<View style={styles.yourPositionCopy}>
						<Text style={styles.yourPositionEyebrow}>
							YOUR POSITION
						</Text>
						<Text style={styles.yourPositionTitle}>
							#{currentRank} overall
						</Text>
					</View>
					<View style={styles.yourScore}>
						<Text style={styles.yourScoreValue}>
							{currentEntry.scoreDisplay}
						</Text>
						<Text style={styles.yourScoreLabel}>Your score</Text>
					</View>
				</View>
			)}

			<View style={styles.filterContainer}>
				{(['all', 'rx'] as const).map(option => {
					const selected = filter === option;
					return (
						<TouchableOpacity
							key={option}
							accessibilityRole="radio"
							accessibilityState={{ selected }}
							style={[
								styles.filterButton,
								selected && styles.filterButtonSelected,
							]}
							onPress={() => setFilter(option)}
						>
							<Text
								style={[
									styles.filterText,
									selected && styles.filterTextSelected,
								]}
							>
								{option === 'all'
									? `All · ${entries.length}`
									: 'Rx only'}
							</Text>
						</TouchableOpacity>
					);
				})}
			</View>

			{visibleEntries.length === 0 ? (
				<View style={styles.emptyContainer}>
					<View style={styles.stateIcon}>
						<Ionicons
							name="trophy-outline"
							size={36}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<Text style={styles.stateTitle}>No results yet</Text>
					<Text style={styles.stateBody}>
						Be the first to log a score in this division.
					</Text>
				</View>
			) : (
				<View style={styles.resultsCard}>
					{visibleEntries.map((entry, index) => {
						const isCurrent = entry.athleteId === currentAthleteId;
						const podium = PODIUM_COLORS[index];
						return (
							<View
								key={entry.athleteId}
								accessibilityLabel={`Rank ${index + 1}, ${entry.displayName}, score ${entry.scoreDisplay}, ${scalingChip(entry.scalingLevel)}${isCurrent ? ', you' : ''}`}
								style={[
									styles.resultRow,
									index < visibleEntries.length - 1 &&
										styles.resultDivider,
									isCurrent && styles.resultRowCurrent,
								]}
							>
								<View
									style={[
										styles.rankBadge,
										podium && {
											backgroundColor: podium.background,
										},
									]}
								>
									{index === 0 ? (
										<Ionicons
											name="trophy"
											size={20}
											color={podium?.foreground}
										/>
									) : (
										<Text
											style={[
												styles.rankText,
												podium && {
													color: podium.foreground,
												},
											]}
										>
											{index + 1}
										</Text>
									)}
								</View>
								<View style={styles.athleteCopy}>
									<View style={styles.athleteNameRow}>
										<Text style={styles.athleteName}>
											{entry.displayName}
										</Text>
										{isCurrent && (
											<Text style={styles.youChip}>
												YOU
											</Text>
										)}
									</View>
									<Text style={styles.scalingLabel}>
										{scalingChip(entry.scalingLevel)}
									</Text>
								</View>
								<Text style={styles.score}>
									{entry.scoreDisplay}
								</Text>
							</View>
						);
					})}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { paddingTop: trainingTheme.spacing.sm },
	yourPositionCard: {
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		marginBottom: trainingTheme.spacing.lg,
	},
	yourPositionIcon: {
		width: 48,
		height: 48,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
	yourPositionCopy: { flex: 1 },
	yourPositionEyebrow: {
		fontSize: 11,
		lineHeight: 15,
		fontWeight: '800',
		letterSpacing: 0.8,
		color: trainingTheme.colors.primary,
	},
	yourPositionTitle: {
		fontSize: 18,
		lineHeight: 24,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		marginTop: 2,
	},
	yourScore: { alignItems: 'flex-end' },
	yourScoreValue: {
		fontSize: 21,
		lineHeight: 27,
		fontWeight: '800',
		color: trainingTheme.colors.primary,
	},
	yourScoreLabel: {
		fontSize: 10,
		lineHeight: 14,
		color: trainingTheme.colors.textMuted,
	},
	filterContainer: {
		backgroundColor: trainingTheme.colors.surfaceMuted,
		borderRadius: trainingTheme.radius.md,
		padding: trainingTheme.spacing.xs,
		flexDirection: 'row',
		gap: trainingTheme.spacing.xs,
		marginBottom: trainingTheme.spacing.lg,
	},
	filterButton: {
		flex: 1,
		minHeight: trainingTheme.touchTarget,
		borderRadius: trainingTheme.radius.sm,
		alignItems: 'center',
		justifyContent: 'center',
	},
	filterButtonSelected: {
		backgroundColor: trainingTheme.colors.surface,
		...trainingTheme.shadow,
	},
	filterText: {
		fontSize: 14,
		fontWeight: '700',
		color: trainingTheme.colors.textMuted,
	},
	filterTextSelected: { color: trainingTheme.colors.primary },
	resultsCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		paddingHorizontal: trainingTheme.spacing.lg,
		...trainingTheme.shadow,
	},
	resultRow: {
		minHeight: 78,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		paddingVertical: trainingTheme.spacing.md,
	},
	resultDivider: {
		borderBottomWidth: 1,
		borderBottomColor: trainingTheme.colors.border,
	},
	resultRowCurrent: {
		backgroundColor: trainingTheme.colors.primarySoft,
		marginHorizontal: -trainingTheme.spacing.sm,
		paddingHorizontal: trainingTheme.spacing.sm,
		borderRadius: trainingTheme.radius.md,
		borderBottomWidth: 0,
	},
	rankBadge: {
		width: 44,
		height: 44,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surfaceMuted,
		alignItems: 'center',
		justifyContent: 'center',
	},
	rankText: {
		fontSize: 15,
		fontWeight: '800',
		color: trainingTheme.colors.textMuted,
	},
	athleteCopy: { flex: 1 },
	athleteNameRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.sm,
	},
	athleteName: {
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	youChip: {
		fontSize: 9,
		lineHeight: 16,
		fontWeight: '800',
		color: trainingTheme.colors.primary,
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.pill,
		paddingHorizontal: trainingTheme.spacing.sm,
	},
	scalingLabel: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	score: {
		fontSize: 18,
		lineHeight: 24,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	stateContainer: {
		paddingVertical: 48,
		alignItems: 'center',
		paddingHorizontal: trainingTheme.spacing.xl,
	},
	emptyContainer: {
		paddingVertical: 48,
		alignItems: 'center',
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		paddingHorizontal: trainingTheme.spacing.xl,
	},
	stateIcon: {
		width: 76,
		height: 76,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: trainingTheme.spacing.lg,
	},
	stateTitle: {
		fontSize: 19,
		lineHeight: 25,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		textAlign: 'center',
	},
	stateBody: {
		fontSize: 14,
		lineHeight: 20,
		color: trainingTheme.colors.textMuted,
		textAlign: 'center',
		marginTop: trainingTheme.spacing.sm,
	},
	retryButton: {
		minHeight: 48,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: trainingTheme.spacing.xl,
		marginTop: trainingTheme.spacing.xl,
	},
	retryText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
});

export default WorkoutLeaderboard;
