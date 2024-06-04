/**
 * TODO: Temporary Tab Buttons for Session Screen
 * Continue to implement this tabs
 */

import { Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { SessionTabsEnum } from '@/utils/Enum';
import { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';
import Icon1 from 'react-native-vector-icons/FontAwesome5';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const { metrics } = config;

interface SessionTabButtonsProps {
	activeTab: SessionTabsEnum;
	handleTabChange: (tab: SessionTabsEnum) => void;
}

const SessionTabButtons = ({
	activeTab,
	handleTabChange,
}: SessionTabButtonsProps) => {
	const subscribed = true;
	const isLimited = false;
	const hasLeaderboard = true;
	const allowLeaderboards = true;
	const isStaff = true;
	const attendanceView = true;
	const bookedMembers = [];
	const session = {
		attendance_limit: 10,
	};

	// const showLeaderBoardButton = (s: unknown) => {
	// 	setActiveTab(0);

	// 	console.log('showLeaderBoardButton', s);
	// };

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
					<Icon
						name="user-circle"
						size={25}
						color={
							activeTab === SessionTabsEnum.ATTENDANCE
								? '#595959'
								: '#C4C4C4'
						}
					/>

					<Row style={{ marginTop: metrics.sm }}>
						<Text color="darkgray" size="lg" bold>
							{bookedMembers.length}
						</Text>
						<Spacer size="xs" horizontal />
						<Text color="darkgray" size="lg" bold>
							/
						</Text>
						<Spacer size="xs" horizontal />
						{session.attendance_limit != null ? (
							<Text color="darkgray" size="lg" bold>
								{session.attendance_limit}
							</Text>
						) : (
							<Text color="darkgray" size="lg" bold>
								&#8734;
							</Text>
						)}
					</Row>
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
});
