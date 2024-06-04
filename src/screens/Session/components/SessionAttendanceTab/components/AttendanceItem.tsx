import { Avatar, Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import useStore from '@/zustand/Store';
import { StyleSheet, View } from 'react-native';

const { metrics, fonts } = config;

interface AttendanceItemProps {
	id: number;
	avatar: string;
	name: string;
}

const AttendanceItem = ({ id, avatar, name }: AttendanceItemProps) => {
	const loggedInUser = useStore(state => state.loggedInUser);

	// // Check if member is checked in
	// const checkedIn =
	// 	member.attendance?.status === 'checked-in' ||
	// 	isNil(member.attendance?.status); // is nil for added members
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

			{/* 
			TODO: For adding in attendance staff
			<View style={styles.actionButtonContainer}>
				{isStaff ? ( // show check in button only for staff
					loading ? (
						<Loader />
					) : (
						<Row>
							<MIcon
								size={Metrics.icon.rg}
								onPress={() =>
									this.handleCheckInUser(member.user_id)
								}
								name="account-check"
								color={
									checkedIn
										? Colors.oceanGreen
										: Colors.darkgray
								}
							/>
							<Spacer sm h />
							<MIcon
								size={Metrics.icon.rg}
								onPress={() =>
									this.handleToggleUserAttendance(
										member.user_id,
									)
								}
								name="account-off"
								color={Colors.darkgray}
							/>
						</Row>
					)
				) : null}
			</View> */}
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
		height: fonts.metrics.rg,
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
