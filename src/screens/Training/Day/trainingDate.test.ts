import { normalizeTrainingDate, trainingDayTitle } from './trainingDate';

describe('training date helpers', () => {
	beforeAll(() => {
		jest.useFakeTimers().setSystemTime(new Date('2026-07-19T02:00:00Z'));
	});

	afterAll(() => {
		jest.useRealTimers();
	});

	it('accepts only strict calendar dates', () => {
		expect(normalizeTrainingDate('2026-07-20')).toBe('2026-07-20');
		expect(normalizeTrainingDate('20-07-2026')).toBeNull();
		expect(normalizeTrainingDate('2026-02-30')).toBeNull();
	});

	it('labels today and tomorrow', () => {
		expect(trainingDayTitle('2026-07-19')).toBe("Today's Training");
		expect(trainingDayTitle('2026-07-20')).toBe("Tomorrow's Training");
	});

	it('formats other valid days', () => {
		expect(trainingDayTitle('2026-07-21')).toBe('Tuesday, 21 July');
	});

	it('falls back safely for an invalid date', () => {
		expect(trainingDayTitle('tomorrow')).toBe('Training');
	});
});
