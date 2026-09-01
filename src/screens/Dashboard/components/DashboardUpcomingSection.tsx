import { Text } from '@/components/atoms';
import { memberTheme } from '@/theme/member';
import { View } from 'react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import BookedSessionCard, { BookedSessionCardProps } from './BookedSessionCard';

interface DashboardUpcomingSectionProps {
	sessions: readonly BookedSessionCardProps[];
	onViewAll?: () => void;
}

const DashboardUpcomingSection = ({
	sessions,
	onViewAll,
}: DashboardUpcomingSectionProps) => {
	if (sessions.length === 0) return null;

	const [firstSession] = sessions;
	if (!firstSession) return null;
	const canViewAll = sessions.length > 1 && Boolean(onViewAll);

	return (
		<View testID="dashboard-upcoming-section" style={styles.section}>
			<View style={styles.headingRow}>
				<View style={styles.headingCopy}>
					<View style={styles.headingIcon}>
						<Icon
							name="calendar-month"
							size={18}
							color={memberTheme.colors.primary}
						/>
					</View>
					<Text bold style={styles.headingText}>
						{`UPCOMING CLASS (${sessions.length})`}
					</Text>
				</View>
				<Icon
					name="chevron-right"
					size={24}
					color={memberTheme.colors.primary}
				/>
			</View>

			<BookedSessionCard {...firstSession} compact />

			{canViewAll ? (
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityLabel="View all upcoming classes"
					onPress={onViewAll}
					style={styles.viewAll}
				>
					<Text bold style={styles.viewAllText}>
						View all
					</Text>
					<Icon
						name="chevron-right"
						size={20}
						color={memberTheme.colors.primary}
					/>
				</TouchableOpacity>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	section: {
		marginTop: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.lg,
		borderWidth: 1,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surface,
		padding: memberTheme.spacing.md,
		...memberTheme.shadow,
	},
	headingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: memberTheme.spacing.sm,
	},
	headingCopy: {
		flexDirection: 'row',
		alignItems: 'center',
		minWidth: 0,
		flex: 1,
	},
	headingIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		marginRight: memberTheme.spacing.sm,
	},
	headingText: {
		color: memberTheme.colors.primary,
		fontSize: 13,
		flexShrink: 1,
	},
	viewAll: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		marginTop: memberTheme.spacing.sm,
		paddingHorizontal: memberTheme.spacing.xs,
	},
	viewAllText: {
		color: memberTheme.colors.primary,
	},
});

export default DashboardUpcomingSection;
