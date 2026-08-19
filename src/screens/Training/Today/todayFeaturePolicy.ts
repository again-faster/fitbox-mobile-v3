import type { MemberFeatureMap } from '@/services/workoutStudio/memberFeatures';

export const shouldShowTodayWellness = (features: MemberFeatureMap) =>
	features.wellness;

export const shouldShowTodayWearables = (features: MemberFeatureMap) =>
	features.wearables;

export const shouldShowTodayPRs = (features: MemberFeatureMap) => features.prs;

export const shouldShowTodayCoachNotes = (features: MemberFeatureMap) =>
	features.coach_notes;

export const shouldShowTodayCustomWorkouts = (
	features: MemberFeatureMap,
	isSolo: boolean,
	hasEntitlement: boolean,
) => isSolo || features.custom_workouts || hasEntitlement;
