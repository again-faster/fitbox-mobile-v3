import { wsRpc } from "./api";
import { getStoredWSSession } from "./auth";
import { WSApiError } from "./errors";
import {
	getMemberEngagement,
	getWeeklyRecapSnapshot,
	normalizeEngagementSnapshot,
	normalizeWeeklyRecapSnapshot,
} from "./recap";

jest.mock("./api", () => ({
	wsRpc: jest.fn(),
}));

jest.mock("./auth", () => ({
	getStoredWSSession: jest.fn(),
}));

const mockedWsRpc = jest.mocked(wsRpc);
const mockedGetStoredWSSession = jest.mocked(getStoredWSSession);

const memberSession = {
	user: {
		id: "member-1",
		persona: "member" as const,
		active_tenant_id: "tenant-1",
	},
};

describe("member recap service", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetStoredWSSession.mockReturnValue(memberSession as never);
	});

	it("loads a weekly recap snapshot using a server-owned fourteen-day window", async () => {
		mockedWsRpc.mockResolvedValue({
			ok: true,
			data: {
				as_of_date: "2026-08-09",
				window_start: "2026-07-27",
				window_end: "2026-08-09",
				completed_workouts: 3,
				completed_minutes: null,
				total_volume_kg: 1250,
				personal_records: 1,
				active_days: 3,
				workouts: [],
			},
		} as never);

		const snapshot = await getWeeklyRecapSnapshot();

		expect(mockedWsRpc).toHaveBeenCalledWith(
			"member_weekly_recap_snapshot",
			{ p_window_days: 14 },
		);
		expect(snapshot).toMatchObject({
			asOfDate: "2026-08-09",
			windowStart: "2026-07-27",
			completedWorkouts: 3,
			completedMinutes: null,
			totalVolumeKg: 1250,
		});
	});

	it("loads engagement separately without mixing provider metrics into recap data", async () => {
		mockedWsRpc.mockResolvedValue({
			ok: true,
			data: {
				as_of_date: "2026-08-09",
				window_start: "2026-07-13",
				window_end: "2026-08-09",
				active_days: 4,
				current_streak_days: null,
				longest_streak_days: 6,
				goals_completed: 2,
				badges_earned: null,
			},
		} as never);

		const engagement = await getMemberEngagement({ windowDays: 28 });

		expect(mockedWsRpc).toHaveBeenCalledWith("member_engagement_snapshot", {
			p_window_days: 28,
		});
		expect(engagement).toEqual({
			asOfDate: "2026-08-09",
			windowStart: "2026-07-13",
			windowEnd: "2026-08-09",
			activeDays: 4,
			currentStreakDays: null,
			longestStreakDays: 6,
			goalsCompleted: 2,
			badgesEarned: null,
		});
	});

	it("rejects unauthenticated recap and engagement access before querying", async () => {
		mockedGetStoredWSSession.mockReturnValue(null);

		await expect(getWeeklyRecapSnapshot()).rejects.toMatchObject({
			kind: "unauthorized",
		});
		await expect(getMemberEngagement()).rejects.toMatchObject({
			kind: "unauthorized",
		});
		expect(mockedWsRpc).not.toHaveBeenCalled();
	});

	it("preserves null recap and engagement metrics during normalization", () => {
		const recap = normalizeWeeklyRecapSnapshot({
			ok: true,
			data: {
				as_of_date: "2026-08-09",
				window_start: "2026-07-27",
				window_end: "2026-08-09",
				completed_workouts: null,
				completed_minutes: null,
				total_volume_kg: null,
				personal_records: null,
				active_days: null,
				workouts: [],
			},
		});
		const engagement = normalizeEngagementSnapshot({
			ok: true,
			data: {
				as_of_date: "2026-08-09",
				window_start: "2026-07-13",
				window_end: "2026-08-09",
				active_days: null,
				current_streak_days: null,
				longest_streak_days: null,
				goals_completed: null,
				badges_earned: null,
			},
		});

		expect(recap.completedWorkouts).toBeNull();
		expect(recap.totalVolumeKg).toBeNull();
		expect(engagement.currentStreakDays).toBeNull();
		expect(engagement.badgesEarned).toBeNull();
	});

	it("fails with a typed contract error when server dates are absent", () => {
		expect(() =>
			normalizeWeeklyRecapSnapshot({
				ok: true,
				data: {
					as_of_date: "2026-08-09",
					window_end: "2026-08-09",
					completed_workouts: null,
					completed_minutes: null,
					total_volume_kg: null,
					personal_records: null,
					active_days: null,
					workouts: [],
				},
			}),
		).toThrow("recap contract");
	});

	it("returns no recap when the feature is disabled or the endpoint is unavailable", async () => {
		await expect(
			getWeeklyRecapSnapshot({ enabled: false }),
		).resolves.toBeNull();
		expect(mockedWsRpc).not.toHaveBeenCalled();

		mockedWsRpc.mockRejectedValue(
			new WSApiError("server", "Recap is unavailable.", 503),
		);
		await expect(getWeeklyRecapSnapshot()).resolves.toBeNull();
	});
});
