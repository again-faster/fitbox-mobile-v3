export type BookingTab = 'pt' | 'treatment' | 'resource' | 'mine';

export type BookingFeatureFlags = {
	bookings: boolean;
	myBookings: boolean;
};

export const availableBookingTabs = ({
	bookings,
	myBookings,
}: BookingFeatureFlags): BookingTab[] => [
	...(bookings ? (['pt', 'treatment', 'resource'] as const) : []),
	...(myBookings ? (['mine'] as const) : []),
];

export const canRescheduleBooking = ({
	bookings,
}: BookingFeatureFlags): boolean => bookings;

export default availableBookingTabs;
