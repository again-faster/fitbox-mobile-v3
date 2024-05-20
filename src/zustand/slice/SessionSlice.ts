import { FilterTypeEnum } from '@/utils/Enum';
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
			// get last class
			const lastClass = classes[classes.length - 1];

			if (moment(date).isAfter(moment(lastClass?.title))) {
				// add new data
				setState({
					classes: [...classes, newClassItem],
				});
			} else {
				// add new data
				setState({
					classes: [newClassItem, ...classes],
				});
			}
		}
	},

	clearClasses: () => {
		setState({ classes: [] });
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
});

export default createSessionSlice;
