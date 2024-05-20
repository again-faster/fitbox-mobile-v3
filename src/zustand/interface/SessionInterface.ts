import { GymClassType, GymVenueType } from '@/types/schemas/gym';
import { FilterTypeEnum } from '@/utils/Enum';

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
	venueId?: number;
	isCoach?: boolean;
};

type ClassItem = {
	title: string; // date
	data: ClassItemData[];
};

type VenueFilter = GymVenueType & { is_selected: boolean };
type ClassFilter = GymClassType & { is_selected: boolean };
interface SessionStateInterface {
	classes: ClassItem[];
	venueFilters: VenueFilter[];
	classFilters: ClassFilter[];
	activeMonth: string;
}

interface SessionInterface extends SessionStateInterface {
	setClasses: (date: string, data: ClassItemData[]) => void;
	clearClasses: () => void;
	setActiveMonth: (date: string) => void;
	setVenueFilters: (data: VenueFilter[]) => void;
	setClassFilters: (data: ClassFilter[]) => void;
	clearFilters: (filterType?: FilterTypeEnum) => void;
}

export type {
	ClassFilter,
	ClassItem,
	ClassItemData,
	SessionStateInterface,
	VenueFilter,
};
export default SessionInterface;
