import { Text } from '@/components/atoms';
import { BookButton } from '@/components/molecules';
import { config } from '@/theme/_config';
import { ApplicationStackParamList } from '@/types/navigation';
import { ClassItemData } from '@/zustand/interface/SessionInterface';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export const AGENDA_ITEM_HEIGHT = 84;

const { metrics, fonts } = config;

interface AgendaItemProps {
	item: ClassItemData;
	setIsFromSession?: (isFromSession: boolean) => void;
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
			isCoach,
			color,
		},
		setIsFromSession,
	}: AgendaItemProps) => {
		const navigation =
			useNavigation<NavigationProp<ApplicationStackParamList>>();

		const [isAttending, setIsAttending] = useState<boolean>(
			!!isAttendingProp,
		);

		const handleViewSession = useCallback(() => {
			navigation.navigate('Session', {
				id: Number(eventId),
				title: title || 'Session',
				waitlistEnabled: !!waitlistBtn,
				waitlistTime: Number(waitlistTime),
			});

			if (setIsFromSession) {
				setIsFromSession(true);
			}
		}, []);

		if (hideSchedule || isLoading === true) {
			return null;
		}

		if (isLoading === false) {
			return (
				<View style={styles.itemLoaderContainer}>
					<Text color="black">No classes found</Text>
				</View>
			);
		}

		return (
			<TouchableOpacity onPress={handleViewSession} style={styles.item}>
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
					<Text bold size="md" numberOfLines={2} ellipsizeMode="tail">
						{title}
					</Text>
					{location ? (
						<Text color="info" size="sm">
							{location}
						</Text>
					) : null}
				</View>
				<View style={styles.itemButtonContainer}>
					<BookButton
						eventId={eventId as number}
						classId={classId as number}
						isSubscribed={isSubscribed}
						isCoach={isCoach as boolean}
						spotsLeft={spotsLeft as number}
						isWaitlisted={isWaitlisted as boolean}
						startDate={startDate as string}
						isBookingLocked={isBookingLocked as boolean}
						waitlistBtn={waitlistBtn as boolean}
						isAttending={isAttending}
						setAttending={setIsAttending}
						handleViewSession={handleViewSession}
					/>
				</View>
			</TouchableOpacity>
		);
	},
	(prevProps, nextProps) => {
		// Implement a custom comparison function
		// Return true if the props are equal (to prevent re-render)
		return (
			prevProps.item.eventId === nextProps.item.eventId &&
			prevProps.item.isAttending === nextProps.item.isAttending &&
			prevProps.item.isWaitlisted === nextProps.item.isWaitlisted &&
			prevProps.item.title === nextProps.item.title &&
			prevProps.item.isLoading === nextProps.item.isLoading &&
			prevProps.item.spotsLeft === nextProps.item.spotsLeft &&
			prevProps.item.color === nextProps.item.color &&
			prevProps.item.waitlistBtn === nextProps.item.waitlistBtn &&
			prevProps.item.isWaitlisted === nextProps.item.isWaitlisted
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
		minHeight: AGENDA_ITEM_HEIGHT,
	},
	itemLoaderContainer: {
		marginLeft: config.metrics.md,
		paddingTop: config.metrics.md,
		height: AGENDA_ITEM_HEIGHT,
	},
	itemLoader: {
		marginBottom: 15,
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
		paddingRight: fonts.metrics.sm,
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
