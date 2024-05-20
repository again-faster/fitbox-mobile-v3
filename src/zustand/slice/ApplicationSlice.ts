import type { StateCreator } from 'zustand';

import type ApplicationSlice from '../interface/ApplicationInterface';
import { ApplicationStateInterface } from '../interface/ApplicationInterface';

const defaultState: ApplicationStateInterface = {
	teamId: 0,
	shopUrl: '',
	logo: '',
	unreadMessages: 0,
	allowLeaderboards: false,
	allowComments: false,
	appForceUpdate: false,
	emptyRequiredFields: [],
	fromAcceptInvite: false,
	setupSubscriptionId: null,
	user: null,
};

const createApplicationSlice: StateCreator<
	ApplicationSlice,
	[],
	[],
	ApplicationSlice
> = (setState, getState) => ({
	...defaultState,

	setAppState: (key: string, value: unknown) => {
		const prevState = getState();

		setState({
			...prevState,
			[key]: value,
		});
	},

	clearAppState: () => {
		setState(defaultState);
	},
});

export default createApplicationSlice;
