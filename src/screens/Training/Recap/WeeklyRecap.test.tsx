jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "Icon");
jest.mock("@/services/workoutStudio/recap", () => ({
	getMemberEngagement: jest.fn(),
	getWeeklyRecapSnapshot: jest.fn(),
}));
jest.mock("@/services/workoutStudio/readiness", () => ({
	createLoadingReadinessResult: jest.fn(() => ({
		status: "loading",
		data: null,
		error: null,
		asOfDate: null,
	})),
	getMemberReadiness: jest.fn(),
}));
jest.mock("@/services/workoutStudio/auth", () => ({
	getStoredWSSession: jest.fn(),
}));
jest.mock("@/context/WorkoutStudioProvider", () => ({
	useWorkoutStudio: jest.fn(() => ({
		isEnabled: jest.fn(() => true),
	})),
}));
jest.mock("@tanstack/react-query", () => ({
	useQuery: jest.fn(),
}));
jest.mock("../components/SkeletonCard", () => "SkeletonCard");
jest.mock("../components/TrainingState", () => "TrainingState");

import { createElement } from "react";
import { render } from "@testing-library/react-native";
import { useQuery } from "@tanstack/react-query";
import type { StackScreenProps } from "@react-navigation/stack";
import type {
	EngagementSnapshot,
	WeeklyRecapSnapshot,
} from "@/services/workoutStudio/recap";
import type { ReadinessResult } from "@/services/workoutStudio/readiness";
import { getStoredWSSession } from "@/services/workoutStudio/auth";
import type { TrainingStackParamList } from "@/types/navigation";
import WeeklyRecap, {
	hasMemberRecapSession,
	shouldEnableWeeklyRecapQuery,
	weeklyRecapViewState,
	weeklyRecapStateCopy,
} from "./WeeklyRecap";

const mockedUseQuery = jest.mocked(useQuery);
const mockedGetStoredWSSession = jest.mocked(getStoredWSSession);

const memberSession = {
	user: {
		id: "member-1",
		persona: "member" as const,
		active_tenant_id: "tenant-1",
	},
};

const weeklyRecapRoute: StackScreenProps<
	TrainingStackParamList,
	"TrainingWeeklyRecap"
>["route"] = {
	key: "WeeklyRecapTest",
	name: "TrainingWeeklyRecap",
	params: undefined,
};

const snapshot: WeeklyRecapSnapshot = {
	asOfDate: "2026-08-09",
	windowStart: "2026-08-03",
	windowEnd: "2026-08-09",
	completedWorkouts: 3,
	completedMinutes: null,
	totalVolumeKg: 1250,
	personalRecords: 1,
	activeDays: 3,
	workouts: [
		{ id: "result-1", name: "Strength", completedAt: "2026-08-08" },
		{ id: "result-2", name: null, completedAt: null },
	],
};

const engagement: EngagementSnapshot = {
	asOfDate: "2026-08-09",
	windowStart: "2026-07-13",
	windowEnd: "2026-08-09",
	activeDays: 4,
	currentStreakDays: null,
	longestStreakDays: 6,
	goalsCompleted: 2,
	badgesEarned: null,
};

const readiness: ReadinessResult = {
	status: "ready",
	data: {
		asOfDate: "2026-08-09",
		windowStart: "2026-08-03",
		windowEnd: "2026-08-09",
		hasConnection: true,
		metrics: [],
	},
	error: null,
	asOfDate: "2026-08-09",
};

const queryResult = (data: unknown) => ({
	data,
	isLoading: false,
	isRefetching: false,
	isError: false,
	refetch: jest.fn(),
});

describe("Weekly Recap screen", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetStoredWSSession.mockReturnValue(memberSession as never);
		mockedUseQuery.mockImplementation((options) => {
			const key = options.queryKey as readonly unknown[];
			if (key[0] === "ws-member-weekly-recap")
				return queryResult(snapshot) as never;
			if (key[0] === "ws-member-engagement")
				return queryResult(engagement) as never;
			return queryResult(readiness) as never;
		});
	});

	it("requires an authenticated member session and enabled recap feature", () => {
		expect(hasMemberRecapSession(null)).toBe(false);
		expect(
			hasMemberRecapSession({
				user: {
					id: "solo-1",
					persona: "solo",
					active_tenant_id: "tenant-1",
				},
			} as never),
		).toBe(false);
		expect(hasMemberRecapSession(memberSession as never)).toBe(true);
		expect(
			shouldEnableWeeklyRecapQuery(false, memberSession as never),
		).toBe(false);
		expect(shouldEnableWeeklyRecapQuery(true, memberSession as never)).toBe(
			true,
		);
	});

	it("does not enable recap or readiness queries without a member session", () => {
		mockedGetStoredWSSession.mockReturnValue(null);

		render(
			createElement(WeeklyRecap, {
				navigation: { navigate: jest.fn() } as never,
				route: weeklyRecapRoute,
			}),
		);

		expect(
			mockedUseQuery.mock.calls.map(([options]) => options.enabled),
		).toEqual([false, false, false]);
	});

	it.each(["loading", "error", "empty", "ready"] as const)(
		"keeps the %s state explicit",
		(state) => {
			const copy = weeklyRecapStateCopy(state);
			expect(copy.state).toBe(state);
			expect(copy.title).toBeTruthy();
			expect(copy.detail).toBeTruthy();
		},
	);

	it("maps query conditions to loading, error, empty, and ready states", () => {
		expect(weeklyRecapViewState(false, false, false, undefined)).toBe(
			"empty",
		);
		expect(weeklyRecapViewState(true, true, false, undefined)).toBe(
			"loading",
		);
		expect(weeklyRecapViewState(true, false, true, undefined)).toBe(
			"error",
		);
		expect(weeklyRecapViewState(true, false, false, null)).toBe("empty");
		expect(weeklyRecapViewState(true, false, false, snapshot)).toBe(
			"ready",
		);
	});

	it("renders server date context, nullable metrics, safe workout fallback, and accessible recap copy", () => {
		const screen = render(
			createElement(WeeklyRecap, {
				navigation: { navigate: jest.fn() } as never,
				route: weeklyRecapRoute,
			}),
		);

		expect(screen.getByText(/Week of 3 Aug.*9 Aug/)).toBeTruthy();
		expect(screen.getByText(/As of 9 Aug 2026/)).toBeTruthy();
		expect(screen.getByText("Strength")).toBeTruthy();
		expect(screen.getByText("Workout")).toBeTruthy();
		expect(screen.getAllByText("Not available").length).toBeGreaterThan(0);
		expect(screen.queryByText(/^0$/)).toBeNull();
		expect(
			screen.getByLabelText(/Weekly recap.*3 workouts.*As of 9 Aug 2026/),
		).toBeTruthy();
		expect(
			screen.getByLabelText(/Strength.*Completed 8 Aug 2026/),
		).toBeTruthy();
	});
});
