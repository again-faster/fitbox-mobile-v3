import { Avatar, Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import useStore from '@/zustand/Store';
import { isNil } from 'lodash';
import { StyleSheet, View } from 'react-native';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const { metrics, fonts } = config;

interface AttendanceItemProps {
	id: number;
	avatar: string;
	name: string;
	status: string;
	isStaff: boolean;
	handleCheckInUser: (userId: number) => Promise<void>;
	handleToggleUserAttendance: (
		userId: number,
		override?: boolean,
	) => Promise<void>;
}

const AttendanceItem = ({
	id,
	avatar,
	name,
	status,
	isStaff,
	handleCheckInUser,
	handleToggleUserAttendance,
}: AttendanceItemProps) => {
	const loggedInUser = useStore(state => state.loggedInUser);

	// Check if member is checked in
	const checkedIn = status === 'checked-in' || isNil(status); // is nil for added members
	// const loading = processingMembers.includes(member.user_id);

	return (
		<Row style={styles.container}>
			<Row style={layout.itemsCenter}>
				<View style={styles.avatarCon}>
					<Avatar
						source={avatar}
						style={styles.avatarStyle}
						size={30}
					/>
				</View>
				<Spacer horizontal size="xs" />
				<Text>{name + (id === loggedInUser?.id ? ' (You)' : '')}</Text>
			</Row>

			<View style={styles.actionButtonContainer}>
				{isStaff && (
					<Row>
						<MIcon
							size={config.metrics.lg}
							name="account-check"
							color={
								checkedIn
									? config.colors.oceanGreen
									: config.backgrounds.darkgray
							}
							onPress={() => void handleCheckInUser(id)}
						/>
						<Spacer horizontal size="sm" />
						<MIcon
							size={config.metrics.lg}
							name="account-off"
							color={config.backgrounds.darkgray}
							onPress={() => void handleToggleUserAttendance(id)}
						/>
						<Spacer horizontal size="sm" />
					</Row>
				)}
			</View>
		</Row>
	);
};

export default AttendanceItem;

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: metrics.sm,
		marginBottom: metrics.lg,
		justifyContent: 'space-between',
	},
	actionButtonContainer: {
		justifyContent: 'center',
	},
	avatarStyle: {
		borderRadius: 35,
		overflow: 'hidden',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: fonts.colors.lightgrey,
	},
	avatarCon: {
		width: 36,
		alignItems: 'center',
	},
});
