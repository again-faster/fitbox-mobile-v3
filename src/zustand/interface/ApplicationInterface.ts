import { BookedSessionCardProps } from '@/screens/Dashboard/components/BookedSessionCard';
import { AttendanceReportDataType } from '@/types/schemas/leaderboards';
import { NotificationsType } from '@/types/schemas/notifications';
import { ClassFiltersDataType } from '@/types/schemas/session';
import { AnimationObject } from 'lottie-react-native';

interface ApplicationStateInterface {
	appForceUpdate: boolean;
	allowLeaderboards: boolean;
	teamId: number;
	shopUrl: string;
	logo: string;
	unreadMessages: number;
	allowComments: boolean;
	emptyRequiredFields: string[];
	fromAcceptInvite: boolean;
	setupSubscriptionId: null | number;
	message: string;
	subject: string;
	lastRxValue: boolean; // is_rx_value
	showConfetti: boolean;
	attachedFiles: AttachedFilesInterface[];
	notifications: NotificationsType[];
	showModalNotification: boolean;
	pushToken: string;
	notifSettings: NotifSettingsInterface;
	unreadMessageCallback: () => void;
	attendanceReportState: AttendanceReportDataType;
	classFiltersDataState: ClassFiltersDataType[];
	upcomingSessionsState: BookedSessionCardProps[];
	countryCode: string;
	randomAnimation: { uri: AnimationObject; index: number };
	joiningOtherGym: boolean;
	inboxTeamId: number;
}

interface AttachedFilesInterface {
	fileName: string;
	base64?: string;
	from?: string;
	url?: string;
}

interface NotifSettingsInterface {
	enabled: boolean;
	settings: {
		[key: string]: boolean;
	};
}

interface ApplicationInterface extends ApplicationStateInterface {
	setAppState: (key: keyof ApplicationStateInterface, value: unknown) => void;
	clearAppState: () => void;
}

export type { ApplicationStateInterface };
export default ApplicationInterface;
