import type { StackScreenProps } from '@react-navigation/stack';
import { ContactMembersType, MessageItemType } from './schemas/message';
import {
	FailedInvoicesType,
	InsufficientFundsInvoicesType,
	InvoicesType,
} from './schemas/payment';
import {
	SessionDetailSchemaType,
	SessionSectionSchemaType,
	WorkoutSchemaType,
} from './schemas/session';

export type SessionParams = {
	id: number;
	title: string;
	waitlistTime: number;
	waitlistEnabled: boolean;
};

export type ComposeParams = {
	contacts: ContactMembersType[];
};

export type LoginParams = {
	emailFromSignin?: string;
};

export type ApplicationStackParamList = {
	Example: undefined;
	Main: undefined;
	Startup: undefined;
	Auth: undefined;
	Landing: undefined;
	Login: LoginParams;
	ResetPassword: undefined;
	SignUp: SignUpParams;
	Invite: InviteParams | undefined;
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
	SubscriptionSetup: SubscriptionSetupParams;
	PaymentSetup: PaymentInformationParams;
	Scoring: ScoringParams;
	ScoreComments: ScoreCommentsParams;
	PaymentInformationModal: PaymentInformationParams;
	BuyNow: SubscriptionSetupParams;
	ResultTypesModal: undefined;
	MovementHistory: MovementHistoryParams;
	MyDetails: MyDetailsParams;
	Subscription: SubscriptionParams;
	SubscriptionDetails: SubscriptionDetailsParams;
	WorkoutHistory: WorkoutHistoryParams;
};
export type ApplicationScreenProps =
	StackScreenProps<ApplicationStackParamList>;

export type SignUpParams = {
	gymCode?: string;
};

export type InviteParams = {
	inviteCode?: string;
};

export type ComposeScreenProps = StackScreenProps<
	ComposeStackParamsList & InboxParamList
>;

export type ComposeStackParamsList = {
	Compose: ComposeParams;
	Contacts: undefined;
	BrowseMedia: undefined;
	Camera: undefined;
	fitboxGallery: undefined;
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
	title?: string;
	content?: string;
	uri?: string;
};

export type ScoringParams = {
	section: SessionSectionSchemaType;
	sessionId: number;
};

export type SubscriptionDetailsParams = {
	id: number;
	type: string;
};

export type SubscriptionSetupParams = {
	fromSubscription?: boolean;
	setupSubscription?: boolean;
	sessionId?: number;
	sessionDate?: string;
	onSuccessPurchase?: () => void;
};

export type HealthCaptureParams = {
	fromMenu?: boolean;
	fromAttendance?: boolean;
	updateAttendanceProfile?: (toUpdate?: boolean) => void;
};

export type MyDetailsParams = {
	fromAttendance?: boolean;
	updateAttendanceProfile?: (toUpdate?: boolean) => void;
};

export type SubscriptionParams = {
	fromAttendance?: boolean;
	updateAttendanceProfile?: (toUpdate?: boolean) => void;
};

export type MenuStackParamList = {
	Menu: undefined;
	GymSelect: undefined;
	Performance: undefined;
	Notifications: undefined;
	AboutUs: undefined;
	Waivers: undefined;
	Help: undefined;
	MyDetails: MyDetailsParams;
	Subscription: SubscriptionParams;
	SubscriptionDetails: SubscriptionDetailsParams;
	SubscriptionSetup: SubscriptionSetupParams;
	PaymentInformation: undefined;
	PaymentUpdate: undefined;
	StripeSuccess: undefined;
	AcceptedWaivers: undefined;
	PDFViewerScreen: PDFViewerScreenParams;
	HelpScreen: undefined;
	HealthCapture: HealthCaptureParams;
	PerformanceSummary: undefined;
};
export type MenuStackNavigatorProps = StackScreenProps<MenuStackParamList>;

export type InboxParamList = {
	Inbox: undefined;
	Conversation: ConversationParams;
	ComposeStack: undefined;
	BrowseMedia: undefined;
	fitboxGallery: undefined;
	Camera: undefined;
};

export type DashboardParamList = {
	Dashboard: undefined;
	ClassResults: ClassResultsParams;
	ScoreComments: ScoreCommentsParams;
	Bookings: undefined;
	FailedInvoices: FailedInvoicesParams;
	FailedInvoicesDetails: FailedInvoicesDetailsParams;
	Attendance: undefined;
};

export type ClassResultsParams = {
	selectClass?: number;
	dateFromParams?: string;
};

export type FailedInvoicesParams = {
	failedInvoices: FailedInvoicesType;
};

export type FailedInvoicesDetailsParams = {
	charges: InsufficientFundsInvoicesType[];
	item: InvoicesType;
};

export type ScoreCommentsParams = {
	score_id: number;
	type: string;
	showComments: boolean;
};

export type PaymentInformationParams = {
	onSuccessCallback?: () => void;
	setup?: boolean;
};

export type DashboardStackNavigatorProps = StackScreenProps<DashboardParamList>;

export type ConversationParams = {
	conversation: MessageItemType;
	index?: number | boolean;
	switchToGym?: unknown;
};

export type InboxScreenProps = StackScreenProps<InboxParamList>;

export type MainTabParamList = {
	DashboardStack: undefined;
	Calendar: undefined;
	InboxStack: undefined;
	Shop: undefined;
	MenuTab: undefined;
};
export type MainTabScreenProps = StackScreenProps<
	MainTabParamList & ApplicationStackParamList & MenuStackParamList
>;

export type MovementHistoryParams = {
	movementId: number;
	name: string;
	addResult?: boolean;
};

export type WorkoutHistoryParams = {
	data: WorkoutSchemaType;
	addResult?: boolean;
};

export type PerformanceSummaryParamList = {
	PastPerformance: undefined;
	MovementHistory: MovementHistoryParams;
	WorkoutHistory: WorkoutHistoryParams;
};

export type PerformanceSummaryScreenProps = StackScreenProps<
	PerformanceSummaryParamList & ApplicationStackParamList
>;
