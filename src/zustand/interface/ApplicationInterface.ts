import { UserSchemaType } from '@/types/schemas/user';

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
	user: UserSchemaType | null;
}

interface ApplicationInterface extends ApplicationStateInterface {
	setAppState: (key: keyof ApplicationStateInterface, value: unknown) => void;
	clearAppState: () => void;
}

export type { ApplicationStateInterface };
export default ApplicationInterface;
