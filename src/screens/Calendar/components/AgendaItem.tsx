import { Button, SkeletonView, Text } from '@/components/atoms';
import { attendSession, joinWaitlist } from '@/services/session';
import { config } from '@/theme/_config';
import { ApplicationStackParamList } from '@/types/navigation';
import { Say } from '@/utils';
import useStore from '@/zustand/Store';
import { ClassItemData } from '@/zustand/interface/SessionInterface';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { isNumber } from 'lodash';
import moment from 'moment';
import React, { useCallback, useMemo, useState } from 'react';
import {
	Alert,
	Animated,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import SimpleToast from 'react-native-simple-toast';

const { metrics, fonts } = config;

interface AgendaItemProps {
	item: ClassItemData;
}

const AgendaItem: React.FC<AgendaItemProps> = React.memo(
	({
		item: {
			start,
			duration,
			title,
			location,
			isAttending: isAttendingProp,
			spotsLeft,
			isLoading,
			isSubscribed,
			hideSchedule,
			isWaitlisted,
			waitlistTime,
			startDate,
			isBookingLocked,
			eventId,
			waitlistBtn,
			classId,
			venueId,
			isCoach,
			color,
		},
	}: AgendaItemProps) => {
		const navigation =
			useNavigation<NavigationProp<ApplicationStackParamList>>();

		const { loggedInUser, classFilters, venueFilters, getClassesByDate } =
			useStore(e => ({
				loggedInUser: e.loggedInUser,
				classFilters: e.classFilters,
				venueFilters: e.venueFilters,
				getClassesByDate: e.getClassesByDate,
			}));

		const [isBooking, setIsBooking] = useState<boolean>(false);
		const [isAttending, setIsAttending] = useState<boolean>(
			!!isAttendingProp,
		);

		const handleBook = () => {
			setIsBooking(true);

			attendSession({
				event_id: Number(eventId),
				is_attend: true,
			})
				.then(res => {
					if (res.error) {
						if (res?.error_code === 'AB001') {
							// Show alert if user is already booked for this
							SimpleToast.show(
								'You are already booked for this session',
								SimpleToast.SHORT,
							);

							// refresh calendar to update booked s on calendar
							getClassesByDate(
								moment(startDate).format('YYYY-MM-DD'),
								loggedInUser!.id,
							);
						}

						if (res.message) {
							Say.warn(res.message, 'Oops!');
						}
					} else {
						setIsAttending(true);
					}
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
			setIsBooking(true);

			joinWaitlist(Number(classId), Number(eventId))
				.then(res => {
					if (res.error) {
						Say.warn(res.message, 'Oops!');
					} else {
						Say.ok('You have been added to the waitlist');
					}
				})
				.catch(() => {
					Say.warn('Error joining waitlist', 'Oops!');
				})
				.finally(() => {
					setIsBooking(false);
				});
		};

		// TODO: Find a way to merge both function from SessionActionButtons.tsx
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

			const hasPaymentDetails =
				loggedInUser?.user_data.has_payment_details;
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

		const handleViewSession = useCallback(() => {
			navigation.navigate('Session', {
				id: Number(eventId),
				title: title || 'Session',
				waitlistEnabled: !!isWaitlisted,
				waitlistTime: Number(waitlistTime),
			});
		}, []);

		const renderButton = useCallback(() => {
			if (!isSubscribed && !isCoach && !isAttending) {
				const isFull = spotsLeft === 0;
				return (
					<Button
						sm
						compact
						fullWidth
						mode="outlined"
						variant="info"
						title={isFull ? 'Full' : 'Buy'}
						onPress={() => (!isFull ? handleBuyNow() : {})}
					/>
				);
			}

			if (isCoach) {
				return (
					<Button
						sm
						compact
						fullWidth
						title="Coach"
						onPress={handleViewSession}
					/>
				);
			}

			if (isAttending) {
				return (
					<Button
						title="Booked"
						onPress={handleViewSession}
						variant="brand"
						sm
						compact
						fullWidth
					/>
				);
			}

			if (spotsLeft === null || !isNumber(spotsLeft)) {
				return null;
			}

			if (!isAttending && isWaitlisted) {
				return (
					<Button
						title="Waitlisted"
						variant="brand"
						fullWidth
						compact
						sm
					/>
				);
			}

			if (
				isAttending &&
				!isWaitlisted &&
				spotsLeft > 0 &&
				spotsLeft <= 3
			) {
				return (
					<Button
						sm
						compact
						fullWidth
						mode="outlined"
						title={`${spotsLeft} ${
							spotsLeft > 1 ? 'spots' : 'spot'
						} left`}
						onPress={handleBook}
					/>
				);
			}

			if (!isAttending && !isWaitlisted && spotsLeft === 0) {
				return (
					<Button
						sm
						mode="outlined"
						title="Session Full"
						compact
						fullWidth
					/>
				);
			}

			if (
				!isBookingLocked &&
				!isAttending &&
				!isWaitlisted &&
				spotsLeft > 0 &&
				moment(startDate).isAfter(moment())
			) {
				return (
					<Button
						sm
						compact
						fullWidth
						title="Book"
						mode="outlined"
						onPress={handleBook}
						loading={isBooking}
					/>
				);
			}

			if (
				!isAttending &&
				spotsLeft === 0 &&
				!isWaitlisted &&
				waitlistBtn
			) {
				return (
					<Button
						sm
						compact
						fullWidth
						mode="outlined"
						title="Waitlist"
						onPress={handleWaitlist}
						loading={isBooking}
					/>
				);
			}

			return null;
		}, [isBooking]);

		const isFiltered = useMemo(() => {
			const useClassFilters = classFilters.filter(
				filter => filter.is_selected,
			);

			const useVenueFilters = venueFilters.filter(
				filter => filter.is_selected,
			);

			if (useClassFilters.length === 0 && useVenueFilters.length === 0) {
				return false;
			}

			const classFilter = useClassFilters.some(
				filter => filter.id !== classId,
			);

			const venueFilter = useVenueFilters.some(
				filter => filter.id !== venueId && filter.id !== -1,
			);

			return classFilter || venueFilter;
		}, [classFilters, venueFilters]);

		if (hideSchedule || isFiltered) {
			return null;
		}

		if (isLoading) {
			return (
				<SkeletonView
					height={10}
					width={50}
					style={styles.itemLoader}
				/>
			);
		}

		return (
			<Animated.View>
				<TouchableOpacity
					onPress={handleViewSession}
					style={styles.item}
				>
					<View style={styles.timeContainer}>
						<Text size="rg" bold>
							{start}
						</Text>
						<Text size="xs">{duration}</Text>
					</View>
					<View
						style={[
							styles.divider,
							{ backgroundColor: color || fonts.colors.brand },
						]}
					/>
					<View style={styles.contentContainer}>
						<Text bold size="md">
							{title}
						</Text>
						{location ? <Text size="sm">{location}</Text> : null}
					</View>
					<View style={styles.itemButtonContainer}>
						{renderButton()}
					</View>
				</TouchableOpacity>
			</Animated.View>
		);
	},
	(prevProps, nextProps) => {
		// Implement a custom comparison function
		// Return true if the props are equal (to prevent re-render)
		return (
			prevProps.item.eventId === nextProps.item.eventId &&
			prevProps.item.isAttending === nextProps.item.isAttending &&
			prevProps.item.isWaitlisted === nextProps.item.isWaitlisted &&
			// Add other relevant comparisons
			prevProps.item.spotsLeft === nextProps.item.spotsLeft
		);
	},
);

export default AgendaItem;

const styles = StyleSheet.create({
	item: {
		padding: 20,
		backgroundColor: 'white',
		borderBottomWidth: 1,
		borderBottomColor: 'lightgrey',
		flexDirection: 'row',
	},
	itemLoader: {
		marginLeft: 20,
		marginTop: 10,
	},
	timeContainer: {
		width: '18%',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: config.metrics.rg,
	},
	divider: {
		borderRadius: 8,
		backgroundColor: fonts.colors.brand,
		height: '100%',
		width: 5,
		marginRight: metrics.rg,
	},
	contentContainer: {
		justifyContent: 'center',
		flex: 1,
	},
	itemTitleText: {
		color: 'black',
		fontWeight: 'bold',
		fontSize: 16,
	},
	itemButtonContainer: {
		alignItems: 'flex-end',
		justifyContent: 'center',
		width: '25%',
	},
	emptyItem: {
		paddingLeft: 20,
		height: 52,
		justifyContent: 'center',
		borderBottomWidth: 1,
		borderBottomColor: 'lightgrey',
	},
	emptyItemText: {
		color: 'lightgrey',
		fontSize: 14,
	},
});
