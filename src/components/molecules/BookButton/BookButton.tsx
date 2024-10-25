import { Button, Text } from '@/components/atoms';
import {
	attendSession,
	cancelWaitlist,
	joinWaitlist,
} from '@/services/session';
import { ApplicationStackParamList } from '@/types/navigation';
import { Func, Say } from '@/utils';
import { ClassItemData } from '@/zustand/interface/SessionInterface';
import useStore from '@/zustand/Store';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { isNumber } from 'lodash';
import moment from 'moment';
import { memo, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import SimpleToast from 'react-native-simple-toast';

interface BookButtonProps {
	classId: number;
	eventId: number;
	isSubscribed?: boolean;
	isCoach?: boolean;
	isAttending: boolean;
	spotsLeft: number;
	isWaitlisted: boolean;
	startDate: string;
	isBookingLocked: boolean;
	waitlistBtn: boolean;
	isPreviewMode?: boolean; // If from WOD screen
	handleViewSession?: () => void;
	setAttending?: (value: boolean) => void;
	showBuyButton?: boolean;
}

const BookButton = ({
	classId,
	eventId,
	isSubscribed,
	isCoach,
	isAttending,
	spotsLeft,
	isWaitlisted,
	startDate,
	isBookingLocked,
	waitlistBtn,
	isPreviewMode = false,
	handleViewSession,
	setAttending = () => {},
	showBuyButton,
}: BookButtonProps) => {
	const navigation =
		useNavigation<NavigationProp<ApplicationStackParamList>>();

	const [isLoading, setIsLoading] = useState<boolean>(false);

	const queryClient = useQueryClient();

	const {
		setClasses,
		getClassesByDate,
		loggedInUser,
		setBookButtonCallback,
		setIsAttendingCallback,
	} = useStore(state => ({
		setClasses: state.setClasses,
		getClassesByDate: state.getClassesByDate,
		loggedInUser: state.loggedInUser,
		setBookButtonCallback: state.setBookButtonCallback,
		setIsAttendingCallback: state.setIsAttendingCallback,
	}));

	/**
	 * Reloads the session detail by invalidating the cache and fetching the data again.
	 * This is useful when the user books or cancels a session.
	 */
	const reloadSessionDetail = () => {
		void queryClient.invalidateQueries({
			queryKey: ['sessionGetScheduleDetail'],
		});

		const setDate = moment(startDate).format('YYYY-MM-DD');

		/**
		 * WORKAROUND: If the user is in preview mode, set the classes to loading.
		 * Sometimes the data isn't reflected immediately after booking a session.
		 */
		if (isPreviewMode) {
			setClasses(setDate, [{ isLoading: true } as ClassItemData], '');
		}

		// get classes by date
		getClassesByDate(setDate, loggedInUser!.id, true);
	};

	useEffect(() => {
		setBookButtonCallback(handleBook);
		setIsAttendingCallback(setAttending);
	}, []);

	/**
	 * Handles the logic for booking a session after the user has pressed the "Book Now" button.
	 * If the user does not have payment details, it will prompt the user to add payment details.
	 * If the user has payment details, it will navigate to the BuyNow screen to book the session.
	 */
	const handleBook = (showSuccessToast = true) => {
		let showToast = showSuccessToast;
		if (isLoading) return;
		setIsLoading(true);
		// TODO: for booking modal this.toggleProcessingMember(currentUserId);

		attendSession({
			event_id: Number(eventId),
			is_attend: !isAttending,
		})
			.then(res => {
				if (res.error) {
					showToast = false;

					// check error code and verify if waitlist on class is enabled
					if (res.error_code === 'SFULL01' && waitlistBtn) {
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
									style: 'destructive',
								},
							],
							{
								cancelable: true,
							},
						);
					} else if (res.error_code === 'AB001') {
						// Show alert if user is already booked for this session
						SimpleToast.show(
							'You are already booked for this session',
							SimpleToast.SHORT,
						);
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
				if (showToast) {
					const bookAction = !isAttending ? 'booked' : 'unbooked';

					SimpleToast.show(
						`You have successfully ${bookAction} this session`,
						SimpleToast.SHORT,
					);
				}

				reloadSessionDetail();
			})
			.catch(() => {
				// console.log('@err', err);
				Say.warn('Error booking session', 'Oops!');
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	/**
	 * Handles the logic for booking a session after the user has pressed the "Book Now" button.
	 * If the user does not have payment details, it will prompt the user to add payment details.
	 * If the user has payment details, it will navigate to the BuyNow screen to book the session.
	 */
	const handleBuyNow = () => {
		const redirectToBuyNow = () => {
			const sessionDate = moment(startDate).format('YYYY-MM-DD');

			navigation.navigate('BuyNow', {
				sessionId: eventId,
				sessionDate,
				onSuccessPurchase: () => {
					handleBook();
					getClassesByDate(sessionDate, loggedInUser!.id, true);
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

	/**
	 * Join waitlist for a given class and event id
	 * @returns {Promise<void>}
	 */
	const handleWaitlist = () => {
		setIsLoading(true);

		joinWaitlist(Number(classId), Number(eventId))
			.then(res => {
				if (res.error) {
					Say.warn(res.message, 'Oops!');
				} else {
					SimpleToast.show(
						'You have been added to the waitlist',
						SimpleToast.SHORT,
					);
					reloadSessionDetail();
				}
			})
			.catch(() => {
				Say.warn('Error joining waitlist', 'Oops!');
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	/**
	 * Cancel waitlist for a given class and event id
	 * @returns {Promise<void>}
	 */
	const handleCancelWaitlist = () => {
		setIsLoading(true);

		cancelWaitlist(Number(classId), Number(eventId))
			.then(res => {
				if (res.error) {
					Say.warn(res.message, 'Oops!');
				} else {
					SimpleToast.show(
						'You have been removed from the waitlist',
						SimpleToast.SHORT,
					);
					reloadSessionDetail();
				}
			})
			.catch(() => {
				Say.warn('Error cancel waitlist', 'Oops!');
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	/**
	 * Check if the session is within 72 hours
	 */
	const isSessionWithin72Hours = Func.isSessionWithin72Hours(startDate);

	const isSessionFromPast = Func.isSessionFromPast(startDate);

	if (isAttending && handleViewSession) {
		return (
			<Button
				title="Booked"
				onPress={handleViewSession}
				variant="brand"
				sm
				compact
				fullWidth
				mode="contained"
			/>
		);
	}

	if (!isPreviewMode && isSessionFromPast) {
		return null;
	}

	if (isBookingLocked && isPreviewMode) {
		return <Button sm mode="outlined" title="Booking Locked" disabled />;
	}

	if (!isSubscribed && !isCoach && !isAttending && isSessionWithin72Hours) {
		const isFull = spotsLeft === 0;
		return showBuyButton ? (
			<Button
				sm
				compact
				fullWidth
				mode="outlined"
				variant="info"
				title={isFull ? 'Full' : 'Buy'}
				onPress={() => (!isFull ? handleBuyNow() : {})}
			/>
		) : (
			<Text center size="xs">
				Not included in your membership
			</Text>
		);
	}

	if (isCoach && handleViewSession) {
		return (
			<Button
				sm
				compact
				fullWidth
				title="Coach"
				onPress={handleViewSession}
				mode="contained"
			/>
		);
	}

	if (isAttending && !isSessionFromPast) {
		return (
			<Button
				sm
				title="Unbook"
				onPress={() => handleBook()}
				loading={isLoading}
				compact
				fullWidth
				mode="contained"
			/>
		);
	}

	if (spotsLeft === null || !isNumber(spotsLeft)) {
		return null;
	}

	if (!isAttending && isWaitlisted && !isPreviewMode) {
		return (
			<Button
				title="Waitlisted"
				variant="brand"
				fullWidth
				compact
				sm
				mode="contained"
			/>
		);
	}

	if (isAttending && !isWaitlisted && spotsLeft > 0 && spotsLeft <= 3) {
		return (
			<Button
				sm
				compact
				fullWidth
				mode="outlined"
				title={`${spotsLeft} ${spotsLeft > 1 ? 'spots' : 'spot'} left`}
				onPress={() => handleBook()}
			/>
		);
	}

	if (!isAttending && spotsLeft === 0 && isSessionWithin72Hours) {
		if (waitlistBtn) {
			if (!isWaitlisted) {
				return (
					<Button
						sm
						compact
						fullWidth
						mode={isPreviewMode ? 'contained' : 'outlined'}
						title={isPreviewMode ? 'Join Waitlist' : 'Waitlist'}
						onPress={handleWaitlist}
						loading={isLoading}
					/>
				);
			}

			if (handleCancelWaitlist) {
				return (
					<Button
						sm
						mode="contained"
						title="Cancel Waitlist"
						onPress={handleCancelWaitlist}
						loading={isLoading}
					/>
				);
			}
		}

		return <Button sm mode="outlined" title="Full" compact fullWidth />;
	}

	if (
		!isBookingLocked &&
		!isAttending &&
		!isWaitlisted &&
		spotsLeft > 0 &&
		isSessionWithin72Hours
	) {
		return (
			<Button
				sm
				compact
				fullWidth
				title="Book"
				mode="outlined"
				onPress={() => handleBook()}
				loading={isLoading}
			/>
		);
	}

	return null;
};

export default memo(BookButton);
