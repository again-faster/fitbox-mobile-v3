import type { ReadinessResult } from "@/services/workoutStudio/readiness";
import type { TrainingStackParamList } from "@/types/navigation";

export type TrainingTabKey =
	| "today"
	| "progress"
	| "readiness"
	| "wellness"
	| "more";

export type TrainingTabAvailabilityInput = {
	progressFeature: boolean;
	progressContent: boolean;
	wearablesFeature: boolean;
	readinessStatus: ReadinessResult["status"];
	wellnessFeature: boolean;
	painReportsFeature: boolean;
	healthActionAvailable: boolean;
	secondaryItemCount: number;
};

export const visibleTrainingTabs = (
	input: TrainingTabAvailabilityInput,
): TrainingTabKey[] => {
	const tabs: TrainingTabKey[] = ["today"];

	if (input.progressFeature && input.progressContent) tabs.push("progress");
	if (input.wearablesFeature && input.readinessStatus === "ready")
		tabs.push("readiness");
	if (
		(input.wellnessFeature || input.painReportsFeature) &&
		input.healthActionAvailable
	)
		tabs.push("wellness");
	if (input.secondaryItemCount > 0) tabs.push("more");

	return tabs;
};

export const tabRouteForKey = (
	key: TrainingTabKey,
): keyof TrainingStackParamList => {
	switch (key) {
		case "today":
			return "TrainingToday";
		case "progress":
			return "TrainingProgress";
		case "readiness":
			return "TrainingWearables";
		case "wellness":
			return "TrainingWellnessHub";
		case "more":
			return "TrainingMore";
		default:
			throw new Error("Unknown training tab");
	}
};

export const fallbackTrainingTab = (
	selected: TrainingTabKey,
	visibleTabs: readonly TrainingTabKey[],
): TrainingTabKey => (visibleTabs.includes(selected) ? selected : "today");

export const visibleTabsDuringLoading = (
	visibleTabs: readonly TrainingTabKey[],
	selectedTab: TrainingTabKey,
): TrainingTabKey[] => {
	const tabs = [...visibleTabs];
	if (tabs.length === 0) tabs.push("today");
	if (!tabs.includes(selectedTab)) tabs.push(selectedTab);
	return tabs;
};
