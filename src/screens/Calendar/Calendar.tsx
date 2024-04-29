import useAuth from '@/auth/hooks/useAuth';
import { Loader } from '@/components/molecules';
import { getScheduleList } from '@/services/session';
import { config } from '@/theme/_config';
import { Func } from '@/utils';
import { VisibilityOptions } from '@/utils/Enum';
import useStore from '@/zustand/Store';
import { ClassItemData } from '@/zustand/interface/SessionInterface';
import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
	AgendaList,
	CalendarProvider,
	WeekCalendar,
} from 'react-native-calendars';
import AgendaItem from './components/AgendaItem';

const { height } = Dimensions.get('window');
const { fonts } = config;

const Calendar = () => {
	const { user } = useAuth();

	const { classes, setClasses, setActiveMonth } = useStore(state => ({
		classes: state.classes,
		setClasses: state.setClasses,
		setActiveMonth: state.setActiveMonth,
	}));

	const [initialLoading, setInitialLoading] = useState<boolean>(true);
	const [currentDate, setCurrentDate] = useState<string>(
		moment().format('YYYY-MM-DD'),
	);

	const loadClasses = () => {
		// loop through the whole week based on current date
		const week = Array.from({ length: 8 }, (_, i) => {
			return moment(currentDate)
				.startOf('week')
				.add(i, 'days')
				.format('YYYY-MM-DD');
		});

		week.forEach((date, i) => {
			if (moment(date).isSameOrAfter(moment(currentDate))) {
				setTimeout(() => {
					fetchList(date);
				}, 50 * i);
			}
		});
	};

	const fetchList = (date: string) => {
		if (initialLoading) setInitialLoading(false);

		// check if already loading
		const hasData = classes.find(item => item.title === date);
		if (hasData) {
			return;
		}

		// add loading state
		setClasses(date, [{ isLoading: true }]);

		getScheduleList(date, date)
			.then(res => {
				if (!res.error) {
					const classesData: ClassItemData[] = res.data.map(item => {
						// get duration
						const duration = `${Func.getDuration(
							item.local_start,
							item.local_end,
						)} min(s)`;

						// check if schedule is hidden
						const hideSchedule = Func.isSessionVisible(
							item.bookable,
							item.fb_class?.class_visibility ||
								item.class?.class_visibility,
							VisibilityOptions.SUBSCRIBED,
						);

						// isbookinglocked
						const isBookingLocked = Func.checkSessionLock(
							item.local_start,
							item.booking_HH,
							item.booking_MM,
						);

						// get spots left
						const spotsLeft = item.class
							? Func.getSpotLeft(
									item.attendance_limit as number,
									item.member_attendance?.length as number,
							  )
							: null;

						// isAttending
						const isAttending = item?.member_attendance?.some(
							m => m.user_id === user?.id,
						);

						// waitlist button
						const waitlistBtn =
							!!item.waitlist.enable_waitlist &&
							moment(item.local_start).diff(moment(), 'minutes') >
								Number(item.waitlist.waitlist_timelimit) * 60;

						// return data
						return {
							start: moment(item.local_start).format('H:mm A'),
							isSubscribed: Func.checkSubscription(item.bookable),
							location: item.venue_id ? item.venue : undefined,
							startDate: item.local_start,
							eventId: item.event_id,
							isWaitlisted: false,
							title: item.title,
							isBookingLocked,
							hideSchedule,
							waitlistBtn,
							isAttending,
							spotsLeft,
							duration,
						};
					});

					setClasses(date, classesData);
				}
			})
			.catch(err => {
				console.log('@err', err);
			});
	};

	useEffect(() => {
		setActiveMonth(moment(currentDate).format('MMMM'));
		void loadClasses();
	}, [currentDate]);

	const renderItem = useCallback(({ item }: any) => {
		return <AgendaItem item={item as ClassItemData} />;
	}, []);

	const currentDateIsFetching = classes.find(
		item => item.title === currentDate && item.data[0]?.isLoading === true,
	);

	if (currentDateIsFetching && initialLoading) {
		return <Loader />;
	}

	return (
		<CalendarProvider
			date={moment().format('YYYY-MM-DD')}
			showTodayButton
			onDateChanged={date => setCurrentDate(date)}
			todayBottomMargin={16}
		>
			<WeekCalendar firstDay={1} allowShadow={false} />
			<AgendaList
				sections={classes}
				renderItem={renderItem}
				sectionStyle={styles.section}
				viewOffset={-90}
				windowSize={100}
				// infiniteListProps={{
				// 	visibleIndicesChangedDebounce: 250,
				// }}
			/>
		</CalendarProvider>
	);
};

const styles = StyleSheet.create({
	container: {
		height: height - 100,
	},
	section: {
		backgroundColor: '#FFF',
		color: 'grey',
		fontSize: fonts.metrics.rg,
	},
});

export default Calendar;
