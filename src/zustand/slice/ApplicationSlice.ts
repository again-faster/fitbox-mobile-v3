import type { StateCreator } from 'zustand';

import { AttendanceReportDataType } from '@/types/schemas/leaderboards';
import { AnimationObject } from 'lottie-react-native';
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
	message: '',
	subject: '',
	lastRxValue: false,
	showConfetti: false,
	attachedFiles: [],
	notifications: [],
	showModalNotification: false,
	pushToken: '',
	notifSettings: { enabled: false, settings: {} },
	unreadMessageCallback: () => {},
	attendanceReportState: {} as AttendanceReportDataType,
	classFiltersDataState: [],
	upcomingSessionsState: [],
	countryCode: '',
	randomAnimation: { uri: {} as AnimationObject, index: 0 },
	joiningOtherGym: false,
	inboxTeamId: 0,
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
