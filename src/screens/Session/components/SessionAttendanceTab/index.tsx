import useAuth from '@/auth/hooks/useAuth';
import { Avatar, Button, Row, Spacer, Text } from '@/components/atoms';
import { FlatList } from '@/components/molecules';
import { updateAttendance } from '@/services/leaderboards';
import { getContacts } from '@/services/message';
import { attendSession } from '@/services/session';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ApplicationStackParamList } from '@/types/navigation';
import {
	ContactGroupMembersType,
	ContactGroupType,
	ContactMembersType,
} from '@/types/schemas/message';
import {
	NotBookedMemberSchemaType,
	SessionCancelledMemberSchemaType,
	SessionDetailSchemaType,
	SessionMemberAttendanceSchemaType,
	SessionSectionSchemaType,
} from '@/types/schemas/session';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import {
	NavigationProp,
	useFocusEffect,
	useNavigation,
} from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { isArray, isNil, sortBy } from 'lodash';
import moment from 'moment';
import 'moment-timezone';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import SimpleToast from 'react-native-simple-toast';
import IonicIcon from 'react-native-vector-icons/Ionicons';
import AttendanceItem from './components/AttendanceItem';

const { metrics, fonts } = config;

interface SessionAttendanceTabProps {
	session: SessionDetailSchemaType;
}

type State = {
	groups: ContactGroupType[];
	loading: boolean;
	refreshing: boolean;
	sortBy: string;
	searchQuery: string;
};
const SessionAttendanceTab = ({ session }: SessionAttendanceTabProps) => {
	const navigation =
		useNavigation<NavigationProp<ApplicationStackParamList>>();
	const loggedInUser = useStore(state => state.loggedInUser);
	const bookButtonCallback = useStore(state => state.bookButtonCallback);
	const isStaff = loggedInUser?.user_data.is_staff;
	const attendanceLimit = session?.attendance_limit;
	const { user: authUser } = useAuth();
	const timezone = authUser?.user_data.dob.timezone;

	const [state, setState] = useState<State>({
		groups: [],
		loading: true,
		refreshing: false,
		sortBy: 'player',
		searchQuery: '',
	});
	const [contactList, setContactList] = useState<ContactMembersType[]>([]);
	const [toggleCancelledList, setToggleCancelledList] =
		useState<boolean>(false);

	const { teamId } = useStore(s => ({
		teamId: s.teamId,
	}));

	const [processingMembers, setProcessingMembers] = useState<number[]>([]);
	const [bookedMembers, setBookedMembers] = useState<
		SessionMemberAttendanceSchemaType[]
	>(session.member_attendance);
	const [cancelledMembers, setCancelledMembers] = useState<
		SessionCancelledMemberSchemaType[]
	>([]);
	const queryClient = useQueryClient();
	const [notBookedMembers, setNotBookedMembers] = useState<
		NotBookedMemberSchemaType[]
	>(session?.not_book_members ?? []);
	const toggleAttendanceModal = () =>
		navigation.navigate('AddAttendance', { session });

	useFocusEffect(
		useCallback(() => {
			const latestCancelled = Object.values(
				session.cancelled_members.reduce(
					(
						acc: {
							[key: number]: SessionCancelledMemberSchemaType;
						},
						curr,
					) => {
						const existing = acc[curr.user_id];
						if (!existing) {
							// eslint-disable-next-line no-param-reassign
							acc[curr.user_id] = curr;
						} else if (
							new Date(curr.deleted_at) >
							new Date(existing.deleted_at)
						) {
							// compare deleted_at, keep the latest

							// eslint-disable-next-line no-param-reassign
							acc[curr.user_id] = curr;
						}
						return acc;
					},
					{},
				),
			);

			setBookedMembers(session.member_attendance);
			bookedMembersRef.current = session.member_attendance;
			setCancelledMembers(latestCancelled);
		}, [session]),
	);

	const prevAttendanceRef = useRef([] as SessionMemberAttendanceSchemaType[]);
	const bookedMembersRef = useRef(session.member_attendance);
	const stateRef = useRef<State>();
	const contactListRef = useRef<ContactMembersType[]>([]);
	stateRef.current = state;
	contactListRef.current = contactList;

	useEffect(() => {
		void (async () => {
			await getData();
		})();
	}, []);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () =>
				session.member_attendance.length > 0 && isStaff
					? renderCreateButton()
					: null,
		});
	}, [session.member_attendance, contactList, isStaff]);

	const renderCreateButton = () => (
		<TouchableOpacity onPress={() => saveContacts()}>
			<View
				style={{
					paddingHorizontal: config.metrics.rg,
				}}
			>
				<IonicIcon
					name="create-outline"
					size={25}
					color="white"
					style={{ paddingBottom: config.metrics.sm }}
				/>
			</View>
		</TouchableOpacity>
	);

	const getData = async (sortByRefresh?: string) => {
		setState(prevState => ({ ...prevState, refreshing: true }));
		let list: ContactMembersType[] = [];
		let groups: ContactGroupType[] = [];
		let sort = '';
		try {
			const res = await getContacts(teamId);
			groups = res.data.groups;
			list = res.data.members;
		} catch (e) {
			Say.err(e as ICatchError);
		}

		if (sort === '') {
			sort = authUser?.user_data.is_staff ? 'player' : 'staff';
		}

		setState(prevState => ({
			...prevState,
			groups,
			loading: false,
			refreshing: false,
			sortBy: sortByRefresh || sort,
		}));
		setContactList(sortBy(list, 'fullname'));
	};

	useEffect(() => {
		if (contactList.length === 0) return;

		const prev = prevAttendanceRef.current;
		const curr = session.member_attendance ?? [];

		const prevIds = prev.map(m => m.user_id).sort();
		const currIds = curr.map(m => m.user_id).sort();

		if (JSON.stringify(prevIds) === JSON.stringify(currIds)) return;

		prevAttendanceRef.current = curr;

		const updatedList = contactList.map(contact => {
			const isBooked = curr.some(member => member.user_id === contact.id);
			return { ...contact, is_selected: isBooked };
		});

		setContactList(updatedList);
	}, [contactList, session.member_attendance]);

	const saveContacts = () => {
		const contacts: ContactMembersType[] = [];
		const { groups } = stateRef.current as State;
		groups.forEach(group => {
			group.members?.forEach((c: ContactGroupMembersType) => {
				if (c.is_selected) {
					const contact = {
						...c,
						fullname: `${c.first_name} ${c.last_name}`,
					};
					contacts.push(contact);
				}
			});
		});

		contactListRef.current.forEach((c: ContactMembersType) => {
			if (c.is_selected && !contacts.includes(c)) {
				contacts.push(c);
			}
		});

		navigation.navigate('Compose', {
			contacts,
			defaultSubject: `${session.comment} - ${moment(session.start_datetime).format('MMM D, YYYY h:mm A')}`,
		});
	};

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
		({ item, index }: any) => {
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
					isLastItem={index === bookedMembersRef.current.length - 1}
				/>
			);
		},
		[processingMembers],
	);

	const sections: {
		movementId: number | null;
		name: string;
		sectionId: number | null;
		scoringTypeId: number;
		id: number | null;
	}[] = [];

	if (session?.sections && isArray(session.sections)) {
		session.sections.map((item: SessionSectionSchemaType) => {
			if (
				item.wod_movements &&
				item.wod_movements?.length > 0 &&
				item.scoring_type_id === 20 // For Load
			) {
				if (item.wod_movements && item.wod_movements.length > 0) {
					item.wod_movements.map(movement => {
						return sections.push({
							movementId: movement.id,
							name: movement.movement.name,
							sectionId: item.id,
							scoringTypeId: item.scoring_type_id as number,
							id: movement.id,
						});
					});
				} else {
					const base = {
						movementId: null,
						sectionId: item.id,
						name: item.name,
						scoringTypeId: item.scoring_type_id as number,
						id: null,
					};
					return sections.push(base);
				}
			}
			return null;
		});
	}

	const hasForLoadMovements =
		session.sections &&
		isArray(session.sections) &&
		session.sections.find(item => item.scoring_type_id === 20) &&
		session.sections.find(item => item.scoring_by === 'movement');

	const hidePastPerformanceButton =
		(!session.sections && !isArray(session.sections)) ||
		bookedMembersRef.current.length === 0 ||
		!hasForLoadMovements ||
		sections.length === 0;

	const StickyHeaderComponent = (
		<View>
			{attendanceLimit !== null && (
				<Text style={styles.slots}>
					{`${bookedMembersRef.current.length} / ${attendanceLimit}`}
				</Text>
			)}
			<Row style={{ marginHorizontal: metrics.md }}>
				{session.member_attendance.length > 0 &&
					!hidePastPerformanceButton &&
					isStaff && (
						<Button
							variant="darkgray"
							mode="outlined"
							title="Past Performance"
							onPress={() =>
								navigation.navigate(
									'AttendancePastPerformance',
									{
										session,
									},
								)
							}
							style={{
								marginBottom: metrics.md,
								...layout.flex_1,
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

	const renderListFooter = () => {
		return cancelledMembers?.length > 0 && isStaff ? (
			<View style={{ paddingHorizontal: metrics.rg }}>
				<Row style={styles.cancellationDateLabel}>
					<TouchableOpacity
						onPress={() =>
							setToggleCancelledList(!toggleCancelledList)
						}
					>
						<View style={styles.cancelledContainer}>
							<Text
								bold
							>{`Cancelled (${cancelledMembers.length})`}</Text>
							<IonicIcon
								name={
									toggleCancelledList
										? 'chevron-down-outline'
										: 'chevron-forward-outline'
								}
								size={15}
								style={styles.chevron}
							/>
						</View>
					</TouchableOpacity>
					{toggleCancelledList && (
						<Text size="sm" bold>
							Cancellation Date
						</Text>
					)}
				</Row>
				{toggleCancelledList &&
					sortBy(cancelledMembers, item =>
						item.user.firstname.toLowerCase(),
					).map((member, index) => {
						return (
							<Row key={index} style={styles.detailsContainer}>
								<View style={styles.avatarCon}>
									<Avatar
										source={member.user.profile_image}
										style={styles.avatarStyle}
										size={43}
									/>
								</View>
								<Spacer horizontal size="xs" />
								<View style={styles.attendanceListNameCon}>
									<Text numberOfLines={1}>
										{`${member.user.firstname} ${member.user.lastname}`}
									</Text>
								</View>
								<View style={styles.cancelledTimeCon}>
									<Text size="sm">
										{moment
											.tz(
												member.deleted_at,
												'YYYY-MM-DD HH:mm:ss',
												timezone || 'UTC',
											)
											.local()
											.format('MMM DD YYYY, h:mm a')}
									</Text>
								</View>
							</Row>
						);
					})}
			</View>
		) : null;
	};

	// Extract the key for each item
	const keyExtractor = (item: SessionMemberAttendanceSchemaType) =>
		item.user_id.toString();

	const footerMarginTop = bookedMembersRef.current.length > 0 ? -25 : 0;

	return (
		<FlatList
			data={sortBy(bookedMembersRef.current, item =>
				item.user.firstname.toLowerCase(),
			)}
			renderItem={renderItem}
			extractor={keyExtractor}
			ListHeaderComponent={StickyHeaderComponent}
			ListFooterComponent={renderListFooter}
			ListFooterComponentStyle={[
				styles.footer,
				{ marginTop: footerMarginTop },
			]}
		/>
	);
};

const styles = StyleSheet.create({
	slots: {
		textAlign: 'right',
		marginRight: config.metrics.lg,
		marginBottom: config.metrics.md,
	},
	messageButton: {
		borderColor: config.borders.colors.darkgray,
		borderWidth: 1,
		height: 42,
		width: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 8,
		marginRight: metrics.sm,
	},
	container: {
		flex: 1,
		borderWidth: 1,
		borderColor: 'red',
		justifyContent: 'flex-start',
	},
	detailsContainer: {
		paddingHorizontal: metrics.sm,
		paddingVertical: metrics.sm,
		alignItems: 'center',
	},
	avatarCon: {
		width: 36,
		alignItems: 'center',
	},
	avatarStyle: {
		borderRadius: 35,
		overflow: 'hidden',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: fonts.colors.lightgrey,
	},
	attendanceListNameCon: {
		width: '50%',
	},
	cancelledTimeCon: {
		flex: 1,
		alignItems: 'flex-end',
	},
	footer: {
		marginBottom: 30,
	},
	cancelledContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	chevron: { paddingLeft: metrics.sm, marginTop: 2 },
	cancellationDateLabel: {
		justifyContent: 'space-between',
		alignItems: 'center',
	},
});

export default SessionAttendanceTab;
