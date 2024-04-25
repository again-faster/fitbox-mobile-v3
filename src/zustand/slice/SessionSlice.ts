import { produce } from 'immer';
import moment from 'moment';
import type { StateCreator } from 'zustand';
import type SessionInterface from '../interface/SessionInterface';
import { ClassItemData } from '../interface/SessionInterface';

const createSessionSlice: StateCreator<
	SessionInterface,
	[],
	[],
	SessionInterface
> = (setState, getState) => ({
	activeMonth: moment().format('YYYY-MM-DD'),
	classes: [],

	setActiveMonth: (date: string) => {
		setState({ activeMonth: date });
	},

	setClasses: (date: string, data: ClassItemData[]) => {
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
});

export default createSessionSlice;
