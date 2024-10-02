import { Avatar, Row, Spacer, Text } from '@/components/atoms';
import { FlatList, Loader } from '@/components/molecules';
import { updateAttendance } from '@/services/leaderboards';
import { attendSession } from '@/services/session';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { AddAttendanceParams, AddAttendanceProps } from '@/types/navigation';
import {
	NotBookedMemberSchemaType,
	SessionMemberAttendanceSchemaType,
} from '@/types/schemas/session';
import { Say } from '@/utils';
import useStore from '@/zustand/Store';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import SimpleToast from 'react-native-simple-toast';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const { fonts, metrics } = config;

const WODAddAttendance = ({ route }: AddAttendanceProps) => {
	const { session } = route.params as AddAttendanceParams;
	const currentUserId = useStore(state => state.loggedInUser?.id);
	const queryClient = useQueryClient();

	const [searchQuery, setSearchQuery] = useState('');
	const [processingMembers, setProcessingMembers] = useState<number[]>([]);
	const [bookedMembers, setBookedMembers] = useState<
		SessionMemberAttendanceSchemaType[]
	>(session?.member_attendance ?? []);
	const [notBookedMembers, setNotBookedMembers] = useState<
		NotBookedMemberSchemaType[]
	>(session?.not_book_members ?? []);

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
		// attendance limit
		const attendanceLimit = session?.attendance_limit;

		// check if user is already booked
		const isAttend = !bookedMembers.some(
			member => member.user_id === userId,
		);

		// check if user is already in processingMembers
		if (processingMembers.length > 0) {
			Say.warn('Please wait while we are processing your request');
			return;
		}

		// check if session is already full
		if (
			bookedMembers.length >= (attendanceLimit as number) &&
			attendanceLimit !== null &&
			isAttend
		) {
			Say.err('Session is already full');
			return;
		}

		// add user to processingMembers
		addProcessingMember(userId);

		// otherwise use toggle attendance

		// Prepare payload
		const payload = {
			event_id: session?.id,
			is_attend: isAttend,
			user_id: userId,
			admin_override: override,
		};

		await attendSession(payload)
			.then(async response => {
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
						newBookedMembers = [...bookedMembers, addMember];
					} else {
						newBookedMembers = bookedMembers.filter(
							member => member.user_id !== userId,
						);

						// New not booked members
						const addMember = bookedMembers.find(
							member => member.user_id === userId,
						) as NotBookedMemberSchemaType;
						newNotBookedMembers = [...notBookedMembers, addMember];
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

					if (!override) {
						await updateAttendance({
							event_id: payload.event_id,
							user_id: userId,
							status: 'checked-in',
						});
					}

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
	};

	const data = useMemo(() => {
		if (!searchQuery) {
			return notBookedMembers;
		}

		return notBookedMembers.filter(member => {
			const fullName = `${member.user.firstname} ${member.user.lastname}`;
			return fullName.toLowerCase().includes(searchQuery.toLowerCase());
		});
	}, [searchQuery, notBookedMembers]);

	const renderItem = useCallback(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		({ item }: any) => {
			const { user } = item as NotBookedMemberSchemaType;
			const loading = processingMembers.includes(user.id);

			if (currentUserId === user.id) return null;
			return (
				<TouchableOpacity
					key={user.id}
					onPress={() => void handleToggleUserAttendance(user.id)}
					style={{ margin: metrics.md }}
				>
					<Row spacing="space-between">
						<Row style={layout.flex_1}>
							<View style={styles.avatarCon}>
								<Avatar
									source={user?.profile_image}
									size={25}
								/>
							</View>

							<Spacer horizontal size="sm" />

							<View style={layout.flex_1}>
								<Text size="rg">
									{user?.firstname} {user?.lastname}
								</Text>
							</View>
						</Row>

						<View style={styles.actionButtonContainer}>
							{loading ? (
								<Loader />
							) : (
								<MIcon
									size={fonts.metrics.xl}
									name="account-plus"
									color={fonts.colors.dark}
								/>
							)}
						</View>
					</Row>
				</TouchableOpacity>
			);
		},
		[processingMembers],
	);

	return (
		<View>
			<Searchbar
				placeholder="Search"
				onChangeText={q => setSearchQuery(q)}
				value={searchQuery}
				style={styles.searchBar}
				inputStyle={styles.searchBarInput}
			/>

			<FlatList
				data={data}
				renderItem={renderItem}
				extractor={(item: NotBookedMemberSchemaType) =>
					item.user.id.toString()
				}
			/>
		</View>
	);
};

export default WODAddAttendance;

const styles = StyleSheet.create({
	container: {},
	searchBar: {
		borderRadius: 0,
		backgroundColor: '#FAFAFA',
	},
	searchBarInput: {
		fontSize: fonts.metrics.md,
	},
	avatarCon: {
		width: 25,
		height: 25,
		alignItems: 'center',
	},
	actionButtonContainer: {
		justifyContent: 'center',
	},
});
