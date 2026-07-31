import type { MemberFeatureMap } from '@/services/workoutStudio/memberFeatures';

export type WellbeingFeaturePolicy = {
	showWellness: boolean;
	showPainReports: boolean;
	showWearables: boolean;
	maySyncQueuedWellness: boolean;
};

export const wellbeingPolicy = (
	features: MemberFeatureMap,
): WellbeingFeaturePolicy => ({
	showWellness: features.wellness,
	showPainReports: features.pain_reports,
	showWearables: features.wearables,
	maySyncQueuedWellness: features.wellness,
});

export default wellbeingPolicy;
