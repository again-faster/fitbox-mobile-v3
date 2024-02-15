import type { StackScreenProps } from '@react-navigation/stack';

export type ApplicationStackParamList = {
	Example: undefined;
	Main: undefined;
	Startup: undefined;
	Auth: undefined;
	Landing: undefined;
	SignUp: undefined;
	Invite: undefined;
};

export type MainTabParamList = {
	Dashboard: undefined;
	Calendar: undefined;
	Inbox: undefined;
	Menu: undefined;
};

export type ApplicationScreenProps =
	StackScreenProps<ApplicationStackParamList>;

export type MainTabScreenProps = StackScreenProps<
	MainTabParamList & ApplicationStackParamList
>;
