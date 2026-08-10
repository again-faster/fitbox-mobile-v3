import { wsRpc } from "./api";
import { getStoredWSSession } from "./auth";
import { WSApiError } from "./errors";

export type WeeklyRecapWorkout = {
	id: string;
	name: string | null;
	completedAt: string | null;
};

export type WeeklyRecapSnapshot = {
	asOfDate: string;
	windowStart: string;
	windowEnd: string;
	completedWorkouts: number | null;
	completedMinutes: number | null;
	totalVolumeKg: number | null;
	personalRecords: number | null;
	activeDays: number | null;
	workouts: WeeklyRecapWorkout[];
};

export type EngagementSnapshot = {
	asOfDate: string;
	windowStart: string;
	windowEnd: string;
	activeDays: number | null;
	currentStreakDays: number | null;
	longestStreakDays: number | null;
	goalsCompleted: number | null;
	badgesEarned: number | null;
};

export type RecapOptions = {
	windowDays?: number;
	enabled?: boolean;
	featureEnabled?: boolean;
};

const DEFAULT_RECAP_WINDOW_DAYS = 14;
const DEFAULT_ENGAGEMENT_WINDOW_DAYS = 28;
const MAX_WINDOW_DAYS = 90;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isDateOnly = (value: unknown): value is string =>
	typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const toNullableNumber = (value: unknown): number | null => {
	if (value === undefined || value === null) return null;
	if (typeof value !== "number" || !Number.isFinite(value))
		throw new Error("recap contract");
	return value;
};

const toNullableString = (value: unknown): string | null => {
	if (value === undefined || value === null) return null;
	if (typeof value !== "string") throw new Error("recap contract");
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
			"Weekly recap is available for members only.",
		);
	return session;
};

const isEnabled = (options: RecapOptions): boolean =>
	options.enabled !== false && options.featureEnabled !== false;

const normalizeWindowDays = (windowDays: number): number => {
	if (
		!Number.isInteger(windowDays) ||
		windowDays < 1 ||
		windowDays > MAX_WINDOW_DAYS
	)
		throw new WSApiError(
			"unknown",
			`Recap window must be between 1 and ${MAX_WINDOW_DAYS} days.`,
		);
	return windowDays;
};

const normalizeRange = (data: Record<string, unknown>) => {
	if (
		!isDateOnly(data.as_of_date) ||
		!isDateOnly(data.window_start) ||
		!isDateOnly(data.window_end) ||
		data.window_start > data.window_end
	)
		throw new Error("recap contract");
	return {
		asOfDate: data.as_of_date,
		windowStart: data.window_start,
		windowEnd: data.window_end,
	};
};

export const normalizeWeeklyRecapSnapshot = (
	raw: unknown,
): WeeklyRecapSnapshot => {
	if (!isRecord(raw) || raw.ok !== true || !isRecord(raw.data))
		throw new Error("recap contract");

	const { data } = raw;
	const range = normalizeRange(data);
	if (!Array.isArray(data.workouts)) throw new Error("recap contract");

	const workouts = data.workouts.map((item) => {
		if (!isRecord(item) || typeof item.id !== "string")
			throw new Error("recap contract");
		return {
			id: item.id,
			name: toNullableString(item.name),
			completedAt: toNullableString(
				item.completed_at ?? item.completedAt,
			),
		};
	});

	return {
		...range,
		completedWorkouts: toNullableNumber(data.completed_workouts),
		completedMinutes: toNullableNumber(data.completed_minutes),
		totalVolumeKg: toNullableNumber(data.total_volume_kg),
		personalRecords: toNullableNumber(data.personal_records),
		activeDays: toNullableNumber(data.active_days),
		workouts,
	};
};

export const normalizeEngagementSnapshot = (
	raw: unknown,
): EngagementSnapshot => {
	if (!isRecord(raw) || raw.ok !== true || !isRecord(raw.data))
		throw new Error("recap contract");

	const { data } = raw;
	return {
		...normalizeRange(data),
		activeDays: toNullableNumber(data.active_days),
		currentStreakDays: toNullableNumber(data.current_streak_days),
		longestStreakDays: toNullableNumber(data.longest_streak_days),
		goalsCompleted: toNullableNumber(data.goals_completed),
		badgesEarned: toNullableNumber(data.badges_earned),
	};
};

export function getWeeklyRecapSnapshot(
	options?: Omit<RecapOptions, "enabled" | "featureEnabled"> & {
		enabled?: true;
		featureEnabled?: true;
	},
): Promise<WeeklyRecapSnapshot>;
export function getWeeklyRecapSnapshot(
	options: RecapOptions & { enabled: false },
): Promise<WeeklyRecapSnapshot | null>;
export function getWeeklyRecapSnapshot(
	options: RecapOptions = {},
): Promise<WeeklyRecapSnapshot | null> {
	if (!isEnabled(options)) return Promise.resolve(null);

	return (async () => {
		requireMemberSession();
		try {
			const raw = await wsRpc<unknown>("member_weekly_recap_snapshot", {
				p_window_days: normalizeWindowDays(
					options.windowDays ?? DEFAULT_RECAP_WINDOW_DAYS,
				),
			});
			return normalizeWeeklyRecapSnapshot(raw);
		} catch (error) {
			if (isUnavailable(error)) return null;
			throw error;
		}
	})();
}

export function getMemberEngagement(
	options?: Omit<RecapOptions, "enabled" | "featureEnabled"> & {
		enabled?: true;
		featureEnabled?: true;
	},
): Promise<EngagementSnapshot>;
export function getMemberEngagement(
	options: RecapOptions & { enabled: false },
): Promise<EngagementSnapshot | null>;
export function getMemberEngagement(
	options: RecapOptions = {},
): Promise<EngagementSnapshot | null> {
	if (!isEnabled(options)) return Promise.resolve(null);

	return (async () => {
		requireMemberSession();
		try {
			const raw = await wsRpc<unknown>("member_engagement_snapshot", {
				p_window_days: normalizeWindowDays(
					options.windowDays ?? DEFAULT_ENGAGEMENT_WINDOW_DAYS,
				),
			});
			return normalizeEngagementSnapshot(raw);
		} catch (error) {
			if (isUnavailable(error)) return null;
			throw error;
		}
	})();
}
