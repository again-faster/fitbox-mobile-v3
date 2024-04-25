import { Button, Text } from '@/components/atoms';
import attendSession from '@/services/session/attendSession';
import joinWaitlist from '@/services/session/joinWaitlist';
import { config } from '@/theme/_config';
import { Say } from '@/utils';
import { ClassItemData } from '@/zustand/interface/SessionInterface';
import { isNumber } from 'lodash';
import moment from 'moment';
import { memo, useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const { metrics, fonts } = config;

interface AgendaItemProps {
	item: ClassItemData;
}

const AgendaItem = ({
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
		startDate,
		isBookingLocked,
		eventId,
		waitlistBtn,
		classId,
	},
}: AgendaItemProps) => {
	const [isBooking, setIsBooking] = useState<boolean>(false);
	const [isAttending, setIsAttending] = useState<boolean>(!!isAttendingProp);

	const handleBook = () => {
		setIsBooking(true);

		attendSession(Number(eventId), true)
			.then(res => {
				if (res.error) {
					Say.warn(res.message, 'Oops!');
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

	const handleViewSession = useCallback(() => {
		// TODO: view session
		Say.ok('Coming soon!');
	}, []);

	const renderButton = useCallback(() => {
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

		if (isAttending && !isWaitlisted && spotsLeft > 0 && spotsLeft <= 3) {
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

		if (!isAttending && spotsLeft === 0 && !isWaitlisted && waitlistBtn) {
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

	if (isLoading || hideSchedule) {
		return null;
	}

	return (
		<TouchableOpacity onPress={handleViewSession} style={styles.item}>
			<View style={styles.timeContainer}>
				<Text size="rg" bold>
					{start}
				</Text>
				<Text size="xs">{duration}</Text>
			</View>
			<View style={styles.divider} />
			<View style={styles.contentContainer}>
				<Text bold size="md">
					{title}
				</Text>
				{location ? <Text size="sm">{location}</Text> : null}
			</View>
			<View style={styles.itemButtonContainer}>
				{!isSubscribed ? (
					<Text center size="xs">
						Class not included in Subscription
					</Text>
				) : (
					renderButton()
				)}
			</View>
		</TouchableOpacity>
	);
};

export default memo(AgendaItem);

const styles = StyleSheet.create({
	item: {
		padding: 20,
		backgroundColor: 'white',
		borderBottomWidth: 1,
		borderBottomColor: 'lightgrey',
		flexDirection: 'row',
	},
	timeContainer: {
		width: '20%',
		justifyContent: 'center',
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
