import {
	fallbackTrainingTab,
	visibleTabsDuringLoading,
	tabRouteForKey,
	visibleTrainingTabs,
	type TrainingTabAvailabilityInput,
} from './trainingTabs';

const emptyAvailability: TrainingTabAvailabilityInput = {
	progressFeature: false,
	progressContent: false,
	wearablesFeature: false,
	readinessStatus: 'empty',
	wellnessFeature: false,
	painReportsFeature: false,
	healthActionAvailable: false,
	secondaryItemCount: 0,
};

describe('visibleTrainingTabs', () => {
	it('always includes Today', () => {
		expect(visibleTrainingTabs(emptyAvailability)).toEqual(['today']);
	});

	it('shows Progress only when a progress feature and content are present', () => {
		expect(
			visibleTrainingTabs({
				...emptyAvailability,
				progressFeature: true,
				progressContent: false,
			}),
		).toEqual(['today']);
		expect(
			visibleTrainingTabs({
				...emptyAvailability,
				progressFeature: true,
				progressContent: true,
			}),
		).toContain('progress');
	});

	it('shows Readiness only for real provider-backed data', () => {
		expect(
			visibleTrainingTabs({
				...emptyAvailability,
				wearablesFeature: true,
				readinessStatus: 'baseline',
			}),
		).not.toContain('readiness');
		expect(
			visibleTrainingTabs({
				...emptyAvailability,
				wearablesFeature: true,
				readinessStatus: 'ready',
			}),
		).toContain('readiness');
	});

	it('shows Wellness when either enabled module has an action', () => {
		expect(
			visibleTrainingTabs({
				...emptyAvailability,
				wellnessFeature: true,
				healthActionAvailable: true,
			}),
		).toContain('wellness');
		expect(
			visibleTrainingTabs({
				...emptyAvailability,
				painReportsFeature: true,
				healthActionAvailable: true,
			}),
		).toContain('wellness');
		expect(
			visibleTrainingTabs({
				...emptyAvailability,
				wellnessFeature: true,
				healthActionAvailable: false,
			}),
		).not.toContain('wellness');
	});

	it('shows More only when secondary items remain', () => {
		expect(
			visibleTrainingTabs({
				...emptyAvailability,
				secondaryItemCount: 0,
			}),
		).toEqual(['today']);
		expect(
			visibleTrainingTabs({
				...emptyAvailability,
				secondaryItemCount: 2,
			}),
		).toEqual(['today', 'more']);
	});
});

describe('fallbackTrainingTab', () => {
	it('returns Today when the selected tab is no longer visible', () => {
		expect(fallbackTrainingTab('progress', ['today', 'more'])).toBe(
			'today',
		);
	});

	it('preserves a selected visible tab', () => {
		expect(fallbackTrainingTab('progress', ['today', 'progress'])).toBe(
			'progress',
		);
	});
});

describe('visibleTabsDuringLoading', () => {
	it('keeps the selected tab visible while availability queries refresh', () => {
		expect(visibleTabsDuringLoading(['today', 'more'], 'progress')).toEqual(
			['today', 'more', 'progress'],
		);
	});

	it('does not duplicate a tab that is already visible', () => {
		expect(
			visibleTabsDuringLoading(['today', 'progress'], 'progress'),
		).toEqual(['today', 'progress']);
	});
});

describe('tabRouteForKey', () => {
	it('maps each primary tab to its stack destination', () => {
		expect(tabRouteForKey('today')).toBe('TrainingToday');
		expect(tabRouteForKey('progress')).toBe('TrainingProgress');
		expect(tabRouteForKey('readiness')).toBe('TrainingWearables');
		expect(tabRouteForKey('wellness')).toBe('TrainingWellnessHub');
		expect(tabRouteForKey('more')).toBe('TrainingMore');
	});
});
