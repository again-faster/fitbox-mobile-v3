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
	Eula: undefined;
	SwitchGym: undefined;
	Session: undefined;
	BillingAgreement: undefined;
	GymWaiver: undefined;
	PDFViewer: PDFViewerScreenParams;
	SwitchUser: undefined;
};
export type ApplicationScreenProps =
	StackScreenProps<ApplicationStackParamList>;

export type PDFViewerScreenParams = {
	title: string;
	waiverUrl: string;
};

export type SubscriptionDetailsParams = {
	id: number;
	type: string;
};

export type SubscriptionSetupParams = {
	fromSubscription?: boolean;
};

export type MenuStackParamList = {
	Menu: undefined;
	ProfileMenu: undefined;
	GymSelect: undefined;
	Performance: undefined;
	Notifications: undefined;
	AboutUs: undefined;
	Waivers: undefined;
	Help: undefined;
	MyDetails: undefined;
	Subscription: undefined;
	SubscriptionDetails: SubscriptionDetailsParams;
	SubscriptionSetup: SubscriptionSetupParams;
	PaymentInformation: undefined;
	PaymentUpdate: undefined;
	StripeSuccess: undefined;
	AcceptedWaivers: undefined;
	PDFViewerScreen: PDFViewerScreenParams;
	HelpScreen: undefined;
};
export type MenuStackNavigatorProps = StackScreenProps<MenuStackParamList>;

export type MainTabParamList = {
	Dashboard: undefined;
	Calendar: undefined;
	Inbox: undefined;
	Shop: undefined;
	MenuTab: undefined;
};
export type MainTabScreenProps = StackScreenProps<
	MainTabParamList & ApplicationStackParamList & MenuStackParamList
>;
