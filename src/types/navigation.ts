import type { StackScreenProps } from '@react-navigation/stack';

export type ApplicationStackParamList = {
	Example: undefined;
	Main: undefined;
	Startup: undefined;
	Login: undefined;
};

export type MainTabParamList = {
	Dashboard: undefined;
	Calendar: undefined;
	Inbox: undefined;
	Menu: undefined;
};

export type ApplicationScreenProps =
	StackScreenProps<ApplicationStackParamList>;
