import { ALL_MEMBER_FEATURES_DISABLED } from '@/services/workoutStudio/memberFeatures';
import { wellbeingPolicy } from './wellnessFeaturePolicy';

describe('wellbeing feature policy', () => {
	it('keeps pain reports independent when only pain reports are enabled', () => {
		const policy = wellbeingPolicy({
			...ALL_MEMBER_FEATURES_DISABLED,
			pain_reports: true,
		});

		expect(policy).toEqual({
			showWellness: false,
			showPainReports: true,
			showWearables: false,
			maySyncQueuedWellness: false,
		});
	});

	it('allows wellness queue synchronization when wellness is enabled', () => {
		const policy = wellbeingPolicy({
			...ALL_MEMBER_FEATURES_DISABLED,
			wellness: true,
		});

		expect(policy.showWellness).toBe(true);
		expect(policy.maySyncQueuedWellness).toBe(true);
		expect(policy.showPainReports).toBe(false);
	});

	it('keeps wearables independent when only wearables are enabled', () => {
		const policy = wellbeingPolicy({
			...ALL_MEMBER_FEATURES_DISABLED,
			wearables: true,
		});

		expect(policy).toEqual({
			showWellness: false,
			showPainReports: false,
			showWearables: true,
			maySyncQueuedWellness: false,
		});
	});
});
