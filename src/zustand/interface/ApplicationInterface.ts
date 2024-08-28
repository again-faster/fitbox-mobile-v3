import { NotificationsType } from '@/types/schemas/notifications';

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
