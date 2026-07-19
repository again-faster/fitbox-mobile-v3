/**
 * TODO: Temporary Tab Buttons for Session Screen
 * Continue to implement this tabs
 */

import { memberTheme } from '@/theme/member';
import { Text } from '@/components/atoms';
import { SessionMemberAttendanceSchemaType } from '@/types/schemas/session';
import { SessionTabsEnum } from '@/utils/Enum';
import { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Badge } from 'react-native-paper';

import Icon from 'react-native-vector-icons/FontAwesome';
import Icon1 from 'react-native-vector-icons/FontAwesome5';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

interface SessionTabButtonsProps {
	activeTab: SessionTabsEnum;
	handleTabChange: (tab: SessionTabsEnum) => void;
	subscribed: boolean;
	isLimited: boolean;
	hasLeaderboard: boolean;
	allowLeaderboards: boolean;
	isStaff: boolean;
	attendanceView: boolean;
	bookedMembers: SessionMemberAttendanceSchemaType[];
}

const SessionTabButtons = ({
	activeTab,
	handleTabChange,
	subscribed,
	isLimited,
	hasLeaderboard,
	allowLeaderboards,
	isStaff,
	attendanceView,
	bookedMembers,
}: SessionTabButtonsProps) => {
	const tabColor = (tab: SessionTabsEnum) =>
		activeTab === tab
			? memberTheme.colors.primary
			: memberTheme.colors.textMuted;

	return (
		<View style={styles.container}>
			<TouchableOpacity
				onPress={() => handleTabChange(SessionTabsEnum.INFO)}
				style={[
					styles.tabButton,
					activeTab === SessionTabsEnum.INFO &&
						styles.tabButtonActive,
				]}
				accessibilityRole="tab"
				accessibilityState={{
					selected: activeTab === SessionTabsEnum.INFO,
				}}
			>
				<Icon
					name="info-circle"
					size={20}
					color={tabColor(SessionTabsEnum.INFO)}
				/>
				<Text
					style={[
						styles.tabLabel,
						activeTab === SessionTabsEnum.INFO &&
							styles.tabLabelActive,
					]}
				>
					Info
				</Text>
			</TouchableOpacity>

			{subscribed && !isLimited ? (
				<TouchableOpacity
					onPress={() => handleTabChange(SessionTabsEnum.SECTIONS)}
					style={[
						styles.tabButton,
						activeTab === SessionTabsEnum.SECTIONS &&
							styles.tabButtonActive,
					]}
					accessibilityRole="tab"
					accessibilityState={{
						selected: activeTab === SessionTabsEnum.SECTIONS,
					}}
				>
					<Icon1
						name="dumbbell"
						size={18}
						color={tabColor(SessionTabsEnum.SECTIONS)}
					/>
					<Text
						style={[
							styles.tabLabel,
							activeTab === SessionTabsEnum.SECTIONS &&
								styles.tabLabelActive,
						]}
					>
						Workout
					</Text>
				</TouchableOpacity>
			) : null}

			{hasLeaderboard && (allowLeaderboards || isStaff) ? (
				<TouchableOpacity
					onPress={() => handleTabChange(SessionTabsEnum.RESULTS)}
					style={[
						styles.tabButton,
						activeTab === SessionTabsEnum.RESULTS &&
							styles.tabButtonActive,
					]}
					accessibilityRole="tab"
					accessibilityState={{
						selected: activeTab === SessionTabsEnum.RESULTS,
					}}
				>
					<MIcon
						name="trophy"
						size={20}
						color={tabColor(SessionTabsEnum.RESULTS)}
					/>
					<Text
						style={[
							styles.tabLabel,
							activeTab === SessionTabsEnum.RESULTS &&
								styles.tabLabelActive,
						]}
					>
						Results
					</Text>
				</TouchableOpacity>
			) : null}

			{(attendanceView && !isLimited) || isStaff ? (
				<TouchableOpacity
					onPress={() => handleTabChange(SessionTabsEnum.ATTENDANCE)}
					style={[
						styles.tabButton,
						activeTab === SessionTabsEnum.ATTENDANCE &&
							styles.tabButtonActive,
					]}
					accessibilityRole="tab"
					accessibilityState={{
						selected: activeTab === SessionTabsEnum.ATTENDANCE,
					}}
				>
					<View>
						<Icon
							name="user-circle"
							size={20}
							color={tabColor(SessionTabsEnum.ATTENDANCE)}
						/>

						<Badge
							visible={bookedMembers.length > 0}
							style={styles.badgeStyle}
							size={18}
							allowFontScaling={false}
						>
							{bookedMembers.length}
						</Badge>
					</View>
					<Text
						style={[
							styles.tabLabel,
							activeTab === SessionTabsEnum.ATTENDANCE &&
								styles.tabLabelActive,
						]}
					>
						Members
					</Text>
				</TouchableOpacity>
			) : null}
		</View>
	);
};

export default memo(SessionTabButtons);

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		gap: memberTheme.spacing.sm,
		marginHorizontal: memberTheme.spacing.md,
		marginBottom: memberTheme.spacing.md,
		padding: memberTheme.spacing.xs,
		borderRadius: memberTheme.radius.md,
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
	},
	tabButton: {
		flex: 1,
		minHeight: 52,
		gap: 3,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: memberTheme.radius.sm,
	},
	tabButtonActive: {
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	tabLabel: {
		color: memberTheme.colors.textMuted,
		fontSize: 10,
		fontWeight: '600',
	},
	tabLabelActive: {
		color: memberTheme.colors.primary,
		fontWeight: '700',
	},
	badgeStyle: {
		position: 'absolute',
		top: -6,
		right: -8,
		backgroundColor: memberTheme.colors.primary,
	},
});
