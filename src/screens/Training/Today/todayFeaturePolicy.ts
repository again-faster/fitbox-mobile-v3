import type { MemberFeatureMap } from '@/services/workoutStudio/memberFeatures';

export type AutoWellnessPromptInput = {
	wellnessEnabled: boolean;
	hasWellnessToday: boolean;
	promptsEnabled: boolean;
	dismissedDate: string | null;
	today: string;
};

export const shouldAutoPromptWellness = ({
	wellnessEnabled,
	hasWellnessToday,
	promptsEnabled,
	dismissedDate,
	today,
}: AutoWellnessPromptInput) =>
	wellnessEnabled &&
	!hasWellnessToday &&
	promptsEnabled &&
	dismissedDate !== today;

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
