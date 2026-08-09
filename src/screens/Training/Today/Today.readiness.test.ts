jest.mock("@/services/healthKit", () => ({ syncNow: jest.fn() }));
jest.mock("@/services/workoutStudio/api", () => ({ wsApi: jest.fn() }));
jest.mock("@/services/workoutStudio/auth", () => ({
	getStoredWSSession: jest.fn(() => null),
}));
jest.mock("@/services/workoutStudio/workouts", () => ({
	getMemberWorkouts: jest.fn(),
}));
jest.mock("@/storage", () => ({
	mmkvStorage: {
		getString: jest.fn(),
		set: jest.fn(),
		getAllKeys: jest.fn(() => []),
	},
}));
jest.mock("@react-navigation/native", () => ({
	useFocusEffect: jest.fn(),
	useNavigation: jest.fn(() => ({ navigate: jest.fn() })),
}));
jest.mock("@tanstack/react-query", () => ({ useQuery: jest.fn() }));
jest.mock("@/context/WorkoutStudioProvider", () => ({
	useWorkoutStudio: jest.fn(() => ({
		features: { wearables: true },
		isEnabled: jest.fn(() => true),
	})),
}));
jest.mock("../hooks/useCustomWorkouts", () => ({
	useCustomWorkouts: jest.fn(() => ({ data: false })),
}));
jest.mock("../hooks/useTrainingConnectivity", () => ({
	useTrainingConnectivity: jest.fn(() => ({
		isOffline: false,
		refresh: jest.fn(),
	})),
}));
jest.mock("../Progress/progressFeatures", () => ({
	shouldShowTodayProgressCard: jest.fn(() => false),
}));
jest.mock("../components/SkeletonCard", () => "SkeletonCard");
jest.mock("../components/SectionHeading", () => "SectionHeading");
jest.mock("../components/OfflineBanner", () => "OfflineBanner");
jest.mock("../components/TrainingState", () => "TrainingState");
jest.mock("./components/ConsistencyCard", () => "ConsistencyCard");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "Icon");
jest.mock("react-native-safe-area-context", () => ({
	SafeAreaView: "SafeAreaView",
}));

import type { ReadinessResult } from "@/services/workoutStudio/readiness";
import { readinessCopy } from "./Today";

const snapshot = {
	asOfDate: "2026-08-09",
	windowStart: "2026-08-06",
	windowEnd: "2026-08-09",
	hasConnection: null,
	metrics: [
		{
			provider: "apple_health" as const,
			asOfDate: "2026-08-09",
			sleepMinutes: null,
			hrvMs: null,
			restingHr: null,
			nativeRecoveryScore: null,
			nativeReadinessScore: null,
		},
	],
};

describe("Today readiness state presentation", () => {
	it.each([
		[
			"loading",
			{ status: "loading", data: null, error: null, asOfDate: null },
		],
		[
			"ready",
			{
				status: "ready",
				data: snapshot,
				error: null,
				asOfDate: snapshot.asOfDate,
			},
		],
		[
			"empty",
			{
				status: "empty",
				data: { ...snapshot, metrics: [] },
				error: null,
				asOfDate: snapshot.asOfDate,
			},
		],
		[
			"baseline",
			{
				status: "baseline",
				data: snapshot,
				error: null,
				asOfDate: snapshot.asOfDate,
			},
		],
		[
			"error",
			{
				status: "error",
				data: null,
				error: {
					code: "server",
					kind: "server",
					message: "Readiness is temporarily unavailable.",
				},
				asOfDate: null,
			},
		],
	] as const)(
		"renders the %s state without zero fallbacks",
		(_name, result) => {
			const copy = readinessCopy(result as ReadinessResult);
			expect(copy.score).not.toBe("0");
			if (result.status === "baseline") {
				expect(copy.band).toBe("Baseline");
				expect(copy.confidence).toBe("Building");
			}
			if (result.status === "error")
				expect(copy.detail).toBe(result.error.message);
		},
	);
});
