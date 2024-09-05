/* eslint-disable no-console */
import { SafeScreen } from '@/components/template';
import { getGymClasses, getGymVenues } from '@/services/gym';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { GymVenueType } from '@/types/schemas/gym';
import { FilterTypeEnum } from '@/utils/Enum';
import useStore from '@/zustand/Store';
import {
	ClassFilter,
	ClassItemData,
	VenueFilter,
} from '@/zustand/interface/SessionInterface';
import { useIsFocused } from '@react-navigation/native';
import { debounce, isArray } from 'lodash';
import moment from 'moment';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
	const {
		classes,
		loggedInUser,
		classFilters,
		venueFilters,
		hasPlaceholder,
		setHasPlaceholder,
		setClasses,
		getClassesByDate,
		setActiveMonth,
		setVenueFilters,
		setClassFilters,
		setHeaderTitle,
		defaultClassFilter,
	} = useStore(state => ({
		classes: state.classes,
		loggedInUser: state.loggedInUser,
		classFilters: state.classFilters,
		venueFilters: state.venueFilters,
		hasPlaceholder: state.hasPlaceholder,
		setHasPlaceholder: state.setHasPlaceholder,
		setClasses: state.setClasses,
		getClassesByDate: state.getClassesByDate,
		setActiveMonth: state.setActiveMonth,
		setVenueFilters: state.setVenueFilters,
		setClassFilters: state.setClassFilters,
		setHeaderTitle: state.setHeaderTitle,
		defaultClassFilter: state.defaultClassFilter,
	}));

	const [currentDate, setCurrentDate] = useState<string>(
		moment().format('YYYY-MM-DD'),
	);

	const loadClasses = () => {
		// Calculate start of the week once
		const weekStartDate = moment(currentDate);

		const isPrevious = moment(currentDate).isBefore(moment(), 'day');
		if (isPrevious) {
			weekStartDate.startOf('week').add(1, 'day');
		} else {
			weekStartDate.startOf('week').subtract(1, 'day');
		}

		// Generate the dates for the whole week based on the current date
		const week = Array.from({ length: 9 }, (_, i) =>
			weekStartDate.clone().add(i, 'days').format('YYYY-MM-DD'),
		);

		// Fetch classes for each date with a delay
		week.forEach(date => {
			if (moment(date).isSameOrAfter(moment(currentDate))) {
				getClassesByDate(date, loggedInUser!.id);
			}
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
		void loadClasses();
	}, [currentDate]);

	useEffect(() => {
		void fetchFilterOptions();

		if (!hasPlaceholder) {
			// create date placeholders to today to next 2 months
			const today = moment();
			const nextMonth = today.clone().add(1, 'months');
			const dates = Array.from(
				{ length: nextMonth.diff(today, 'days') },
				(_, i) => today.clone().add(i, 'days').format('YYYY-MM-DD'),
			);

			dates.forEach(date => {
				setClasses(date, [{ isLoading: true } as ClassItemData]);
			});

			setHasPlaceholder(true);

			if (currentDate !== moment().format('YYYY-MM-DD')) {
				setCurrentDate(moment().format('YYYY-MM-DD'));
			} else {
				void loadClasses();
			}
		}
	}, [hasPlaceholder]);

	const isFocused = useIsFocused();
	useEffect(() => {
		if (!isFocused && defaultClassFilter) {
			let defaultClass = [];
			let defaultVenue = [];

			const classIds = new Set(defaultClassFilter.classIds);
			const venueIds = new Set(defaultClassFilter.locationIds);

			defaultClass = classFilters.map(item => ({
				...item,
				is_selected: !!classIds.has(item.id as number),
			}));

			defaultVenue = venueFilters.map(item => ({
				...item,
				is_selected: !!venueIds.has(item.id as number),
			}));

			setClassFilters(defaultClass);
			setVenueFilters(defaultVenue);
			setHeaderTitle(defaultClassFilter.name);
		}
	}, [isFocused]);

	useEffect(() => {
		const clearClasses = classFilters.some(c => c.is_selected);
		const clearLocations = venueFilters.some(v => v.is_selected);

		if (!clearClasses && !clearLocations) {
			setHeaderTitle('');
		}
	}, [classFilters, venueFilters]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const renderItem = useCallback(({ item }: any) => {
		return <AgendaItem item={item as ClassItemData} />;
	}, []);

	// useFocusEffect(

	const handleDateChange = useCallback(
		debounce((date: string) => {
			setCurrentDate(date);
		}, 1000),
		[],
	);

	const memoizedClasses = useMemo(() => classes, [classes]);

	return (
		<SafeScreen>
			<CalendarProvider
				date={currentDate}
				showTodayButton
				onDateChanged={handleDateChange}
				todayBottomMargin={26}
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
						textDayFontFamily:
							layout.fontMontserratRegular.fontFamily,
						textDayHeaderFontFamily:
							layout.fontMontserratBold.fontFamily,
					}}
				/>
				{classes.length > 0 && hasPlaceholder && (
					<AgendaList
						sections={memoizedClasses}
						renderItem={renderItem}
						sectionStyle={styles.section}
						viewOffset={-70}
						windowSize={100}
						removeClippedSubviews
						keyExtractor={(item: ClassItemData) =>
							String(item.eventId)
						}
						initialNumToRender={10}
						maxToRenderPerBatch={5}
						onEndReached={() => {
							console.log('onEndReached');
						}}
					/>
				)}
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
