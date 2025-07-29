import { ScrollView, Text } from '@/components/atoms';
import { goBack } from '@/navigators/NavigationRef';
import { getScheduleDetail } from '@/services/session';
import layout from '@/theme/layout';
import { ApplicationScreenProps, SessionParams } from '@/types/navigation';
import {
	SessionDetailSchemaType,
	SessionMemberAttendanceSchemaType,
} from '@/types/schemas/session';
import { Constant, Func } from '@/utils';
import { SessionTabsEnum, VisibilityOptions } from '@/utils/Enum';
import useStore from '@/zustand/Store';
import { useQuery } from '@tanstack/react-query';
import { isArray } from 'lodash';
import moment from 'moment';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ClassResultsScreen from '../ClassResultsScreen/ClassResultsScreen';
import {
	SessionActionButtons,
	SessionAttendanceTab,
	SessionInformationTab,
	SessionLoader,
	SessionSectionsTab,
	SessionTabButtons,
} from './components';

const Session = ({ route, navigation }: ApplicationScreenProps) => {
	const loggedInUser = useStore(state => state.loggedInUser);
	const allowLeaderboards = useStore(state => state.allowLeaderboards);
	const setToLeaderboardsCallback = useStore(
		state => state.setToLeaderboardsCallback,
	);

	const [isFromLeaderboards, setIsFromLeaderboards] =
		useState<boolean>(false);

	const [firstLoad, setFirstLoad] = useState<boolean>(true);
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
		isSuccess,
		isFetchedAfterMount,
	} = useQuery({
		queryKey: ['sessionGetScheduleDetail'],
		queryFn: () => getScheduleDetail(eventId),
		select: res => res.data,
		enabled: !!eventId,
	});

	const setToLeaderboardsTab = () => {
		setIsFromLeaderboards(true);
		setActiveTab(SessionTabsEnum.RESULTS);
	};

	const handleBackButton = () => {
		if (isFromLeaderboards) {
			setActiveTab(SessionTabsEnum.SECTIONS);
			setIsFromLeaderboards(false);
		} else {
			goBack();
		}
	};
	const renderBackButton = () => (
		<TouchableOpacity onPress={handleBackButton}>
			<Icon name="chevron-left" color="white" size={40} />
		</TouchableOpacity>
	);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: renderBackButton,
		});
	}, [isFromLeaderboards]);

	setToLeaderboardsCallback(setToLeaderboardsTab);

	const session = data;
	const bookedMembers = session?.member_attendance ?? [];
	const startTime = session?.start_datetime as string;

	// const sections = useMemo(() => session?.sections, [session]);
	const attendanceView = session?.attendance_view ?? false;
	// const attendanceLimit = session?.attendance_limit ?? null;

	const hasLeaderboard = useMemo(() => {
		if (session?.sections && isArray(session.sections)) {
			return session?.sections?.some(e => !!e.is_leaderboard);
		}

		return false;
	}, [session?.sections]);

	const subscribed = useMemo(
		() => Func.checkSubscription(session?.bookable),
		[session],
	);

	const isLimited = useMemo(
		() =>
			!!session &&
			Func.isSessionVisible(
				session.bookable,
				Number(
					session.fb_class.class_visibility ||
						session.class?.class_visibility,
				),
				VisibilityOptions.LIMITED,
			),
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

	const disableUnbooking = useMemo(
		() =>
			!!(
				session &&
				Func.checkSessionLock(
					session.start_datetime,
					session.locktime_HH,
					session.locktime_MM,
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

	const classId = useMemo(
		() => Number(session?.class_event.class_id),
		[session],
	);

	const handleTabChange = (tab: SessionTabsEnum) => {
		setActiveTab(tab);
	};

	useEffect(() => {
		if (isLimited) {
			setActiveTab(SessionTabsEnum.INFO);
		}
	}, [isLimited]);

	useEffect(() => {
		if (isSuccess) {
			if (
				data.sections &&
				data.sections.length > 0 &&
				firstLoad &&
				!isLimited
			) {
				setActiveTab(SessionTabsEnum.SECTIONS);
				setFirstLoad(false);
			}
		}
	}, [isSuccess, data]);

	if (error) {
		return (
			<ScrollView>
				<Text>Error: {error.message}</Text>
			</ScrollView>
		);
	}

	if (!isFetchedAfterMount) {
		return <SessionLoader />;
	}

	return (
		<View style={styles.container}>
			<SessionActionButtons
				classId={classId}
				eventId={eventId}
				subscribed={subscribed}
				isAttending={isAttending}
				isWaitlist={isWaitlist}
				islocked={isBookingLocked}
				spotsLeft={spotsLeft}
				startTime={startTime}
				waitlistEnabled={!!waitlistEnabled}
				waitlistTime={Number(waitlistTime)}
				disableUnbooking={disableUnbooking}
			/>

			<SessionTabButtons
				activeTab={activeTab}
				handleTabChange={handleTabChange}
				subscribed={subscribed}
				isLimited={isLimited}
				allowLeaderboards={allowLeaderboards}
				attendanceView={attendanceView}
				bookedMembers={
					bookedMembers as SessionMemberAttendanceSchemaType[]
				}
				hasLeaderboard={hasLeaderboard}
				isStaff={!!loggedInUser?.user_data.is_staff}
			/>

			{activeTab === SessionTabsEnum.INFO ? (
				<SessionInformationTab
					session={session as SessionDetailSchemaType}
				/>
			) : null}

			{activeTab === SessionTabsEnum.SECTIONS ? (
				<SessionSectionsTab
					session={session as SessionDetailSchemaType}
					refreshing={refreshing}
					handleTabChange={handleTabChange}
				/>
			) : null}

			{activeTab === SessionTabsEnum.RESULTS ? (
				<ClassResultsScreen
					selectClass={classId}
					dateFromParams={moment(session?.start_datetime).format(
						Constant.DEFAULT_DATE_FORMAT,
					)}
				/>
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
