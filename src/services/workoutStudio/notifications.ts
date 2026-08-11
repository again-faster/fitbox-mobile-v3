import { wsApi, wsRpc } from "./api";
import { getStoredWSSession } from "./auth";
import { WSApiError, toWSApiError } from "./errors";
import type { Notification } from "./types";

export type MemberNotification = Notification;

export type NotificationPreferences = {
	trainingUpdates: boolean | null;
	coachNotes: boolean | null;
	weeklyRecap: boolean | null;
	readinessUpdates: boolean | null;
};

export type NotificationDeviceInput = {
	deviceToken: string;
	platform: "ios" | "android";
	deviceId?: string;
	appVersion?: string;
};

export type NotificationServiceOptions = {
	enabled?: boolean;
	featureEnabled?: boolean;
};

export type NotificationListOptions = NotificationServiceOptions & {
	limit?: number;
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const NOTIFICATION_KINDS: Notification["kind"][] = [
	"assignment",
	"coach_note",
	"reaction",
	"wellness_followup",
	"weekly_recap",
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const toNullableString = (value: unknown): string | null => {
	if (value === undefined || value === null) return null;
	if (typeof value !== "string") throw new Error("notifications contract");
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
			"Notifications are available for members only.",
		);
	return session;
};

const isEnabled = (options: NotificationServiceOptions): boolean =>
	options.enabled !== false && options.featureEnabled !== false;

const normalizeLimit = (limit: number): number => {
	if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT)
		throw new WSApiError(
			"unknown",
			`Notification limit must be between 1 and ${MAX_LIMIT}.`,
		);
	return limit;
};

const normalizeNotification = (raw: unknown): MemberNotification => {
	if (
		!isRecord(raw) ||
		typeof raw.id !== "string" ||
		typeof raw.title !== "string" ||
		typeof raw.body !== "string" ||
		typeof raw.kind !== "string" ||
		!NOTIFICATION_KINDS.includes(raw.kind as Notification["kind"]) ||
		typeof raw.created_at !== "string"
	)
		throw new Error("notifications contract");

	return {
		id: raw.id,
		title: raw.title,
		body: raw.body,
		kind: raw.kind as Notification["kind"],
		entity_id: toNullableString(raw.entity_id),
		link: toNullableString(raw.link),
		read_at: toNullableString(raw.read_at),
		created_at: raw.created_at,
	};
};

export const normalizeNotifications = (raw: unknown): MemberNotification[] => {
	if (!Array.isArray(raw)) throw new Error("notifications contract");
	return raw.map(normalizeNotification);
};

const toNullableBoolean = (value: unknown): boolean | null =>
	typeof value === "boolean" || value === null ? value : null;

export const normalizeNotificationPreferences = (
	raw: unknown,
): NotificationPreferences => {
	if (!isRecord(raw) || raw.ok !== true || !isRecord(raw.data))
		throw new Error("notification preferences contract");
	const { data } = raw;
	return {
		trainingUpdates: toNullableBoolean(data.training_updates),
		coachNotes: toNullableBoolean(data.coach_notes),
		weeklyRecap: toNullableBoolean(data.weekly_recap),
		readinessUpdates: toNullableBoolean(data.readiness_updates),
	};
};

const toPreferencePayload = (preferences: NotificationPreferences) => ({
	training_updates: preferences.trainingUpdates,
	coach_notes: preferences.coachNotes,
	weekly_recap: preferences.weeklyRecap,
	readiness_updates: preferences.readinessUpdates,
});

export const getMemberNotifications = async (
	options: NotificationListOptions = {},
): Promise<MemberNotification[]> => {
	if (!isEnabled(options)) return [];
	const session = requireMemberSession();
	try {
		const raw = await wsApi()
			.get("notifications", {
				searchParams: {
					select: "id,title,body,kind,entity_id,link,read_at,created_at",
					user_id: `eq.${session.user.id}`,
					order: "created_at.desc",
					limit: String(
						normalizeLimit(options.limit ?? DEFAULT_LIMIT),
					),
				},
			})
			.json<unknown>();
		return normalizeNotifications(raw);
	} catch (error) {
		const normalizedError = await toWSApiError(error);
		if (isUnavailable(normalizedError)) return [];
		throw normalizedError;
	}
};

export const getMemberNotificationPreferences = async (
	options: NotificationServiceOptions = {},
): Promise<NotificationPreferences | null> => {
	if (!isEnabled(options)) return null;
	requireMemberSession();
	try {
		const raw = await wsRpc<unknown>(
			"get_member_notification_preferences",
			{},
		);
		return normalizeNotificationPreferences(raw);
	} catch (error) {
		if (isUnavailable(error)) return null;
		throw error;
	}
};

export const setMemberNotificationPreferences = async (
	preferences: NotificationPreferences,
	options: NotificationServiceOptions = {},
): Promise<void> => {
	if (!isEnabled(options)) return;
	requireMemberSession();
	try {
		await wsRpc("set_member_notification_preferences", {
			p_preferences: toPreferencePayload(preferences),
		});
	} catch (error) {
		if (isUnavailable(error)) return;
		throw error;
	}
};

export const markNotificationRead = async (
	notificationId: string,
	options: NotificationServiceOptions = {},
): Promise<void> => {
	if (!isEnabled(options)) return;
	requireMemberSession();
	if (!notificationId.trim())
		throw new WSApiError("unknown", "Notification id is required.");
	try {
		await wsRpc("mark_notification_read", { p_id: notificationId });
	} catch (error) {
		if (isUnavailable(error)) return;
		throw error;
	}
};

export const markAllNotificationsRead = async (
	options: NotificationServiceOptions = {},
): Promise<void> => {
	if (!isEnabled(options)) return;
	requireMemberSession();
	try {
		await wsRpc("mark_all_notifications_read", {});
	} catch (error) {
		if (isUnavailable(error)) return;
		throw error;
	}
};

export const registerNotificationDevice = async (
	input: NotificationDeviceInput,
	options: NotificationServiceOptions = {},
): Promise<void> => {
	if (!isEnabled(options)) return;
	requireMemberSession();
	if (!input.deviceToken.trim())
		throw new WSApiError(
			"unknown",
			"Notification device token is required.",
		);
	try {
		const params: Record<string, unknown> = {
			p_device_token: input.deviceToken,
			p_platform: input.platform,
		};
		if (input.deviceId !== undefined) params.p_device_id = input.deviceId;
		if (input.appVersion !== undefined)
			params.p_app_version = input.appVersion;
		await wsRpc("register_member_notification_device", params);
	} catch (error) {
		if (isUnavailable(error)) return;
		throw error;
	}
};
