import { SkeletonView, Text } from '@/components/atoms';
import { BookButton } from '@/components/molecules';
import { config } from '@/theme/_config';
import { ApplicationStackParamList } from '@/types/navigation';
import useStore from '@/zustand/Store';
import { ClassItemData } from '@/zustand/interface/SessionInterface';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

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

		const { classFilters, venueFilters } = useStore(e => ({
			classFilters: e.classFilters,
			venueFilters: e.venueFilters,
			getClassesByDate: e.getClassesByDate,
		}));

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
		}, []);

		const renderButton = useCallback(
			() => (
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
			),
			[
				isAttending,
				isSubscribed,
				isCoach,
				spotsLeft,
				isWaitlisted,
				startDate,
				isBookingLocked,
				waitlistBtn,
				eventId,
			],
		);

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
						{location ? (
							<Text color="info" size="sm">
								{location}
							</Text>
						) : null}
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
