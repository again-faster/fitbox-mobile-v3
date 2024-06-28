import type { StackScreenProps } from '@react-navigation/stack';
import { ContactMembersType, MessageItemType } from './schemas/message';
import { SessionDetailSchemaType } from './schemas/session';

export type SessionParams = {
	id: number;
	title: string;
	waitlistTime: number;
	waitlistEnabled: boolean;
};

export type ComposeParams = {
	contacts: ContactMembersType[];
};

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
	Session: SessionParams;
	BillingAgreement: undefined;
	GymWaiver: undefined;
	PDFViewer: PDFViewerScreenParams;
	SwitchUser: undefined;
	AddAttendance: AddAttendanceParams;
	Webview: WebViewParams;
	HealthCapture: HealthCaptureParams;
};
export type ApplicationScreenProps =
	StackScreenProps<ApplicationStackParamList>;

export type ComposeScreenProps = StackScreenProps<
	ComposeStackParamsList & InboxParamList
>;

export type ComposeStackParamsList = {
	Compose: ComposeParams;
	Contacts: undefined;
};

export type PDFViewerScreenParams = {
	title: string;
	waiverUrl: string;
};

export type AddAttendanceProps = StackScreenProps<
	AddAttendanceParams & ApplicationStackParamList
>;

export type AddAttendanceParams = {
	session: SessionDetailSchemaType;
};

export type WebViewParams = {
	title: string;
	content: string;
};

export type SubscriptionDetailsParams = {
	id: number;
	type: string;
};

export type SubscriptionSetupParams = {
	fromSubscription?: boolean;
};

export type HealthCaptureParams = {
	fromMenu?: boolean;
};

export type MenuStackParamList = {
	Menu: undefined;
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
	HealthCapture: HealthCaptureParams;
};
export type MenuStackNavigatorProps = StackScreenProps<MenuStackParamList>;

export type InboxParamList = {
	Inbox: undefined;
	Conversation: ConversationParams;
	ComposeStack: undefined;
};

export type ConversationParams = {
	conversation: MessageItemType;
	index: number;
};

export type InboxScreenProps = StackScreenProps<InboxParamList>;

export type MainTabParamList = {
	Dashboard: undefined;
	Calendar: undefined;
	InboxStack: undefined;
	Shop: undefined;
	MenuTab: undefined;
};
export type MainTabScreenProps = StackScreenProps<
	MainTabParamList & ApplicationStackParamList & MenuStackParamList
>;
