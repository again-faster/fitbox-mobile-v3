import type { StackScreenProps } from '@react-navigation/stack';

export type ApplicationStackParamList = {
	Example: undefined;
	Main: undefined;
	Startup: undefined;
	Auth: undefined;
	Landing: undefined;
	Login: undefined;
	ResetPassword: undefined;
	SignUp: undefined;
	Invite: undefined;
};
export type ApplicationScreenProps =
	StackScreenProps<ApplicationStackParamList>;

export type MenuStackParamList = {
	Menu: undefined;
	ProfileMenu: undefined;
	GymSelect: undefined;
	Performance: undefined;
	Notifications: undefined;
	AboutUs: undefined;
	Waivers: undefined;
	Help: undefined;
};
export type MenuStackNavigatorProps = StackScreenProps<MenuStackParamList>;

export type MainTabParamList = {
	Dashboard: undefined;
	Calendar: undefined;
	Inbox: undefined;
	MenuTab: undefined;
};
export type MainTabScreenProps = StackScreenProps<
	MainTabParamList & ApplicationStackParamList & MenuStackParamList
>;
