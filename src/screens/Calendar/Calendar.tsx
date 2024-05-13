/* eslint-disable no-console */
import useAuth from '@/auth/hooks/useAuth';
import { Loader } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { getGymClasses, getGymVenues } from '@/services/gym';
import { getScheduleList } from '@/services/session';
import { config } from '@/theme/_config';
import { GymVenueType } from '@/types/schemas/gym';
import { Func } from '@/utils';
import { FilterTypeEnum, VisibilityOptions } from '@/utils/Enum';
import useStore from '@/zustand/Store';
import {
	ClassFilter,
	ClassItemData,
	VenueFilter,
} from '@/zustand/interface/SessionInterface';
import { isArray } from 'lodash';
import moment from 'moment';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import {
	AgendaList,
	CalendarProvider,
	WeekCalendar,
} from 'react-native-calendars';
import AgendaItem from './components/AgendaItem';
import CalendarFilterPanel from './components/CalendarFilterPanel';
import CalendarFilterSelect from './components/CalendarFilterSelectPanel';

const { height } = Dimensions.get('window');
const { fonts } = config;

const Calendar = () => {
	const { user } = useAuth();

	const {
		classes,
		classFilters,
		venueFilters,
		setClasses,
		setActiveMonth,
		setVenueFilters,
		setClassFilters,
	} = useStore(state => ({
		classes: state.classes,
		classFilters: state.classFilters,
		venueFilters: state.venueFilters,
		setClasses: state.setClasses,
		setActiveMonth: state.setActiveMonth,
		setVenueFilters: state.setVenueFilters,
		setClassFilters: state.setClassFilters,
	}));

	const [initialLoading, setInitialLoading] = useState<boolean>(true);
	const [currentDate, setCurrentDate] = useState<string>(
		moment().format('YYYY-MM-DD'),
	);

	const loadClasses = () => {
		// loop through the whole week based on current date
		const week = Array.from({ length: 9 }, (_, i) => {
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
							venueId: Number(item.venue_id),
							startDate: item.local_start,
							classId: item.class.id,
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

	const fetchFilterOptions = () => {
		const selectedVenueIds = venueFilters
			.filter(v => v.is_selected)
			.map(v => v.id);
		const selectedClassIds = classFilters
			.filter(c => c.is_selected)
			.map(c => c.id);

		// fetch venues
		getGymVenues()
			.then(res => {
				if (isArray(res)) {
					const venueFilterList: VenueFilter[] = res.map(
						(c: GymVenueType) => {
							return {
								...c,
								is_selected:
									selectedVenueIds.includes(c.id) || false,
							};
						},
					);

					// add "No location" filter
					venueFilterList.unshift({
						id: -1,
						name: 'No location',
						location: 'Show classes without a location',
						is_selected: false,
					});

					// set venue filters
					setVenueFilters(venueFilterList);
				}
			})
			.catch(err => {
				console.log(err);
			});

		getGymClasses()
			.then(res => {
				if (!res.error) {
					const classFilterList: ClassFilter[] = res.data.map(c => {
						return {
							...c,
							is_selected:
								selectedClassIds.includes(c.id) || false,
						};
					});

					// set class filters
					setClassFilters(classFilterList);
				} else {
					throw new Error(res.message);
				}
			})
			.catch(err => {
				console.log('getGymClasses', err);
			});
	};

	useEffect(() => {
		setActiveMonth(moment(currentDate).format('MMMM'));
		fetchFilterOptions();
		void loadClasses();
	}, [currentDate]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
		<SafeScreen>
			<CalendarProvider
				date={moment().format('YYYY-MM-DD')}
				showTodayButton
				onDateChanged={date => setCurrentDate(date)}
				todayBottomMargin={16}
				theme={{
					todayButtonTextColor: fonts.colors.brand,
					todayButtonFontWeight: 'bold',
				}}
			>
				<WeekCalendar
					firstDay={1}
					allowShadow={false}
					theme={{
						selectedDayBackgroundColor: fonts.colors.brand,
						todayTextColor: fonts.colors.brand,
					}}
				/>
				<AgendaList
					sections={classes}
					renderItem={renderItem}
					sectionStyle={styles.section}
					viewOffset={-90}
					windowSize={100}
					removeClippedSubviews
					keyExtractor={(item: ClassItemData) => String(item.eventId)}
					// infiniteListProps={{
					// 	visibleIndicesChangedDebounce: 250,
					// }}
				/>
			</CalendarProvider>

			{/* Modals */}
			<CalendarFilterPanel />
			<CalendarFilterSelect type={FilterTypeEnum.CLASS} />
			<CalendarFilterSelect type={FilterTypeEnum.VENUE} />
		</SafeScreen>
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
