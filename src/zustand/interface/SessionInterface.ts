type ClassItemData = {
	title?: string;
	location?: string;
	start?: string;
	duration?: string;
	isLoading?: boolean;
	isSubscribed?: boolean;
	hideSchedule?: boolean;
	startDate?: string;
	isBookingLocked?: boolean;
	isAttending?: boolean;
	isWaitlisted?: boolean;
	waitlistBtn?: boolean;
	spotsLeft?: number | null;
	eventId?: number;
	classId?: number;
};

type ClassItem = {
	title: string; // date
	data: ClassItemData[];
};

interface SessionStateInterface {
	classes: ClassItem[];
	activeMonth: string;
}

interface SessionInterface extends SessionStateInterface {
	setClasses: (date: string, data: ClassItemData[]) => void;
	setActiveMonth: (date: string) => void;
}

export type { ClassItem, ClassItemData, SessionStateInterface };
export default SessionInterface;
