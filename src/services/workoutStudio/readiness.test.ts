import { wsRpc } from "./api";
import { getStoredWSSession } from "./auth";
import { WSApiError } from "./errors";
import {
	getMemberReadiness,
	getReadinessState,
	normalizeReadinessSnapshot,
} from "./readiness";

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

const response = {
	ok: true,
	data: {
		as_of_date: "2026-08-09",
		window_start: "2026-08-06",
		window_end: "2026-08-09",
		has_connection: true,
		metrics: [
			{
				provider: "apple_health",
				metric_date: "2026-08-09",
				sleep_minutes: 420,
				hrv_ms: null,
				resting_hr: 54,
				recovery_score: null,
				readiness_score: 81,
			},
		],
	},
};

describe("member readiness service", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetStoredWSSession.mockReturnValue(memberSession as never);
	});

	it("queries an authenticated member without accepting a client user id or date", async () => {
		mockedWsRpc.mockResolvedValue(response as never);

		const snapshot = await getMemberReadiness({ windowDays: 3 });

		expect(mockedWsRpc).toHaveBeenCalledWith("member_readiness_snapshot", {
			p_window_days: 3,
		});
		expect(snapshot.asOfDate).toBe("2026-08-09");
		expect(snapshot.windowStart).toBe("2026-08-06");
		expect(snapshot.windowEnd).toBe("2026-08-09");
		expect(snapshot.metrics[0]).toMatchObject({
			provider: "apple_health",
			sleepMinutes: 420,
			hrvMs: null,
			nativeReadinessScore: 81,
		});
	});

	it("rejects unauthenticated or non-member callers before the server query", async () => {
		mockedGetStoredWSSession.mockReturnValueOnce(null);
		await expect(getMemberReadiness()).rejects.toMatchObject({
			kind: "unauthorized",
		});

		mockedGetStoredWSSession.mockReturnValueOnce({
			user: { ...memberSession.user, persona: "coach" },
		} as never);
		await expect(getMemberReadiness()).rejects.toMatchObject({
			kind: "forbidden",
		});
		expect(mockedWsRpc).not.toHaveBeenCalled();
	});

	it("keeps server missingness as null instead of turning it into zero", () => {
		const snapshot = normalizeReadinessSnapshot({
			ok: true,
			data: {
				...response.data,
				metrics: [
					{
						provider: "whoop",
						metric_date: "2026-08-08",
						sleep_minutes: null,
						hrv_ms: null,
						resting_hr: null,
						recovery_score: null,
						readiness_score: null,
					},
				],
			},
		});

		expect(snapshot.metrics[0]).toEqual({
			provider: "whoop",
			asOfDate: "2026-08-08",
			sleepMinutes: null,
			hrvMs: null,
			restingHr: null,
			nativeRecoveryScore: null,
			nativeReadinessScore: null,
		});
	});

	it.each([
		["empty", { metrics: [] }],
		[
			"baseline",
			{
				metrics: [
					{
						provider: "apple_health",
						metric_date: "2026-08-09",
						sleep_minutes: 420,
						hrv_ms: null,
						resting_hr: null,
						recovery_score: null,
						readiness_score: null,
					},
				],
			},
		],
	])("classifies a %s snapshot without inventing a score", (state, data) => {
		const snapshot = normalizeReadinessSnapshot({
			ok: true,
			data: { ...response.data, ...data },
		});

		expect(getReadinessState(snapshot)).toBe(state);
	});

	it("rejects an unknown provider or missing server-owned date window", () => {
		expect(() =>
			normalizeReadinessSnapshot({
				ok: true,
				data: {
					...response.data,
					window_start: undefined,
					metrics: [],
				},
			}),
		).toThrow("readiness contract");

		expect(() =>
			normalizeReadinessSnapshot({
				ok: true,
				data: {
					...response.data,
					metrics: [
						{ ...response.data.metrics[0], provider: "unknown" },
					],
				},
			}),
		).toThrow("readiness contract");
	});

	it("returns no snapshot when the feature is disabled or the endpoint is unavailable", async () => {
		await expect(
			getMemberReadiness({ enabled: false }),
		).resolves.toBeNull();
		expect(mockedWsRpc).not.toHaveBeenCalled();

		mockedWsRpc.mockRejectedValue(
			new WSApiError("not_found", "Readiness is unavailable.", 404),
		);
		await expect(getMemberReadiness()).resolves.toBeNull();
	});
});
