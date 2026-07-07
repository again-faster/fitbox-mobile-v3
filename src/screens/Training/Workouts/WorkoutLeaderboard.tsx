import type {
	LeaderboardEntry,
	ScalingLevel,
} from '@/services/workoutStudio/types';
import { useState } from 'react';
import {
	ActivityIndicator,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

type FilterMode = 'all' | 'rx';

type Props = {
	entries: LeaderboardEntry[];
	isLoading: boolean;
	currentAthleteId?: string;
};

const CHIP_LABELS: Record<string, string> = {
	rx: 'Rx',
	scaled: 'Scaled',
	foundations: 'Foundations',
};

function scalingChip(level: ScalingLevel | null): string {
	if (!level) return '—';
	return CHIP_LABELS[level] ?? level;
}

function rankBadge(index: number): string {
	if (index === 0) return '🥇';
	return `#${index + 1}`;
}

const WorkoutLeaderboard = ({
	entries,
	isLoading,
	currentAthleteId,
}: Props) => {
	const [filter, setFilter] = useState<FilterMode>('all');

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator color="#3B82F6" />
			</View>
		);
	}

	const visibleEntries =
		filter === 'rx'
			? entries.filter(e => e.scalingLevel === 'rx')
			: entries;

	return (
		<View style={styles.container}>
			<View style={styles.filterRow}>
				<TouchableOpacity
					style={[
						styles.filterBtn,
						filter === 'all' && styles.filterBtnActive,
					]}
					onPress={() => setFilter('all')}
				>
					<Text
						style={[
							styles.filterText,
							filter === 'all' && styles.filterTextActive,
						]}
					>
						All
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[
						styles.filterBtn,
						filter === 'rx' && styles.filterBtnActive,
					]}
					onPress={() => setFilter('rx')}
				>
					<Text
						style={[
							styles.filterText,
							filter === 'rx' && styles.filterTextActive,
						]}
					>
						Rx
					</Text>
				</TouchableOpacity>
			</View>

			{visibleEntries.length === 0 ? (
				<View style={styles.emptyContainer}>
					<Text style={styles.emptyText}>No results logged yet</Text>
				</View>
			) : (
				visibleEntries.map((entry, index) => {
					const isCurrent = entry.athleteId === currentAthleteId;
					return (
						<View
							key={entry.athleteId}
							style={[
								styles.row,
								isCurrent && styles.rowHighlight,
							]}
						>
							<Text style={styles.rank}>{rankBadge(index)}</Text>
							<Text
								style={[
									styles.name,
									isCurrent && styles.nameBold,
								]}
							>
								{entry.displayName}
							</Text>
							<Text style={styles.score}>
								{entry.scoreDisplay}
							</Text>
							<View style={styles.chip}>
								<Text style={styles.chipText}>
									{scalingChip(entry.scalingLevel)}
								</Text>
							</View>
						</View>
					);
				})
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	loadingContainer: {
		paddingVertical: 40,
		alignItems: 'center',
	},
	emptyContainer: {
		paddingVertical: 40,
		alignItems: 'center',
	},
	container: {
		paddingTop: 8,
	},
	filterRow: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 12,
	},
	filterBtn: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#D1D5DB',
		borderRadius: 8,
		paddingVertical: 10,
		alignItems: 'center',
	},
	filterBtnActive: {
		backgroundColor: '#3B82F6',
		borderColor: '#3B82F6',
	},
	filterText: {
		fontSize: 14,
		fontWeight: '500',
		color: '#374151',
	},
	filterTextActive: {
		color: '#FFFFFF',
	},
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#FFFFFF',
		borderRadius: 10,
		padding: 12,
		marginBottom: 8,
		borderWidth: 1,
		borderColor: '#E5E7EB',
		gap: 8,
	},
	rowHighlight: {
		backgroundColor: '#EFF6FF',
	},
	rank: {
		width: 36,
		fontSize: 14,
		fontWeight: '600',
		color: '#111827',
	},
	name: {
		flex: 1,
		fontSize: 14,
		color: '#111827',
	},
	nameBold: {
		fontWeight: '700',
	},
	score: {
		fontSize: 14,
		fontWeight: '600',
		color: '#111827',
	},
	chip: {
		backgroundColor: '#F3F4F6',
		borderRadius: 4,
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	chipText: {
		fontSize: 11,
		fontWeight: '600',
		color: '#6B7280',
	},
	emptyText: {
		fontSize: 15,
		color: '#6B7280',
	},
});

export default WorkoutLeaderboard;
