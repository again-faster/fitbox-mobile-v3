/**
 * TODO: Temporary Tab Buttons for Session Screen
 * Continue to implement this tabs
 */

import { config } from '@/theme/_config';
import layout from '@/theme/layout';
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
	return (
		<View style={styles.container}>
			<TouchableOpacity
				onPress={() => handleTabChange(SessionTabsEnum.INFO)}
				style={[layout.flex_1, layout.itemsCenter]}
			>
				<Icon
					name="info-circle"
					size={25}
					color={
						activeTab === SessionTabsEnum.INFO
							? '#595959'
							: '#C4C4C4'
					}
				/>
			</TouchableOpacity>

			{subscribed && !isLimited ? (
				<TouchableOpacity
					onPress={() => handleTabChange(SessionTabsEnum.SECTIONS)}
					style={[layout.flex_1, layout.itemsCenter]}
				>
					<Icon1
						name="dumbbell"
						size={25}
						color={
							activeTab === SessionTabsEnum.SECTIONS
								? '#595959'
								: '#C4C4C4'
						}
					/>
				</TouchableOpacity>
			) : null}

			{hasLeaderboard && (allowLeaderboards || isStaff) ? (
				<TouchableOpacity
					onPress={() => handleTabChange(SessionTabsEnum.RESULTS)}
					style={[layout.flex_1, layout.itemsCenter]}
				>
					<MIcon
						name="trophy"
						size={25}
						color={
							activeTab === SessionTabsEnum.RESULTS
								? '#595959'
								: '#C4C4C4'
						}
					/>
				</TouchableOpacity>
			) : null}

			{(attendanceView && !isLimited) || isStaff ? (
				<TouchableOpacity
					onPress={() => handleTabChange(SessionTabsEnum.ATTENDANCE)}
					style={[layout.flex_1, layout.itemsCenter]}
				>
					<View>
						<Icon
							name="user-circle"
							size={25}
							color={
								activeTab === SessionTabsEnum.ATTENDANCE
									? '#595959'
									: '#C4C4C4'
							}
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
				</TouchableOpacity>
			) : null}
		</View>
	);
};

export default memo(SessionTabButtons);

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingHorizontal: 20,
		paddingVertical: 15,
	},
	badgeStyle: {
		position: 'absolute',
		top: -6,
		right: -8,
		backgroundColor: config.colors.brand,
	},
});
