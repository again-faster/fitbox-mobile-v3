import { getScheduleList } from '@/services/session';
import { Func } from '@/utils';
import { FilterTypeEnum, VisibilityOptions } from '@/utils/Enum';
import { produce } from 'immer';
import moment from 'moment';
import type { StateCreator } from 'zustand';
import type SessionInterface from '../interface/SessionInterface';

const createSessionSlice: StateCreator<
	SessionInterface,
	[],
	[],
	SessionInterface
> = (setState, getState) => ({
	activeMonth: moment().format('YYYY-MM-DD'),
	classes: [],
	venueFilters: [],
	classFilters: [],
	headerTitle: null,
	defaultClassFilter: null,
	hasPlaceholder: false,

	setDefaultClassFilter: data => {
		setState({ defaultClassFilter: data });
	},

	setHeaderTitle(title) {
		setState({ headerTitle: title });
	},

	setActiveMonth: date => {
		setState({ activeMonth: date });
	},

	setClasses: (date, data) => {
		// prepare new class item
		const newClassItem = {
			title: date,
			data,
		};

		// get classes from state
		const { classes } = getState();

		// find index of key
		const index = classes.findIndex(item => item.title === date);

		// if index found
		if (index !== -1) {
			// update state
			setState({
				classes: produce(classes, draft => {
					draft[index] = newClassItem;
				}),
			});
		} else {
			// Add the new class item
			const updatedClasses = [...classes, newClassItem];

			// Sort the classes by date in descending order
			updatedClasses.sort((a, b) =>
				moment(a.title).diff(moment(b.title)),
			);

			// Update the state with the sorted classes
			setState({
				classes: updatedClasses,
			});
		}
	},

	getClassesByDate: (date, userId, force = false) => {
		// Define initial state and functions here or outside the store
		const { classes, setClasses } = getState();
		const hasData = classes.find(
			item => item.title === date && !item.data[0]?.isLoading,
		);
		if (hasData && !force) {
			return;
		}

		// Add loading state
		setClasses(date, [{ isLoading: true }]);

		getScheduleList(date, date)
			.then(res => {
				if (!res.error) {
					const classesData = res.data.map(item => {
						// Get duration
						const duration = `${Func.getDuration(
							item.local_start,
							item.local_end,
						)} min(s)`;

						// Check if schedule is hidden
						const hideSchedule = Func.isSessionVisible(
							item.bookable,
							item.fb_class?.class_visibility ||
								item.class?.class_visibility,
							VisibilityOptions.SUBSCRIBED,
						);

						// Is booking locked
						const isBookingLocked = Func.checkSessionLock(
							item.local_start,
							item.booking_HH,
							item.booking_MM,
						);

						// Get spots left
						const spotsLeft = item.class
							? Func.getSpotLeft(
									item.attendance_limit as number,
									item.member_attendance?.length as number,
							  )
							: null;

						// Waitlist button
						const waitlistBtn =
							!!item.waitlist.enable_waitlist &&
							moment(item.local_start).diff(moment(), 'minutes') >
								Number(item.waitlist.waitlist_timelimit) * 60;

						// isAttending
						const isAttending = item?.member_attendance?.some(
							m => m.user_id === userId,
						);

						// isWaitlisted
						const isWaitlisted = item.member_waitlist.some(
							w =>
								w.calendar_event_id === item.id &&
								w.user_id === userId,
						);

						// return data
						return {
							start: moment(item.local_start).format('H:mm'),
							isSubscribed: Func.checkSubscription(item.bookable),
							location: item.venue_id ? item.venue : undefined,
							venueId: Number(item.venue_id),
							waitlistTime: item.waitlist.waitlist_timelimit,
							startDate: item.local_start,
							color: item.class.class_colour_hex,
							classId: item.class.id,
							eventId: item.event_id,
							isCoach: item.isCoach,
							title: item.title,
							isBookingLocked,
							hideSchedule,
							isWaitlisted,
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
				// eslint-disable-next-line no-console
				console.log('getClassesByDate', err);
			});
	},

	clearClasses: () => {
		setState({ classes: [], hasPlaceholder: false });
	},

	setVenueFilters: data => {
		setState({ venueFilters: data });
	},

	setClassFilters: data => {
		setState({ classFilters: data });
	},

	clearFilters: filterType => {
		// cleared filters
		const clearedClassFilters = getState().classFilters.map(item => ({
			...item,
			is_selected: false,
		}));
		const clearedVenueFilters = getState().venueFilters.map(item => ({
			...item,
			is_selected: false,
		}));

		if (filterType === FilterTypeEnum.VENUE) {
			setState({ venueFilters: clearedVenueFilters });
		} else if (filterType === FilterTypeEnum.CLASS) {
			setState({ classFilters: clearedClassFilters });
		} else {
			setState({
				venueFilters: clearedVenueFilters,
				classFilters: clearedClassFilters,
			});
		}
	},

	setHasPlaceholder: value => {
		setState({ hasPlaceholder: value });
	},
});

export default createSessionSlice;
