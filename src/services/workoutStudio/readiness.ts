import { wsRpc } from "./api";
import { getStoredWSSession } from "./auth";
import { WSApiError } from "./errors";

export type ReadinessProvider =
	| "apple_health"
	| "health_connect"
	| "whoop"
	| "oura"
	| "garmin"
	| "fitbit";

export type ReadinessMetric = {
	provider: ReadinessProvider;
	asOfDate: string;
	sleepMinutes: number | null;
	hrvMs: number | null;
	restingHr: number | null;
	nativeRecoveryScore: number | null;
	nativeReadinessScore: number | null;
};

export type ReadinessSnapshot = {
	asOfDate: string;
	windowStart: string;
	windowEnd: string;
	hasConnection: boolean;
	metrics: ReadinessMetric[];
};

export type ReadinessState = "empty" | "baseline" | "scored";

export type ReadinessOptions = {
	windowDays?: number;
	enabled?: boolean;
	featureEnabled?: boolean;
};

const DEFAULT_WINDOW_DAYS = 7;
const MAX_WINDOW_DAYS = 31;
const READINESS_PROVIDERS: ReadinessProvider[] = [
	"apple_health",
	"health_connect",
	"whoop",
	"oura",
	"garmin",
	"fitbit",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isDateOnly = (value: unknown): value is string =>
	typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isNullableNumber = (value: unknown): value is number | null =>
	value === null || (typeof value === "number" && Number.isFinite(value));

const toNullableNumber = (value: unknown): number | null => {
	if (value === undefined || value === null) return null;
	if (!isNullableNumber(value)) throw new Error("readiness contract");
	return value;
};

const isUnavailable = (error: unknown): boolean =>
	error instanceof WSApiError &&
	["not_found", "server", "network", "timeout"].includes(error.kind);

const requireMemberSession = () => {
	const session = getStoredWSSession();
	if (!session)
		throw new WSApiError(
			"unauthorized",
			"Your Training session has expired.",
		);
	if (session.user.persona !== "member")
		throw new WSApiError(
			"forbidden",
			"Readiness is available for members only.",
		);
	return session;
};

const isEnabled = (options: ReadinessOptions): boolean =>
	options.enabled !== false && options.featureEnabled !== false;

const normalizeWindowDays = (windowDays: number): number => {
	if (
		!Number.isInteger(windowDays) ||
		windowDays < 1 ||
		windowDays > MAX_WINDOW_DAYS
	)
		throw new WSApiError(
			"unknown",
			`Readiness window must be between 1 and ${MAX_WINDOW_DAYS} days.`,
		);
	return windowDays;
};

export const normalizeReadinessSnapshot = (raw: unknown): ReadinessSnapshot => {
	if (!isRecord(raw) || raw.ok !== true || !isRecord(raw.data))
		throw new Error("readiness contract");

	const { data } = raw;
	if (
		!isDateOnly(data.as_of_date) ||
		!isDateOnly(data.window_start) ||
		!isDateOnly(data.window_end) ||
		data.window_start > data.window_end ||
		!Array.isArray(data.metrics)
	)
		throw new Error("readiness contract");

	const metrics = data.metrics.map((rawMetric) => {
		if (
			!isRecord(rawMetric) ||
			typeof rawMetric.provider !== "string" ||
			!READINESS_PROVIDERS.includes(
				rawMetric.provider as ReadinessProvider,
			) ||
			!isDateOnly(rawMetric.metric_date)
		)
			throw new Error("readiness contract");

		return {
			provider: rawMetric.provider as ReadinessProvider,
			asOfDate: rawMetric.metric_date,
			sleepMinutes: toNullableNumber(rawMetric.sleep_minutes),
			hrvMs: toNullableNumber(rawMetric.hrv_ms),
			restingHr: toNullableNumber(rawMetric.resting_hr),
			nativeRecoveryScore: toNullableNumber(rawMetric.recovery_score),
			nativeReadinessScore: toNullableNumber(rawMetric.readiness_score),
		};
	});

	return {
		asOfDate: data.as_of_date,
		windowStart: data.window_start,
		windowEnd: data.window_end,
		hasConnection: data.has_connection === true,
		metrics,
	};
};

export function getMemberReadiness(
	options?: Omit<ReadinessOptions, "enabled" | "featureEnabled"> & {
		enabled?: true;
		featureEnabled?: true;
	},
): Promise<ReadinessSnapshot>;
export function getMemberReadiness(
	options: ReadinessOptions & { enabled: false },
): Promise<ReadinessSnapshot | null>;
export function getMemberReadiness(
	options: ReadinessOptions = {},
): Promise<ReadinessSnapshot | null> {
	if (!isEnabled(options)) return Promise.resolve(null);

	return (async () => {
		requireMemberSession();
		try {
			const raw = await wsRpc<unknown>("member_readiness_snapshot", {
				p_window_days: normalizeWindowDays(
					options.windowDays ?? DEFAULT_WINDOW_DAYS,
				),
			});
			return normalizeReadinessSnapshot(raw);
		} catch (error) {
			if (isUnavailable(error)) return null;
			throw error;
		}
	})();
}

export const getReadinessState = (
	snapshot: ReadinessSnapshot,
): ReadinessState => {
	if (snapshot.metrics.length === 0) return "empty";
	if (
		snapshot.metrics.some(
			(metric) =>
				metric.nativeReadinessScore !== null ||
				metric.nativeRecoveryScore !== null,
		)
	)
		return "scored";
	return "baseline";
};
