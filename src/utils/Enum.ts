enum ModalEnum {
	CALENDAR_FILTER = 'calendarFilterModal',
	NEW_MODAL = 'newModal',
	CLASS_FILTER = 'classFilterModal',
	VENUE_FILTER = 'venueFilterModal',
	// add more modal names here
}

enum FilterTypeEnum {
	CLASS = 'class',
	VENUE = 'venue',
}

enum SessionTabsEnum {
	INFO = 'info',
	SECTIONS = 'sections',
	RESULTS = 'results',
	ATTENDANCE = 'attendance',
}

enum TeamAvatarSize {
	sm = 35,
	md = 74,
	lg = 100,
}

enum VisibilityOptions {
	FULL = 0,
	LIMITED = 1,
	SUBSCRIBED = 2,
}

enum PaymentGateways {
	CASH = 'cash',
	BANK_TRANSFER = 'bank_transfer',
}

export {
	FilterTypeEnum,
	SessionTabsEnum,
	ModalEnum,
	PaymentGateways,
	TeamAvatarSize,
	VisibilityOptions,
};
