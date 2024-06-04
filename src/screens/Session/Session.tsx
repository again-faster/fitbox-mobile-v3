import { ScrollView, Text } from '@/components/atoms';
import { getScheduleDetail } from '@/services/session';
import layout from '@/theme/layout';
import { ApplicationScreenProps, SessionParams } from '@/types/navigation';
import { SessionDetailSchemaType } from '@/types/schemas/session';
import { Func } from '@/utils';
import { SessionTabsEnum } from '@/utils/Enum';
import useStore from '@/zustand/Store';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
	SessionActionButtons,
	SessionAttendanceTab,
	SessionInformationTab,
	SessionLoader,
	SessionSectionsTab,
	SessionTabButtons,
} from './components';

const Session = ({ route }: ApplicationScreenProps) => {
	const loggedInUser = useStore(state => state.loggedInUser);
	const [activeTab, setActiveTab] = useState<SessionTabsEnum>(
		SessionTabsEnum.INFO,
	);

	const {
		id: eventId = 0,
		waitlistEnabled,
		waitlistTime,
	} = route.params as SessionParams;

	const {
		data,
		isFetching: refreshing,
		error,
		// refetch,
	} = useQuery({
		queryKey: ['getUserGyms'],
		queryFn: () => getScheduleDetail(eventId),
		select: res => res.data,
		enabled: !!eventId,
	});

	const session = data;
	const bookedMembers = session?.member_attendance ?? [];
	const startTime = moment(session?.start_datetime);

	// const sections = useMemo(() => session?.sections, [session]);
	// const attendanceView = useMemo(
	// 	() =>
	// 		session?.attendance_view !== undefined
	// 			? session?.attendance_view
	// 			: true,
	// 	[session],
	// );

	// const notBookedMembers = useMemo(
	// 	() => session?.not_book_members ?? [],
	// 	[session],
	// );

	const subscribed = useMemo(
		() => Func.checkSubscription(session?.bookable),
		[session],
	);

	const isBookingLocked = useMemo(
		() =>
			!!(
				session &&
				Func.checkSessionLock(
					session.start_datetime,
					session.booking_HH,
					session.booking_MM,
				)
			),
		[session],
	);

	const isAttending = useMemo(
		() =>
			!!session?.member_attendance?.some(
				e => e.user_id === loggedInUser?.id,
			),
		[session, loggedInUser?.id],
	);

	const isWaitlist = useMemo(
		() =>
			!!session?.waitlist?.some(
				w =>
					w.calendar_event_id === session?.id &&
					w.user_id === loggedInUser?.id,
			),
		[session, loggedInUser],
	);

	const spotsLeft = useMemo(() => {
		if (session && session?.attendance_limit !== null && bookedMembers) {
			return Number(session.attendance_limit) - bookedMembers.length;
		}

		return bookedMembers.length + 10;
	}, [session, bookedMembers]);

	// 		TODO:		tab: showWorkoutTab ? 1 : 0, // show wod page if available
	// 		TODO:			toggledSections,

	const handleTabChange = (tab: SessionTabsEnum) => {
		setActiveTab(tab);
	};

	if (error) {
		return (
			<ScrollView>
				<Text>Error: {error.message}</Text>
			</ScrollView>
		);
	}

	if (refreshing) {
		return <SessionLoader />;
	}

	return (
		<View style={styles.container}>
			<SessionActionButtons
				eventId={eventId}
				subscribed={subscribed}
				isAttending={isAttending}
				isBookingLocked={isBookingLocked}
				isWaitlist={isWaitlist}
				islocked={isBookingLocked}
				spotsLeft={spotsLeft}
				startTime={startTime}
				waitlistEnabled={!!waitlistEnabled}
				waitlistTime={Number(waitlistTime)}
			/>

			<SessionTabButtons
				activeTab={activeTab}
				handleTabChange={handleTabChange}
			/>

			{activeTab === SessionTabsEnum.INFO ? (
				<SessionInformationTab
					session={session as SessionDetailSchemaType}
				/>
			) : null}

			{activeTab === SessionTabsEnum.SECTIONS ? (
				<SessionSectionsTab
					session={session as SessionDetailSchemaType}
				/>
			) : null}

			{activeTab === SessionTabsEnum.RESULTS ? (
				<Text center>Coming soon..</Text>
			) : null}

			{activeTab === SessionTabsEnum.ATTENDANCE ? (
				<SessionAttendanceTab
					session={session as SessionDetailSchemaType}
				/>
			) : null}
		</View>
	);
};

export default Session;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	infoSectionContainer: {
		marginHorizontal: 5,
		marginBottom: '5%',
		paddingVertical: 10,
		paddingHorizontal: 7,
		borderRadius: 5,
		borderWidth: 1,
		borderColor: '#f2f2f2',
		...layout.shadowLight,
	},
});
