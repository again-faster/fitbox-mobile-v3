import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWorkoutStudio } from "@/context/WorkoutStudioProvider";
import {
	getMemberReadiness,
	createLoadingReadinessResult,
	type ReadinessResult,
} from "@/services/workoutStudio/readiness";
import { getStoredWSSession } from "@/services/workoutStudio/auth";
import { getWeeklyRecapSnapshot } from "@/services/workoutStudio/recap";
import { wsApi } from "@/services/workoutStudio/api";
import { shouldShowProgressHub } from "../features/memberFeatureRoutes";
import { wellbeingPolicy } from "../features/wellnessFeaturePolicy";
import { useCustomWorkouts } from "../hooks/useCustomWorkouts";
import {
	buildTrainingMoreGroups,
	countTrainingMoreItems,
} from "../More/trainingMoreItems";
import {
	visibleTrainingTabs,
	type TrainingTabAvailabilityInput,
	type TrainingTabKey,
} from "./trainingTabs";

export type TabPresence = {
	progressRows: number;
	rmRows: number;
	benchmarkRows: number;
	recapAvailable: boolean;
	healthActionAvailable: boolean;
	optionalQueryFailed?: boolean;
};

export const createEmptyTabPresence = (): TabPresence => ({
	progressRows: 0,
	rmRows: 0,
	benchmarkRows: 0,
	recapAvailable: false,
	healthActionAvailable: false,
});

export type TrainingTabAvailability = {
	status: "loading" | "ready";
	visibleTabs: TrainingTabKey[];
};

const progressPresence = (
	features: Parameters<typeof shouldShowProgressHub>[0],
	presence: TabPresence,
) =>
	!presence.optionalQueryFailed &&
	(((features.progress || features.results) && presence.progressRows > 0) ||
		((features.prs || features.my_maxes) && presence.rmRows > 0) ||
		(features.benchmarks && presence.benchmarkRows > 0) ||
		(features.digest && presence.recapAvailable));

export const buildTrainingTabAvailability = (
	features: Parameters<typeof shouldShowProgressHub>[0],
	presence: TabPresence,
	readiness: Pick<ReadinessResult, "status">,
	secondaryItemCount: number,
): TrainingTabAvailability => {
	const input: TrainingTabAvailabilityInput = {
		progressFeature: shouldShowProgressHub(features),
		progressContent: progressPresence(features, presence),
		wearablesFeature: features.wearables,
		readinessStatus: presence.optionalQueryFailed
			? "error"
			: readiness.status,
		wellnessFeature: features.wellness,
		painReportsFeature: features.pain_reports,
		healthActionAvailable: presence.healthActionAvailable,
		secondaryItemCount,
	};
	return {
		status: "ready",
		visibleTabs: visibleTrainingTabs(input),
	};
};

const usePresenceCount = (
	key: string,
	table: string,
	searchParams: Record<string, string>,
	enabled: boolean,
) =>
	useQuery({
		queryKey: ["ws-training-tab-presence", key, searchParams],
		queryFn: () =>
			wsApi()
				.get(table, {
					searchParams: {
						select: "id",
						...searchParams,
						limit: "1",
					},
				})
				.json<unknown[]>()
				.then((rows) => rows.length),
		enabled,
		staleTime: 120_000,
	});

export const useTrainingTabAvailability = (): TrainingTabAvailability => {
	const { features } = useWorkoutStudio();
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const hasSession = !!uid;
	const { data: hasCustomWorkouts } = useCustomWorkouts();
	const wellbeing = wellbeingPolicy(features);

	const results = usePresenceCount(
		"results",
		"workout_results",
		{ athlete_id: `eq.${uid}`, completed_at: "not.is.null" },
		hasSession &&
			(features.progress || features.results || features.benchmarks),
	);
	const rms = usePresenceCount(
		"rms",
		"athlete_rms",
		{ athlete_id: `eq.${uid}` },
		hasSession && (features.prs || features.my_maxes),
	);
	const benchmarks = usePresenceCount(
		"benchmarks",
		"workouts",
		{ type: "eq.benchmark" },
		hasSession && features.benchmarks,
	);
	const readiness = useQuery<ReadinessResult>({
		queryKey: [
			"ws-training-tab-readiness",
			uid,
			session?.user.active_tenant_id,
		],
		queryFn: () =>
			getMemberReadiness({ windowDays: 31, featureEnabled: true }),
		enabled: hasSession && features.wearables,
		staleTime: 120_000,
	});
	const recap = useQuery({
		queryKey: ["ws-training-tab-recap", uid],
		queryFn: () => getWeeklyRecapSnapshot({ featureEnabled: true }),
		enabled: hasSession && features.digest,
		staleTime: 120_000,
	});

	const moreGroups = useMemo(() => {
		const groups = buildTrainingMoreGroups(
			{
				...features,
				wellness: wellbeing.showWellness,
				pain_reports: wellbeing.showPainReports,
				wearables: wellbeing.showWearables,
			},
			hasCustomWorkouts === true,
		);
		return groups;
	}, [features, hasCustomWorkouts, wellbeing]);

	const enabledQueries = [
		{
			enabled:
				hasSession &&
				(features.progress || features.results || features.benchmarks),
			query: results,
		},
		{
			enabled: hasSession && (features.prs || features.my_maxes),
			query: rms,
		},
		{ enabled: hasSession && features.benchmarks, query: benchmarks },
		{ enabled: hasSession && features.wearables, query: readiness },
		{ enabled: hasSession && features.digest, query: recap },
	]
		.filter((item) => item.enabled)
		.map((item) => item.query);
	const loading = enabledQueries.some((query) => query.isLoading);
	const optionalQueryFailed = enabledQueries.some((query) => query.isError);
	const presence: TabPresence = {
		progressRows: results.data ?? 0,
		rmRows: rms.data ?? 0,
		benchmarkRows: benchmarks.data ?? 0,
		recapAvailable: recap.data !== null && recap.data !== undefined,
		healthActionAvailable: features.wellness || features.pain_reports,
		optionalQueryFailed,
	};
	const baseAvailability = buildTrainingTabAvailability(
		features,
		presence,
		readiness.data ?? createLoadingReadinessResult(),
		0,
	);
	const secondaryItemCount = countTrainingMoreItems(
		moreGroups,
		baseAvailability.visibleTabs,
	);
	const availability = buildTrainingTabAvailability(
		features,
		presence,
		readiness.data ?? createLoadingReadinessResult(),
		secondaryItemCount,
	);

	return {
		status: loading ? "loading" : availability.status,
		// Keep the last computed feature/content decisions visible while the
		// presence queries refresh. TrainingTabShell preserves the selected tab
		// during this window so the navigation rail does not disappear.
		visibleTabs: availability.visibleTabs,
	};
};
