import { MemberCard, MemberText } from '@/components/member';
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
		<MemberCard style={styles.card}>
			<MemberText role="sectionTitle" style={styles.title}>
				Today’s session
			</MemberText>

			{summary ? (
				<>
					<MemberText role="sectionTitle" style={styles.workoutName}>
						{summary.workoutName}
					</MemberText>
					{summary.sections.map(section => {
						const parts = [...section.details, ...section.movements];
						if (section.remainingMovementCount > 0) {
							parts.push(`+${section.remainingMovementCount} more`);
						}

						return (
							<View key={section.id} style={styles.section}>
								<MemberText role="label" style={styles.sectionName}>
									{section.name}
								</MemberText>
								<MemberText role="body" muted style={styles.sectionSummary}>
									{parts.join(' · ')}
								</MemberText>
							</View>
						);
					})}
				</>
			) : (
				<View style={styles.loadingRow}>
					<ActivityIndicator size="small" color={memberTheme.colors.primary} />
					<MemberText role="body" muted style={styles.loadingText}>
						Loading session…
					</MemberText>
				</View>
			)}
		</MemberCard>
	);
};

export default TodaySessionCard;

const styles = StyleSheet.create({
	card: { marginBottom: memberTheme.spacing.md },
	title: {
		color: memberTheme.colors.primary,
		marginBottom: memberTheme.spacing.sm,
	},
	workoutName: { color: memberTheme.colors.text, lineHeight: 22 },
	section: { marginTop: memberTheme.spacing.sm },
	sectionName: { color: memberTheme.colors.primaryInk, lineHeight: 21 },
	sectionSummary: { lineHeight: 21 },
	loadingRow: { flexDirection: 'row', alignItems: 'center' },
	loadingText: { marginLeft: memberTheme.spacing.sm, lineHeight: 21 },
});
