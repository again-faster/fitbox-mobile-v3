/* eslint-disable no-console */
import { Row, Text } from '@/components/atoms';
import { SafeScreen } from '@/components/template';
import { getGymClasses, getGymVenues } from '@/services/gym';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { GymVenueType } from '@/types/schemas/gym';
import { Constant } from '@/utils';
import { FilterTypeEnum, ModalEnum } from '@/utils/Enum';
import useStore from '@/zustand/Store';
import {
	ClassFilter,
	ClassItemData,
	VenueFilter,
} from '@/zustand/interface/SessionInterface';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { isArray } from 'lodash';
import moment from 'moment';
import {
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	AppState,
	AppStateStatus,
	Dimensions,
	RefreshControl,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AgendaItem, { AGENDA_ITEM_HEIGHT } from './components/AgendaItem';
import CalendarFilterPanel from './components/CalendarFilterPanel';
import CalendarFilterSelect from './components/CalendarFilterSelectPanel';
import CalendarSkeletonLoader from './components/CalendarSkeletonLoader';
import CalendarWeek, { CalendarWeekRef } from './components/CalendarWeek';
import { FilterCriteria, shouldIncludeClass } from './utils/functions';

// TODO: Use this later
// const NextWeekListFooterComponent = ({ onPress }: { onPress: () => void }) => {
// 	return (
// 		<TouchableOpacity
// 			style={[
// 				{
// 					height: AGENDA_ITEM_HEIGHT,
// 					padding: config.metrics.lg,
// 				},
// 				layout.itemsEnd,
// 				layout.justifyCenter,
// 			]}
// 			onPress={onPress}
// 		>
// 			<Row
// 				style={{
// 					backgroundColor: config.fonts.colors.brand,
// 					padding: config.fonts.metrics.xs,
// 				}}
// 			>
// 				<Text center size="sm" color="light">
// 					Go to Next Week
// 				</Text>
// 				<Spacer horizontal size="xs" />
// 				<Icon
// 					name="chevron-right"
// 					size={config.fonts.metrics.sm}
// 					color="white"
// 				/>
// 			</Row>
// 		</TouchableOpacity>
// 	);
// };

const { height } = Dimensions.get('window');

const ListFooterComponent = () => {
	return <View style={{ height: AGENDA_ITEM_HEIGHT }} />;
};

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
		setVenueFilters,
		setClassFilters,
		setHeaderTitle,
		defaultClassFilter,
		setClassFiltersToApply,
		setVenueFiltersToApply,
		toggleModal,
	} = useStore(state => ({
		classes: state.classes,
		loggedInUser: state.loggedInUser,
		classFilters: state.classFilters,
		venueFilters: state.venueFilters,
		hasPlaceholder: state.hasPlaceholder,
		setHasPlaceholder: state.setHasPlaceholder,
		setClasses: state.setClasses,
		getClassesByDate: state.getClassesByDate,
		setVenueFilters: state.setVenueFilters,
		setClassFilters: state.setClassFilters,
		setHeaderTitle: state.setHeaderTitle,
		defaultClassFilter: state.defaultClassFilter,
		setClassFiltersToApply: state.setClassFiltersToApply,
		setVenueFiltersToApply: state.setVenueFiltersToApply,
		toggleModal: state.toggleModal,
	}));
	const [today, setToday] = useState(
		moment().format(Constant.DEFAULT_DATE_FORMAT),
	); // State for today
	const [currentDate, setCurrentDate] = useState<string>(today);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [isInitialLoadingComplete, setIsInitialLoadingComplete] =
		useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const calendarWeekRef = useRef<CalendarWeekRef>(null);

	useEffect(() => {
		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			if (nextAppState === 'active') {
				setToday(moment().format(Constant.DEFAULT_DATE_FORMAT));
				handleDateChange(today);
			}
		};

		const subscription = AppState.addEventListener(
			'change',
			handleAppStateChange,
		);

		return () => {
			subscription.remove(); // Clean up the subscription on unmount
		};
	}, []);
	useEffect(() => {
		const interval = setInterval(() => {
			setToday(moment().format(Constant.DEFAULT_DATE_FORMAT));
		}, 60000); // Update every minute

		return () => clearInterval(interval); // Clear interval on unmount
	}, []);

	const loadClasses = () => {
		// create a range from current date to 3 days ago and 3 days ahead
		const startDate = moment(currentDate).startOf('isoWeek');
		const endDate = moment(currentDate).endOf('isoWeek');

		// Generate an array of dates from startDate to endDate
		const week = [];
		let date = startDate;

		while (date.isSameOrBefore(endDate)) {
			week.push(date.format(Constant.DEFAULT_DATE_FORMAT));
			date = date.add(1, 'day');
		}

		week.forEach(wDate => {
			if (moment(wDate).isSameOrAfter(moment(currentDate))) {
				getClassesByDate(wDate, loggedInUser!.id);
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
					setVenueFiltersToApply(venueFilterList);
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
					setClassFiltersToApply(classFilterList);
				} else {
					throw new Error(res.message);
				}
			})
			.catch(err => {
				console.log('getGymClasses', err);
			});
	};

	useEffect(() => {
		if (hasPlaceholder) {
			return;
		}

		setIsInitialLoading(true);
		setIsInitialLoadingComplete(false);

		void fetchFilterOptions();

		// Start of month and monday
		const startDate = moment().startOf('isoWeek');
		const endingDate = moment().endOf('isoWeek');
		const dates = Array.from(
			{ length: endingDate.diff(startDate, 'days') },
			(_, i) =>
				startDate
					.clone()
					.add(i, 'days')
					.format(Constant.DEFAULT_DATE_FORMAT),
		);

		dates.forEach(date => {
			setClasses(date, [{ isLoading: true } as ClassItemData], '');
		});

		setHasPlaceholder(true);
		setCurrentDate(today);
	}, [hasPlaceholder]);

	useEffect(() => {
		if (isInitialLoadingComplete) {
			setTimeout(() => {
				void loadClasses();
			}, 1500);

			return;
		}

		setCurrentDate(today);
	}, [isInitialLoadingComplete, currentDate]);

	const [isFromSessions, setIsFromSessions] = useState(false);

	const isFocused = useIsFocused();
	useEffect(() => {
		if (!isFocused && defaultClassFilter && !isFromSessions) {
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
			setClassFiltersToApply(defaultClass);
			setVenueFiltersToApply(defaultVenue);
			setHeaderTitle(defaultClassFilter.name);
			setIsFromSessions(false);
		}
		if (isFocused && isFromSessions) {
			setIsFromSessions(false);
		}
		if (isFocused && !isFromSessions) {
			handleDateChange(today);
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
		if (typeof item === 'string') {
			return null;
		}

		const useItem = item as ClassItemData;
		return (
			<AgendaItem
				key={useItem.eventId}
				item={useItem}
				setIsFromSession={setIsFromSessions}
			/>
		);
	}, []);

	useFocusEffect(
		useCallback(() => {
			// refetch current date classes
			if (hasPlaceholder) {
				getClassesByDate(currentDate, loggedInUser!.id, true);
			}
		}, []),
	);

	const numberOfFilters = useMemo(() => {
		const numOfClassFilters = classFilters.filter(
			e => e.is_selected,
		).length;
		const numOfVenueFilters = venueFilters.filter(
			e => e.is_selected,
		).length;

		return numOfClassFilters + numOfVenueFilters;
	}, [classFilters, venueFilters]);

	const memoizedClasses = useMemo(() => {
		const formattedClasses: (string | ClassItemData)[] = [];
		setIsLoading(true);
		// Define filter criteria
		const criteria: FilterCriteria = {
			selectedClassIds: classFilters
				.filter(filter => filter.is_selected)
				.map(filter => filter.id)
				.filter((id): id is number => id !== null),
			selectedVenueIds: venueFilters
				.filter(filter => filter.is_selected)
				.map(filter => filter.id)
				.filter((id): id is number => id !== null),
		};

		classes.forEach(section => {
			if (section.title !== currentDate) {
				return;
			}

			formattedClasses.push(section.title);

			// Filter classes based on criteria
			const filteredClasses = section.data.filter(item =>
				shouldIncludeClass(item, criteria),
			);

			if (filteredClasses.length > 0) {
				formattedClasses.push(...filteredClasses);
			} else if (section.fetchedAt !== '') {
				formattedClasses.push({ isLoading: false } as ClassItemData);
			}
		});
		setIsLoading(false);
		return formattedClasses;
	}, [classes, classFilters, venueFilters, currentDate]);

	useEffect(() => {
		if (memoizedClasses.length > 0) {
			if (!isInitialLoadingComplete) {
				setTimeout(() => {
					setIsInitialLoadingComplete(true);
					setIsInitialLoading(false);
					// calendarWeekRef.current?.scrollToCurrentDate();
				}, 2000);
			}
		}
	}, [memoizedClasses]);

	const handleDateChange = useCallback((date: SetStateAction<string>) => {
		setCurrentDate(date);
		setTimeout(() => {
			calendarWeekRef.current?.scrollToCurrentDate();
		}, 500);
	}, []);

	const isLoadingCurrentDate =
		memoizedClasses.some(e => typeof e === 'object' && e.isLoading) ||
		isLoading ||
		memoizedClasses.length === 0;

	const showTodayButton = currentDate !== today;

	const listFooterComponent = useMemo(() => {
		if (showTodayButton) {
			return <ListFooterComponent />;
		}

		return null;
	}, [showTodayButton, currentDate]);

	return (
		<SafeScreen>
			{(isInitialLoading || !isInitialLoadingComplete) && (
				<CalendarSkeletonLoader />
			)}

			<View style={[layout.flex_1]}>
				<CalendarWeek
					ref={calendarWeekRef}
					currentDate={currentDate}
					setCurrentDate={setCurrentDate}
				/>

				<FlashList
					refreshControl={
						<RefreshControl
							refreshing={isLoadingCurrentDate}
							onRefresh={() => {
								getClassesByDate(
									currentDate,
									loggedInUser!.id,
									true,
								);
							}}
							colors={[config.fonts.colors.brand]}
						/>
					}
					data={memoizedClasses}
					renderItem={renderItem}
					estimatedItemSize={AGENDA_ITEM_HEIGHT}
					ListFooterComponent={listFooterComponent}
				/>
			</View>

			{numberOfFilters > 0 && (
				<View style={styles.filterContainer}>
					<TouchableOpacity
						onPress={() => toggleModal(ModalEnum.CALENDAR_FILTER)}
					>
						<Row align="center">
							<View
								style={{ marginHorizontal: config.metrics.sm }}
							>
								<Icon
									name="filter-outline"
									size={25}
									color={config.backgrounds.darkgray}
								/>
								<Badge
									visible
									style={styles.badgeStyle}
									size={14}
									allowFontScaling={false}
								>
									{numberOfFilters}
								</Badge>
							</View>

							<Text>
								{numberOfFilters > 1
									? 'Filters Applied'
									: 'Filter Applied'}
							</Text>
						</Row>
					</TouchableOpacity>
				</View>
			)}

			{/* Modals */}
			<CalendarFilterPanel />
			<CalendarFilterSelect type={FilterTypeEnum.CLASS} />
			<CalendarFilterSelect type={FilterTypeEnum.VENUE} />

			{true && (
				<TouchableOpacity
					onPress={() => {
						handleDateChange(today);
					}}
					style={[styles.floatingActionBtn]}
				>
					<Row>
						<Text size="sm" bold color="brand">
							Today
						</Text>
						<Icon
							name="arrow-right"
							size={15}
							color={config.backgrounds.brand}
							style={{ marginLeft: config.metrics.xs }}
						/>
					</Row>
				</TouchableOpacity>
			)}
		</SafeScreen>
	);
};

export default Calendar;

const styles = StyleSheet.create({
	container: {
		height: height - 100,
	},
	badgeStyle: {
		position: 'absolute',
		top: -2,
		right: 1,
	},
	filterContainer: {
		padding: config.metrics.xs,
		paddingTop: config.metrics.sm,
		backgroundColor: 'white',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.2,
		shadowRadius: 1.41,
		elevation: 2,
	},
	opacified: {
		opacity: 0.5,
	},
	floatingActionBtn: {
		...layout.shadowMedium,
		borderRadius: 40,
		paddingVertical: config.metrics.sm,
		paddingHorizontal: config.metrics.md,
		position: 'absolute',
		bottom: '7%',
		left: config.metrics.md,
	},
});
