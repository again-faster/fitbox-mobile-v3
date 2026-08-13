const queryKeys = {
	attendanceReport: (userId: number, teamId: number) =>
		['attendance-report', userId, teamId] as const,
	announcements: (userId: number, teamId: number) =>
		['announcements', userId, teamId] as const,
	classFilters: (teamId: number) => ['class-filters', teamId] as const,
	failedPayments: (userId: number, teamId: number) =>
		['failed-payments', userId, teamId] as const,
	gymInfo: (userId: number, teamId: number) =>
		['gym-info', userId, teamId] as const,
	gymVenues: (teamId: number) => ['gym-venues', teamId] as const,
	upcomingBookings: (userId: number, teamId: number) =>
		['upcoming-bookings', userId, teamId] as const,
	workouts: (teamId: number) => ['workouts', teamId] as const,
	switchableUsers: (userId: number, isParent: boolean) =>
		['switchable-users', userId, isParent ? 'children' : 'parent'] as const,
};

export default queryKeys;
