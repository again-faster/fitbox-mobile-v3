import { GymClassType, GymVenueType } from '@/types/schemas/gym';
import {
	ClassFiltersDataType,
	SessionSectionSchemaType,
	WorkoutSchemaType,
} from '@/types/schemas/session';
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
	waitlistTime?: number | null;
	waitlistBtn?: boolean;
	spotsLeft?: number | null;
	eventId?: number;
	classId?: number;
	venueId?: number;
	isCoach?: boolean;
	color?: string;
	buyNow?: boolean;
};

type ClassItem = {
	title: string; // date
	data: ClassItemData[];
	fetchedAt: string;
};

type VenueFilter = GymVenueType & { is_selected: boolean };
type ClassFilter = GymClassType & { is_selected: boolean };
interface SessionStateInterface {
	classes: ClassItem[];
	venueFilters: VenueFilter[];
	classFilters: ClassFilter[];
	activeMonth: string;
	headerTitle: string | null;
	defaultClassFilter: ClassFiltersDataType | null;
	hasPlaceholder: boolean;
	venueFiltersToApply: VenueFilter[];
	classFiltersToApply: ClassFilter[];
	benchmarks: WorkoutSchemaType[];
	favorites: WorkoutSchemaType[];
	sections: SessionSectionSchemaType[];
	scoringBottomSheet: boolean;
}

interface SessionInterface extends SessionStateInterface {
	setWorkoutData: (data: {
		benchmark: WorkoutSchemaType[];
		favorite: WorkoutSchemaType[];
	}) => void;
	// add nullable date to track last fetched date
	setClasses: (
		date: string,
		data: ClassItemData[],
		lastFetched: string,
	) => void;
	getClassesByDate: (date: string, userId: number, refresh?: boolean) => void;
	clearClasses: () => void;
	setActiveMonth: (date: string) => void;
	setVenueFilters: (data: VenueFilter[]) => void;
	setClassFilters: (data: ClassFilter[]) => void;
	setVenueFiltersToApply: (data: VenueFilter[]) => void;
	setClassFiltersToApply: (data: ClassFilter[]) => void;
	clearFilters: (filterType?: FilterTypeEnum) => void;
	setHeaderTitle: (title: string) => void;
	setDefaultClassFilter: (data: ClassFiltersDataType) => void;
	setHasPlaceholder: (value: boolean) => void;
	bookButtonCallback: () => void;
	setBookButtonCallback: (callback: () => void) => void;
	isAttendingCallback: (value: boolean) => void;
	setIsAttendingCallback: (callback: (value: boolean) => void) => void;
	toLeaderboardsCallback: () => void;
	setToLeaderboardsCallback: (callback: () => void) => void;
	setSections: (data: SessionSectionSchemaType[]) => void;
	setScoringBottomSheet: (data: boolean) => void;
}

export type {
	ClassFilter,
	ClassItem,
	ClassItemData,
	SessionStateInterface,
	VenueFilter,
};
export default SessionInterface;
