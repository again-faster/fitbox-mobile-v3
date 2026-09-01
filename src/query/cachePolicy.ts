import moment from 'moment-timezone';

export const QUERY_STALE_TIME = {
	SHORT: 5 * 60 * 1000,
	STANDARD: 15 * 60 * 1000,
} as const;

export const QUERY_GC_TIME = 30 * 60 * 1000;

const FAILED_PAYMENTS_TIMEZONE = 'Australia/Brisbane';

export const getEmptyFailedPaymentsStaleTime = (dataUpdatedAt: number) => {
	const checkedAt = moment.tz(dataUpdatedAt, FAILED_PAYMENTS_TIMEZONE);
	const isUpdateWindow = checkedAt.hour() >= 10 && checkedAt.hour() < 12;

	if (isUpdateWindow) {
		return QUERY_STALE_TIME.SHORT;
	}

	const nextWindowStart = checkedAt.clone().startOf('day').hour(10);
	if (checkedAt.hour() >= 10) {
		nextWindowStart.add(1, 'day');
	}

	return Math.max(nextWindowStart.valueOf() - dataUpdatedAt, 0);
};
