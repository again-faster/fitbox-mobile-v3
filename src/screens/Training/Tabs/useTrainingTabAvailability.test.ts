import {
	ALL_MEMBER_FEATURES_ENABLED,
	ALL_MEMBER_FEATURES_DISABLED,
} from '@/services/workoutStudio/memberFeatures';
import {
	buildTrainingTabAvailability,
	createEmptyTabPresence,
	type TabPresence,
} from './useTrainingTabAvailability';

const errorReadiness = { status: 'error' as const };

describe('buildTrainingTabAvailability', () => {
	it('does not mark Progress available when enabled queries return no rows', () => {
		const result = buildTrainingTabAvailability(
			{ ...ALL_MEMBER_FEATURES_DISABLED, progress: true },
			{ ...createEmptyTabPresence(), progressRows: 0 },
			errorReadiness,
			2,
		);

		expect(result.visibleTabs).not.toContain('progress');
		expect(result.visibleTabs).toContain('more');
	});

	it('marks Progress available when an enabled child has content', () => {
		const result = buildTrainingTabAvailability(
			{ ...ALL_MEMBER_FEATURES_DISABLED, prs: true },
			{ ...createEmptyTabPresence(), rmRows: 1 },
			errorReadiness,
			0,
		);

		expect(result.visibleTabs).toEqual(['today', 'progress']);
	});

	it('does not expose Readiness for baseline or error data', () => {
		const baseline = buildTrainingTabAvailability(
			ALL_MEMBER_FEATURES_ENABLED,
			createEmptyTabPresence(),
			{ status: 'baseline' },
			0,
		);
		const error = buildTrainingTabAvailability(
			ALL_MEMBER_FEATURES_ENABLED,
			createEmptyTabPresence(),
			errorReadiness,
			0,
		);

		expect(baseline.visibleTabs).not.toContain('readiness');
		expect(error.visibleTabs).not.toContain('readiness');
	});

	it('shows Wellness for an enabled health action', () => {
		const result = buildTrainingTabAvailability(
			{ ...ALL_MEMBER_FEATURES_DISABLED, pain_reports: true },
			{ ...createEmptyTabPresence(), healthActionAvailable: true },
			errorReadiness,
			0,
		);

		expect(result.visibleTabs).toEqual(['today', 'wellness']);
	});

	it('keeps Today and independent More content when an optional query fails', () => {
		const presence: TabPresence = {
			...createEmptyTabPresence(),
			optionalQueryFailed: true,
		};
		const result = buildTrainingTabAvailability(
			ALL_MEMBER_FEATURES_ENABLED,
			presence,
			errorReadiness,
			2,
		);

		expect(result.visibleTabs).toEqual(['today', 'more']);
	});
});
