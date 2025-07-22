import { Button, Row, Text } from '@/components/atoms';
import { FlatList } from '@/components/molecules';
import { updateAttendance } from '@/services/leaderboards';
import { attendSession } from '@/services/session';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ApplicationStackParamList } from '@/types/navigation';
import {
	NotBookedMemberSchemaType,
	SessionDetailSchemaType,
	SessionMemberAttendanceSchemaType,
} from '@/types/schemas/session';
import { Say } from '@/utils';
import useStore from '@/zustand/Store';
import {
	NavigationProp,
	useFocusEffect,
	useNavigation,
} from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { isNil, sortBy } from 'lodash';
import moment from 'moment';
import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import SimpleToast from 'react-native-simple-toast';
import AttendanceItem from './components/AttendanceItem';

const { metrics } = config;

interface SessionAttendanceTabProps {
	session: SessionDetailSchemaType;
}
const SessionAttendanceTab = ({ session }: SessionAttendanceTabProps) => {
	const navigation =
		useNavigation<NavigationProp<ApplicationStackParamList>>();
	const loggedInUser = useStore(state => state.loggedInUser);
	const bookButtonCallback = useStore(state => state.bookButtonCallback);
	const isStaff = loggedInUser?.user_data.is_staff;
	const attendanceLimit = session?.attendance_limit;

	const [processingMembers, setProcessingMembers] = useState<number[]>([]);
	const [bookedMembers, setBookedMembers] = useState<
		SessionMemberAttendanceSchemaType[]
	>(session.member_attendance);
	const queryClient = useQueryClient();
	const [notBookedMembers, setNotBookedMembers] = useState<
		NotBookedMemberSchemaType[]
	>(session?.not_book_members ?? []);
	const toggleAttendanceModal = () =>
		navigation.navigate('AddAttendance', { session });

	useFocusEffect(
		useCallback(() => {
			setBookedMembers(session.member_attendance);
			bookedMembersRef.current = session.member_attendance;
		}, [session]),
	);

	const bookedMembersRef = useRef(session.member_attendance);

	const addProcessingMember = (userId: number) => {
		setProcessingMembers([...processingMembers, userId]);
	};

	const removeProcessingMember = (userId: number) => {
		setProcessingMembers(processingMembers.filter(id => id !== userId));
	};

	const handleToggleUserAttendance = async (
		userId: number,
		override = false,
	) => {
		const isAttend = !bookedMembersRef.current.some(
			member => member.user_id === userId,
		);

		// check if user is already in processingMembers
		if (processingMembers.length > 0) {
			Say.warn('Please wait while we are processing your request');
			return;
		}

		// check if session is already full
		if (
			bookedMembersRef.current.length >= (attendanceLimit as number) &&
			attendanceLimit !== null &&
			isAttend
		) {
			Say.err('Session is already full');
			return;
		}

		// add user to processingMembers
		addProcessingMember(userId);

		if (userId === loggedInUser?.id) {
			try {
				bookButtonCallback();
			} catch (e) {
				Say.err(e as string);
			} finally {
				removeProcessingMember(userId);
			}
		} else {
			// Prepare payload
			const payload = {
				event_id: session?.id,
				is_attend: isAttend,
				user_id: userId,
				admin_override: override,
			};

			await attendSession(payload)
				.then(response => {
					if (!response.error) {
						// if booking success
						let newNotBookedMembers = [];
						let newBookedMembers = [];

						if (isAttend) {
							newNotBookedMembers = notBookedMembers.filter(
								member => member.user_id !== userId,
							);

							// New booked members
							const addMember = notBookedMembers.find(
								member => member.user_id === userId,
							) as SessionMemberAttendanceSchemaType;
							newBookedMembers = [
								...bookedMembersRef.current,
								addMember,
							];
						} else {
							newBookedMembers = bookedMembersRef.current.filter(
								member => member.user_id !== userId,
							);

							// New not booked members
							const addMember = bookedMembersRef.current.find(
								member => member.user_id === userId,
							) as NotBookedMemberSchemaType;
							newNotBookedMembers = [
								...notBookedMembers,
								addMember,
							];
						}

						setNotBookedMembers(newNotBookedMembers);
						setBookedMembers(newBookedMembers);

						// Show success message
						SimpleToast.show(
							`Successfully ${
								isAttend ? 'checked-in' : 'removed'
							} user`,
							SimpleToast.SHORT,
						);

						// Invalidate the session query
						void queryClient.invalidateQueries({
							queryKey: ['sessionGetScheduleDetail'],
						});
					} else if (response.allow_override) {
						Alert.alert(
							'Error!',
							`Reason: ${String(
								response.message,
							)}\n\nAs an admin you can override and force check-in. Would you like to continue?`,
							[
								{
									text: 'Yes',
									onPress: () => {
										void handleToggleUserAttendance(
											userId,
											true,
										);
									},
								},
								{ text: 'Cancel', style: 'cancel' },
							],
							{ cancelable: true },
						);
					} else {
						throw new Error(response.message);
					}
				})
				.catch(error => {
					// Show error message
					SimpleToast.show(
						`Failed to book user: ${String(error)}`,
						SimpleToast.SHORT,
					);
				})
				.finally(() => {
					removeProcessingMember(userId);
				});
		}
	};

	const handleCheckInUser = async (userId: number) => {
		// 	// check if user is already in processingMembers
		if (processingMembers.length > 0) {
			Say.warn('Please wait while we are processing your request');
		}

		addProcessingMember(userId);

		const findUser = bookedMembersRef.current?.find(
			member => member.user_id === userId,
		);

		const userStatus =
			findUser?.attendance?.status === 'checked-in' ||
			isNil(findUser?.attendance?.status)
				? 'booked'
				: 'checked-in';

		// Prepare payload
		const payload = {
			user_id: userId,
			event_id: session.id,
			status: userStatus,
		};

		const res = await updateAttendance(payload);
		if (!res.error) {
			// if check in success

			// find member in bookedMembers and update status
			const newBookedMembers = bookedMembersRef.current?.map(
				(member: SessionMemberAttendanceSchemaType) => {
					const newMember = member;
					if (member.user_id === userId) {
						// update status
						newMember.attendance = {
							...member.attendance,
							status: userStatus,
						};
					}
					return member;
				},
			);

			// set state
			setBookedMembers(newBookedMembers);
			bookedMembersRef.current = newBookedMembers;

			const userCheckedIn = userStatus === 'checked-in';
			SimpleToast.show(
				userCheckedIn
					? 'Successfully checked in user'
					: 'Moved user to "booked"',
				SimpleToast.SHORT,
			);
		} else {
			// Show error message
			SimpleToast.show(
				`Failed to check in user: ${String(res?.message)}`,
				SimpleToast.SHORT,
			);
		}

		// remove user from processingMembers
		removeProcessingMember(userId);
	};

	// Determine if the add button should be shown
	const showAddButton =
		(bookedMembers?.length < (attendanceLimit as number) ||
			attendanceLimit === null) &&
		isStaff;

	const renderItem = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		({ item }: any) => {
			const {
				user,
				user_id: userId,
				attendance,
			} = item as SessionMemberAttendanceSchemaType;

			const infoFlags = [];

			const isBirthday =
				moment(user.dob).format('MM-DD') ===
				moment(session.start_datetime).format('MM-DD');

			if (isBirthday) {
				infoFlags.push({
					name: 'birthday',
					icon: '',
					color: '',
				});
			}

			if (user.hasInjury) {
				infoFlags.push({
					name: 'injury',
					icon: '',
					color: '',
				});
			}
			if (user.hasHealth) {
				infoFlags.push({
					name: 'health',
					icon: 'hospital-box',
					color: config.colors.danger,
				});
			}
			if (user.hasFailedInvoices) {
				infoFlags.push({
					name: 'payment',
					icon: '',
					color: '',
				});
			}

			return (
				<AttendanceItem
					id={userId}
					avatar={user.profile_image}
					name={`${user.firstname} ${user.lastname}`}
					isStaff={isStaff as boolean}
					status={attendance.status}
					handleCheckInUser={handleCheckInUser}
					handleToggleUserAttendance={handleToggleUserAttendance}
					loading={processingMembers.includes(userId)}
					infoFlags={infoFlags}
					isBirthday={isBirthday}
				/>
			);
		},
		[processingMembers],
	);

	const StickyHeaderComponent = (
		<View>
			{attendanceLimit !== null && (
				<Text style={styles.slots}>
					{`${bookedMembersRef.current.length} / ${attendanceLimit}`}
				</Text>
			)}
			<Row style={{ marginHorizontal: metrics.md }}>
				{showAddButton && (
					<Button
						variant="darkgray"
						mode="outlined"
						title="Past Performance"
						onPress={() =>
							navigation.navigate('AttendancePastPerformance', {
								session,
							})
						}
						style={{
							marginBottom: metrics.md,
							...layout.flex_1,
							marginRight: metrics.sm,
							// marginHorizontal: metrics.lg,
						}}
						sm
					/>
				)}
				{showAddButton && (
					<Button
						variant="darkgray"
						mode="outlined"
						title="+ Add Attendance"
						onPress={toggleAttendanceModal}
						style={{
							marginBottom: metrics.md,
							...layout.flex_1,
							marginLeft: metrics.sm,
							// marginHorizontal: metrics.lg,
						}}
						sm
					/>
				)}
			</Row>
		</View>
	);

	// Extract the key for each item
	const keyExtractor = (item: SessionMemberAttendanceSchemaType) =>
		item.user_id.toString();

	return (
		<FlatList
			data={sortBy(bookedMembersRef.current, item =>
				item.user.firstname.toLowerCase(),
			)}
			renderItem={renderItem}
			extractor={keyExtractor}
			ListHeaderComponent={StickyHeaderComponent}
		/>
	);
};

const styles = StyleSheet.create({
	slots: {
		textAlign: 'right',
		marginRight: config.metrics.lg,
		marginBottom: config.metrics.md,
	},
});

export default SessionAttendanceTab;
