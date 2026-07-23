import moment from 'moment';

const trainingDateFormat = 'YYYY-MM-DD';

export const normalizeTrainingDate = (value: string): string | null => {
	const parsed = moment(value, trainingDateFormat, true);
	return parsed.isValid() ? parsed.format(trainingDateFormat) : null;
};

export const trainingDayTitle = (value: string): string => {
	const date = normalizeTrainingDate(value);
	if (!date) return 'Training';
	if (moment(date).isSame(moment(), 'day')) return "Today's Training";
	if (moment(date).isSame(moment().add(1, 'day'), 'day')) {
		return "Tomorrow's Training";
	}
	return moment(date).format('dddd, D MMMM');
};
