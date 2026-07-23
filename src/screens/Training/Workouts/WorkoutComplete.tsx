import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { StackScreenProps } from '@react-navigation/stack';
import type { TrainingStackParamList } from '@/types/navigation';
import { trainingTheme } from '@/theme/training';
import PrimaryButton from '@/screens/Training/components/PrimaryButton';
import TrainingCard from '@/screens/Training/components/TrainingCard';

type Props = StackScreenProps<
	TrainingStackParamList,
	'TrainingWorkoutComplete'
>;

const formatDuration = (seconds: number) => {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remaining = seconds % 60;
	if (hours > 0) return `${hours}h ${minutes}m`;
	if (minutes > 0) return `${minutes}m ${remaining}s`;
	return `${remaining}s`;
};

const WorkoutComplete = ({ route, navigation }: Props) => {
	const { workoutName, durationSeconds, completedSets } = route.params;

	return (
		<View style={styles.screen}>
			<View style={styles.hero}>
				<View style={styles.iconCircle}>
					<Ionicons name="check" size={42} color="#FFFFFF" />
				</View>
				<Text style={styles.eyebrow}>WORKOUT COMPLETE</Text>
				<Text style={styles.title}>{workoutName}</Text>
				<Text style={styles.subtitle}>
					Nice work. Your session has been saved.
				</Text>
			</View>

			<TrainingCard style={styles.summaryCard} accent="success">
				<View style={styles.metric}>
					<Text style={styles.metricValue}>
						{formatDuration(durationSeconds)}
					</Text>
					<Text style={styles.metricLabel}>Duration</Text>
				</View>
				<View style={styles.divider} />
				<View style={styles.metric}>
					<Text style={styles.metricValue}>{completedSets}</Text>
					<Text style={styles.metricLabel}>Sets logged</Text>
				</View>
			</TrainingCard>

			<View style={styles.actions}>
				<PrimaryButton
					label="View my results"
					onPress={() =>
						navigation.replace('TrainingResultDetail', {
							workoutResultId: route.params.workoutResultId,
						})
					}
				/>
				<TouchableOpacity
					accessibilityRole="button"
					style={styles.secondaryButton}
					onPress={() => navigation.replace('TrainingToday')}
				>
					<Text style={styles.secondaryLabel}>Back to Today</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: trainingTheme.colors.background,
		paddingHorizontal: trainingTheme.spacing.lg,
		paddingTop: 72,
		paddingBottom: 36,
	},
	hero: { alignItems: 'center', gap: trainingTheme.spacing.sm },
	iconCircle: {
		width: 76,
		height: 76,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.success,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: trainingTheme.spacing.md,
	},
	eyebrow: {
		color: trainingTheme.colors.success,
		fontFamily: 'Inter-Variable',
		fontSize: 12,
		fontWeight: '800',
		letterSpacing: 1.2,
	},
	title: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 27,
		fontWeight: '700',
		letterSpacing: -0.5,
		textAlign: 'center',
	},
	subtitle: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		lineHeight: 20,
		textAlign: 'center',
	},
	summaryCard: {
		marginTop: trainingTheme.spacing.xxl,
		flexDirection: 'row',
		alignItems: 'center',
	},
	metric: { flex: 1, alignItems: 'center', gap: trainingTheme.spacing.xs },
	metricValue: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 22,
		fontWeight: '700',
	},
	metricLabel: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 12,
	},
	divider: {
		width: 1,
		height: 44,
		backgroundColor: trainingTheme.colors.border,
	},
	actions: { marginTop: 'auto', gap: trainingTheme.spacing.sm },
	secondaryButton: {
		minHeight: 48,
		borderRadius: trainingTheme.radius.sm,
		alignItems: 'center',
		justifyContent: 'center',
	},
	secondaryLabel: {
		color: trainingTheme.colors.primary,
		fontFamily: 'Inter-Variable',
		fontSize: 15,
		fontWeight: '700',
	},
});

export default WorkoutComplete;
