import { Button, Row } from '@/components/atoms';
import { attendSession } from '@/services/session';
import layout from '@/theme/layout';
import { ApplicationStackParamList } from '@/types/navigation';
import { Say } from '@/utils';
import useStore from '@/zustand/Store';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { memo, useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import SimpleToast from 'react-native-simple-toast';

interface SessionActionButtonsProps {
	eventId: number;
	subscribed: boolean;
	isAttending: boolean;
	spotsLeft: number;
	isWaitlist: boolean;
	islocked: boolean;
	startTime: moment.Moment;
	waitlistEnabled: boolean;
	waitlistTime: number;
}

const SessionActionButtons = ({
	eventId,
	subscribed,
	isAttending: propsIsAttending,
	spotsLeft,
	isWaitlist,
	islocked,
	startTime,
	waitlistEnabled,
	waitlistTime,
}: SessionActionButtonsProps) => {
	const navigation =
		useNavigation<NavigationProp<ApplicationStackParamList>>();

	const queryClient = useQueryClient();

	const { loggedInUser, getClassesByDate } = useStore(state => ({
		loggedInUser: state.loggedInUser,
		getClassesByDate: state.getClassesByDate,
	}));

	const [isWaitlisting, setWaitlisting] = useState<boolean>(false);
	const [isBooking, setIsBooking] = useState<boolean>(false);
	const [isAttending, setAttending] = useState<boolean>(propsIsAttending);

	// TODO: Temporary console.log, remove when done
	// eslint-disable-next-line no-console
	console.log('currentTime', {
		setWaitlisting,
		eventId,
		waitlistTime,
	});

	const reloadSessionDetail = () =>
		void queryClient.invalidateQueries({
			queryKey: ['sessionGetScheduleDetail'],
		});

	// TODO: Find a way to merge both function from AgendaItem.tsx
	const handleBuyNow = () => {
		const redirectToBuyNow = () => {
			const sessionDate = startTime.format('YYYY-MM-DD');

			navigation.navigate('BuyNow', {
				sessionId: eventId,
				sessionDate,
				onSuccessPurchase: () => {
					handleBook();
				},
			});
		};

		const hasPaymentDetails = loggedInUser?.user_data.has_payment_details;
		if (hasPaymentDetails !== 'skipped' && !hasPaymentDetails) {
			Alert.alert(
				'Oops!',
				'You need to have payment details to book this class. Do you want to add payment details now?',
				[
					{
						text: 'Yes',
						onPress: () => {
							navigation.navigate('PaymentInformationModal', {
								onSuccessCallback: redirectToBuyNow,
							});
						},
					},
					{ text: 'No', style: 'destructive' },
				],
				{ cancelable: true },
			);
		} else {
			redirectToBuyNow();
		}
	};

	const handleBook = (showSuccessToast = true) => {
		if (isBooking) return;

		setIsBooking(true);
		// TODO: for booking modal this.toggleProcessingMember(currentUserId);

		attendSession({
			event_id: Number(eventId),
			is_attend: !isAttending,
		})
			.then(res => {
				if (res.error) {
					// check error code and verify if waitlist on class is enabled
					if (res.error_code === 'SFULL01' && waitlistEnabled) {
						Alert.alert(
							'Session full',
							'This session is already full, do you want to join waitlist instead?',
							[
								{
									text: 'Yes',
									onPress: handleWaitlist,
								},
								{
									text: 'No',
									onPress: reloadSessionDetail,
									style: 'destructive',
								},
							],
							{
								cancelable: true,
								onDismiss: reloadSessionDetail,
							},
						);
					} else if (res.error_code === 'AB001') {
						// Show alert if user is already booked for this session
						SimpleToast.show(
							'You are already booked for this session',
							SimpleToast.SHORT,
						);

						// trigger refresh
						reloadSessionDetail();
					} else if (res?.allow_buynow) {
						Alert.alert(
							'No Sessions Remaining',
							`${res?.message}Would you like to buy another subscription and book?`,
							[
								{ text: 'No', style: 'destructive' },
								{
									text: 'Buy',
									onPress: handleBuyNow,
								},
							],
							{ cancelable: true },
						);
					} else {
						Say.warn(res.message.replace('box', 'gym'));
					}

					if (res?.error_code === 'AB001') {
						// Show alert if user is already booked for this
						SimpleToast.show(
							'You are already booked for this session',
							SimpleToast.SHORT,
						);
					}

					if (res.message) {
						Say.warn(res.message, 'Oops!');
					}
				} else {
					setAttending(!isAttending);
				}

				// TODO: Implement for booking users if staff
				// const userDetails = {
				// 	user: {
				// 		id: currentUser.user_id,
				// 		firstname: currentUser.first_name,
				// 		lastname: currentUser.last_name,
				// 		profile_image: currentUser.profile_image,
				// 	},
				// 	user_id: currentUser.user_id,
				// };

				// if (isAttending) {
				// 	// add user to booked members
				// 	bookedMembers.push({
				// 		...userDetails,
				// 		attendance: {
				// 			// add attendance status
				// 			status: 'booked',
				// 		},
				// 	});

				// 	// remove user from not booked members
				// 	notBookedMembers = notBookedMembers.filter(
				// 		member => member.user_id !== currentUserId,
				// 	);

				// 	// show toast
				// 	Toast.show('You have successfully booked this session');
				// } else {
				// 	// remove user from booked members
				// 	bookedMembers = bookedMembers.filter(
				// 		member => member.user_id !== currentUserId,
				// 	);

				// 	// add user to not booked members
				// 	notBookedMembers.push(userDetails);

				// 	// show toast
				// 	Toast.show('You have successfully unbooked this session');
				// }

				// 		this.handleRefreshCalendar();
				// 	}
				// } catch (err) {
				// 	Say.err(err);
				// } finally {
				// 	this.setState({
				// 		isBooking: false,
				// 		bookedMembers,
				// 		notBookedMembers,
				// 	});

				// 	this.toggleProcessingMember(currentUserId);

				// show toast
				if (showSuccessToast) {
					const bookAction = !isAttending ? 'booked' : 'unbooked';

					SimpleToast.show(
						`You have successfully ${bookAction} this session`,
						SimpleToast.SHORT,
					);
				}

				getClassesByDate(
					moment(startTime).format('YYYY-MM-DD'),
					loggedInUser!.id,
					true,
				);
			})
			.catch(() => {
				// console.log('@err', err);
				Say.warn('Error booking session', 'Oops!');
			})
			.finally(() => {
				setIsBooking(false);
			});
	};

	const handleWaitlist = () => {
		// handle waitlist
	};

	const renderLeftButton = useCallback(() => {
		if (isAttending) {
			return <Button sm mode="outlined" title="Session Booked" />;
		}

		if (isWaitlist) {
			return <Button sm mode="outlined" title="Waitlisted" />;
		}

		if (spotsLeft === 0) {
			return <Button sm mode="outlined" title="Session Full" />;
		}

		if (spotsLeft <= 3 && spotsLeft > 0) {
			return (
				<Button
					sm
					mode="outlined"
					title={`${spotsLeft} ${
						spotsLeft > 1 ? 'spots' : 'spot'
					} left`}
				/>
			);
		}

		return null;
	}, [isAttending, isWaitlist, spotsLeft]);

	const renderRightButton = useCallback(() => {
		if (islocked) {
			return (
				<Button sm mode="outlined" title="Booking Locked" disabled />
			);
		}

		if (isAttending) {
			return (
				<Button
					sm
					title="Unbook"
					onPress={() => handleBook()}
					loading={isBooking}
				/>
			);
		}

		if (isWaitlist) {
			return (
				<Button
					sm
					title="Cancel"
					onPress={handleWaitlist}
					loading={isWaitlisting}
				/>
			);
		}

		if (spotsLeft === 0 && waitlistEnabled) {
			return (
				<Button
					sm
					title="Join Waitlist"
					onPress={handleWaitlist}
					loading={isWaitlisting}
				/>
			);
		}

		if (spotsLeft > 0) {
			return (
				<Button
					sm
					title="Book"
					onPress={() => handleBook()}
					loading={isBooking}
				/>
			);
		}

		return null;
	}, [
		islocked,
		isBooking,
		isAttending,
		isWaitlist,
		spotsLeft,
		waitlistEnabled,
	]);

	return !subscribed ? (
		<Text style={[styles.warningTxt, styles.container]}>
			This class is not included in your Subscription, talk to your Gym
			about upgrading to Book.
		</Text>
	) : (
		<Row spacing="space-around" style={styles.container}>
			<View style={layout.flex_1}>{renderLeftButton()}</View>
			<View style={layout.flex_1}>{renderRightButton()}</View>
		</Row>
	);
};

export default memo(SessionActionButtons);

const styles = StyleSheet.create({
	container: {
		borderBottomWidth: 0.5,
		borderColor: '#ccc',
		paddingHorizontal: 15,
		paddingVertical: 12,
		gap: 10,
	},
	warningTxt: {
		color: '#595959',
		textAlign: 'center',
		fontSize: 16,
	},
});
