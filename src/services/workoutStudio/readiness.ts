import { wsRpc } from "./api";
import { getStoredWSSession } from "./auth";
import { WSApiError } from "./errors";
import type { WSFailureKind } from "./errors";

export type ProviderId =
	| "apple_health"
	| "health_connect"
	| "whoop"
	| "garmin"
	| "fitbit"
	| "strava";

export type ReadinessProvider = ProviderId;

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
	hasConnection: boolean | null;
	metrics: ReadinessMetric[];
};

export type ReadinessState = "empty" | "baseline" | "ready";

export type ReadinessOptions = {
	windowDays?: number;
	enabled?: boolean;
	featureEnabled?: boolean;
};

export type ReadinessErrorKind =
	| WSFailureKind
	| "feature_disabled"
	| "contract";

export type ReadinessError = {
	code: ReadinessErrorKind;
	kind: ReadinessErrorKind;
	message: string;
	status?: number;
};

export type ReadinessLoadingResult = {
	status: "loading";
	data: null;
	error: null;
	asOfDate: null;
};

export type ReadinessDataResult = {
	status: Exclude<ReadinessState, "ready"> | "ready";
	data: ReadinessSnapshot;
	error: null;
	asOfDate: string;
};

export type ReadinessErrorResult = {
	status: "error";
	data: null;
	error: ReadinessError;
	asOfDate: null;
};

export type ReadinessResult =
	| ReadinessLoadingResult
	| ReadinessDataResult
	| ReadinessErrorResult;

const DEFAULT_WINDOW_DAYS = 7;
const MAX_WINDOW_DAYS = 31;
const READINESS_PROVIDERS: ProviderId[] = [
	"apple_health",
	"health_connect",
	"whoop",
	"garmin",
	"fitbit",
	"strava",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isDateOnly = (value: unknown): value is string => {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
		return false;
	const [yearString, monthString, dayString] = value.split("-");
	const year = Number(yearString);
	const month = Number(monthString);
	const day = Number(dayString);
	if (year < 1 || month < 1 || month > 12 || day < 1) return false;
	const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
	const daysInMonth = [
		31,
		leapYear ? 29 : 28,
		31,
		30,
		31,
		30,
		31,
		31,
		30,
		31,
		30,
		31,
	][month - 1];
	return daysInMonth !== undefined && day <= daysInMonth;
};

const isNullableNumber = (value: unknown): value is number | null =>
	value === null || (typeof value === "number" && Number.isFinite(value));

const toNullableNumber = (value: unknown): number | null => {
	if (value === undefined || value === null) return null;
	if (!isNullableNumber(value)) throw new Error("readiness contract");
	return value;
};

const toNullableBoolean = (value: unknown): boolean | null =>
	typeof value === "boolean" ? value : null;

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

const safeReadinessMessage = (kind: ReadinessErrorKind): string => {
	switch (kind) {
		case "unauthorized":
			return "Your Training session has expired.";
		case "forbidden":
			return "You do not have access to this Training data.";
		case "not_found":
			return "Readiness is not available.";
		case "rate_limited":
			return "Readiness is temporarily unavailable. Please try again later.";
		case "timeout":
			return "Readiness took too long to load. Please try again.";
		case "server":
			return "Readiness is temporarily unavailable.";
		case "network":
			return "Check your internet connection and try again.";
		case "feature_disabled":
			return "Readiness is disabled for this member.";
		case "contract":
			return "Readiness data was not returned in a supported format.";
		case "unknown":
			return "Readiness could not be loaded.";
	}
};

const toReadinessError = (error: unknown): ReadinessError => {
	if (error instanceof WSApiError) {
		return {
			code: error.kind,
			kind: error.kind,
			message: safeReadinessMessage(error.kind),
			...(error.status === undefined ? {} : { status: error.status }),
		};
	}
	if (error instanceof Error && error.message === "readiness contract") {
		return {
			code: "contract",
			kind: "contract",
			message: safeReadinessMessage("contract"),
		};
	}
	return {
		code: "unknown",
		kind: "unknown",
		message: safeReadinessMessage("unknown"),
	};
};

const createErrorResult = (error: ReadinessError): ReadinessErrorResult => ({
	status: "error",
	data: null,
	error,
	asOfDate: null,
});

export const createLoadingReadinessResult = (): ReadinessLoadingResult => ({
	status: "loading",
	data: null,
	error: null,
	asOfDate: null,
});

export const normalizeReadinessSnapshot = (raw: unknown): ReadinessSnapshot => {
	if (!isRecord(raw) || raw.ok !== true || !isRecord(raw.data))
		throw new Error("readiness contract");

	const { data } = raw;
	const asOfDate = data.as_of_date;
	const windowStart = data.window_start;
	const windowEnd = data.window_end;
	if (
		!isDateOnly(asOfDate) ||
		!isDateOnly(windowStart) ||
		!isDateOnly(windowEnd) ||
		windowStart > windowEnd ||
		asOfDate < windowStart ||
		asOfDate > windowEnd ||
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
			!isDateOnly(rawMetric.metric_date) ||
			rawMetric.metric_date < windowStart ||
			rawMetric.metric_date > windowEnd ||
			rawMetric.metric_date > asOfDate
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
		asOfDate,
		windowStart,
		windowEnd,
		hasConnection: toNullableBoolean(data.has_connection),
		metrics,
	};
};

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
		return "ready";
	return "baseline";
};

export const getMemberReadiness = async (
	options: ReadinessOptions = {},
): Promise<ReadinessResult> => {
	if (!isEnabled(options))
		return createErrorResult({
			code: "feature_disabled",
			kind: "feature_disabled",
			message: "Readiness is disabled for this member.",
		});

	try {
		requireMemberSession();
		const raw = await wsRpc<unknown>("member_readiness_snapshot", {
			p_window_days: normalizeWindowDays(
				options.windowDays ?? DEFAULT_WINDOW_DAYS,
			),
		});
		const data = normalizeReadinessSnapshot(raw);
		return {
			status: getReadinessState(data),
			data,
			error: null,
			asOfDate: data.asOfDate,
		};
	} catch (error) {
		return createErrorResult(toReadinessError(error));
	}
};
