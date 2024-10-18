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
	Dimensions,
	StyleSheet,
	TouchableOpacity,
	View,
	ViewToken,
} from 'react-native';
import { Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AgendaItem, { AGENDA_ITEM_HEIGHT } from './components/AgendaItem';
import CalendarFilterPanel from './components/CalendarFilterPanel';
import CalendarFilterSelect from './components/CalendarFilterSelectPanel';
import CalendarSkeletonLoader from './components/CalendarSkeletonLoader';
import CalendarWeek from './components/CalendarWeek';
import { FilterCriteria, shouldIncludeClass } from './utils/functions';

const { height } = Dimensions.get('window');

const TODAYS_DATE = moment().format(Constant.DEFAULT_DATE_FORMAT);

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

	const [currentDate, setCurrentDate] = useState<string>(TODAYS_DATE);
	const [isNavigating, setIsNavigating] = useState(false);
	const [isScrolling, setIsScrolling] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [isInitialLoadingComplete, setIsInitialLoadingComplete] =
		useState(false);
	const [isWeekCalendarScrolling, setIsWeekCalendarScrolling] =
		useState(false);

	const flashListRef = useRef<FlashList<string | ClassItemData>>(null);

	const loadClasses = () => {
		// create a range from current date to 3 days ago and 3 days ahead
		let startDate = moment(currentDate).startOf('isoWeek');
		if (isInitialLoadingComplete) {
			startDate = moment(currentDate).subtract(3, 'days');
		}
		const endDate = moment(currentDate).add(3, 'days');

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
		const startDate = moment().subtract(1, 'month');
		const endingDate = startDate.clone().add(2, 'months');
		const dates = Array.from(
			{ length: endingDate.diff(startDate, 'days') },
			(_, i) =>
				startDate
					.clone()
					.add(i, 'days')
					.format(Constant.DEFAULT_DATE_FORMAT),
		);

		dates.forEach(date => {
			setClasses(date, [{ isLoading: true } as ClassItemData]);
		});

		setHasPlaceholder(true);
	}, [hasPlaceholder]);

	useEffect(() => {
		if (isInitialLoadingComplete) {
			setTimeout(() => {
				void loadClasses();
			}, 1500);
		}
	}, [isInitialLoadingComplete]);

	useEffect(() => {
		const scrollToDateIndex = async () => {
			if (isInitialLoadingComplete) {
				void loadClasses();
			}

			if (!isWeekCalendarScrolling) {
				return;
			}

			if (!flashListRef.current) {
				return;
			}

			const dateIndex = memoizedClasses.findIndex(
				item => typeof item === 'string' && item === currentDate,
			);

			if (dateIndex !== -1) {
				setIsNavigating(true);

				await new Promise(resolve => {
					flashListRef.current?.scrollToIndex({
						index: dateIndex,
						animated: false,
					});

					setTimeout(resolve, 1500);
				});
				setIsNavigating(false);
			}

			setIsWeekCalendarScrolling(false);
		};

		void scrollToDateIndex();
	}, [currentDate]);

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
			setClassFiltersToApply(defaultClass);
			setVenueFiltersToApply(defaultVenue);
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
		if (typeof item === 'string') {
			const isToday = moment(item).isSame(moment(), 'day');
			return (
				<View style={styles.section}>
					<Text bold color="darkgray">
						{isToday ? 'Today' : ''}
						{moment(item).format(
							`${!isToday ? 'dddd' : ''}, MMM DD`,
						)}
					</Text>
				</View>
			);
		}

		const useItem = item as ClassItemData;
		return <AgendaItem key={useItem.eventId} item={useItem} />;
	}, []);

	const getItemType = useCallback((item: string | ClassItemData) => {
		return typeof item === 'string' ? 'sectionHeader' : 'row';
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
			formattedClasses.push(section.title);

			// Filter classes based on criteria
			const filteredClasses = section.data.filter(item =>
				shouldIncludeClass(item, criteria),
			);

			if (filteredClasses.length > 0) {
				formattedClasses.push(...filteredClasses);
			} else {
				formattedClasses.push({ isLoading: false } as ClassItemData);
			}
		});
		return formattedClasses;
	}, [classes, classFilters, venueFilters]);

	const stickyHeaderIndices = memoizedClasses
		.map((item, index) => {
			if (typeof item === 'string') {
				return index;
			}

			return null;
		})
		.filter(item => item !== null) as number[];

	const handleDateChange = useCallback((date: SetStateAction<string>) => {
		setCurrentDate(date);
	}, []);

	// FOR Scroll to Today on initial Load
	useEffect(() => {
		setTimeout(() => {
			if (!isInitialLoading) return;

			const todayIndex = memoizedClasses.findIndex(
				item => typeof item === 'string' && item === TODAYS_DATE,
			);

			setIsNavigating(true);
			if (todayIndex !== -1 && flashListRef.current) {
				flashListRef.current.scrollToIndex({
					index: todayIndex,
					animated: false,
				});
			}

			setTimeout(() => {
				setIsInitialLoadingComplete(true);
				handleDateChange(TODAYS_DATE);
				setIsInitialLoading(false);
				setIsNavigating(false);
			}, 1000);
		}, 1000);
	}, [memoizedClasses]);

	const onViewableItemsChanged = ({
		viewableItems,
	}: {
		viewableItems: ViewToken[];
	}) => {
		if (isNavigating) {
			return;
		}

		const firstItem = viewableItems[0];
		if (!firstItem) {
			return;
		}

		let newDate: string | null = firstItem.item as string;

		if (typeof firstItem.item === 'object') {
			if ('startDate' in firstItem.item) {
				const newDateObj = newDate as ClassItemData;
				newDate = newDateObj.startDate ?? '';
			} else if ('isLoading' in firstItem.item) {
				newDate = null;
			}
		}

		if (!!newDate && moment(newDate).isValid()) {
			console.log('navigating to', newDate);

			handleDateChange(
				moment(newDate).format(Constant.DEFAULT_DATE_FORMAT),
			);
		}
	};

	return (
		<SafeScreen>
			{(isInitialLoading || !isInitialLoadingComplete) && (
				<CalendarSkeletonLoader />
			)}

			<View style={[layout.flex_1]}>
				<CalendarWeek
					currentDate={currentDate}
					setCurrentDate={d => {
						setIsWeekCalendarScrolling(true);
						handleDateChange(d);
					}}
					onMomentumScrollBegin={() => {
						setIsNavigating(true);
						setIsWeekCalendarScrolling(true);
					}}
					onMomentumScrollEnd={() =>
						setIsWeekCalendarScrolling(false)
					}
				/>

				<FlashList
					ref={flashListRef}
					data={memoizedClasses}
					stickyHeaderHiddenOnScroll
					renderItem={renderItem}
					getItemType={getItemType}
					keyExtractor={(_, index) => index.toString()}
					stickyHeaderIndices={stickyHeaderIndices}
					onMomentumScrollBegin={() => setIsScrolling(true)}
					onMomentumScrollEnd={() => setIsScrolling(false)}
					onViewableItemsChanged={onViewableItemsChanged}
					viewabilityConfig={{ itemVisiblePercentThreshold: 100 }}
					estimatedItemSize={AGENDA_ITEM_HEIGHT}
					// eslint-disable-next-line @typescript-eslint/no-shadow
					overrideItemLayout={layout => {
						// eslint-disable-next-line no-param-reassign
						layout.size = AGENDA_ITEM_HEIGHT; // Set a fixed height for each item
					}}
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

			{currentDate !== TODAYS_DATE && (
				<TouchableOpacity
					disabled={isScrolling}
					onPress={() => {
						setIsWeekCalendarScrolling(true);
						handleDateChange(TODAYS_DATE);
					}}
					style={[
						isScrolling && styles.opacified,
						styles.floatingActionBtn,
					]}
				>
					<Text size="sm" bold color="brand">
						Today
					</Text>
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
	section: {
		height: AGENDA_ITEM_HEIGHT,
		justifyContent: 'flex-end',
		backgroundColor: 'white',
		paddingLeft: config.metrics.md,
		paddingBottom: config.metrics.lg,
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
