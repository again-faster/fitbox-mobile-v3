import { Text } from '@/components/atoms';
import type { ClassSessionSummary } from '@/services/workoutStudio/classSessionSummary';
import { memberTheme } from '@/theme/member';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface TodaySessionCardProps {
	isLoading: boolean;
	summary: ClassSessionSummary | null;
}

const TodaySessionCard = ({ isLoading, summary }: TodaySessionCardProps) => {
	if (!isLoading && !summary) return null;

	return (
		<View style={styles.card}>
			<Text size="md" bold style={styles.title}>
				Today’s session
			</Text>

			{summary ? (
				<>
					<Text size="md" bold style={styles.workoutName}>
						{summary.workoutName}
					</Text>
					{summary.sections.map(section => {
						const parts = [...section.details, ...section.movements];
						if (section.remainingMovementCount > 0) {
							parts.push(`+${section.remainingMovementCount} more`);
						}

						return (
							<View key={section.id} style={styles.section}>
								<Text size="rg" bold style={styles.sectionName}>
									{section.name}
								</Text>
								<Text size="rg" style={styles.sectionSummary}>
									{parts.join(' · ')}
								</Text>
							</View>
						);
					})}
				</>
			) : (
				<View style={styles.loadingRow}>
					<ActivityIndicator
						size="small"
						color={memberTheme.colors.primary}
					/>
					<Text size="rg" style={styles.loadingText}>
						Loading session…
					</Text>
				</View>
			)}
		</View>
	);
};

export default TodaySessionCard;

const styles = StyleSheet.create({
	card: {
		marginBottom: memberTheme.spacing.md,
		padding: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.md,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surface,
		...memberTheme.shadow,
	},
	title: {
		color: memberTheme.colors.primary,
		fontSize: 15,
		marginBottom: memberTheme.spacing.sm,
	},
	workoutName: {
		color: memberTheme.colors.text,
		lineHeight: 22,
	},
	section: {
		marginTop: memberTheme.spacing.sm,
	},
	sectionName: {
		color: memberTheme.colors.primaryInk,
		lineHeight: 21,
	},
	sectionSummary: {
		color: memberTheme.colors.textMuted,
		lineHeight: 21,
	},
	loadingRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	loadingText: {
		marginLeft: memberTheme.spacing.sm,
		color: memberTheme.colors.textMuted,
		lineHeight: 21,
	},
});
