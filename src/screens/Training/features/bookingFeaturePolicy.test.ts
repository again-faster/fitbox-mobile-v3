import {
	availableBookingTabs,
	canRescheduleBooking,
} from './bookingFeaturePolicy';

describe('booking feature policy', () => {
	it('only exposes history when member bookings are disabled', () => {
		expect(
			availableBookingTabs({ bookings: false, myBookings: true }),
		).toEqual(['mine']);
	});

	it('exposes service tabs when booking is enabled without history', () => {
		expect(
			availableBookingTabs({ bookings: true, myBookings: false }),
		).toEqual(['pt', 'treatment', 'resource']);
	});

	it('hides every tab when both booking features are disabled', () => {
		expect(
			availableBookingTabs({ bookings: false, myBookings: false }),
		).toEqual([]);
	});

	it('exposes all tabs when both booking features are enabled', () => {
		expect(
			availableBookingTabs({ bookings: true, myBookings: true }),
		).toEqual(['pt', 'treatment', 'resource', 'mine']);
	});

	it('does not permit rescheduling without the bookings feature', () => {
		expect(
			canRescheduleBooking({ bookings: false, myBookings: true }),
		).toBe(false);
		expect(canRescheduleBooking({ bookings: true, myBookings: true })).toBe(
			true,
		);
	});
});
