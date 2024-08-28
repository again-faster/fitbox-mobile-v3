import { z } from 'zod';

export const NotificationsDataSchema = z.object({
	data: z.object({
		screen: z.string(),
		session: z.array(z.unknown()),
	}),
	screen: z.string(),
	session: z.object({
		color: z.string(),
		endTime: z.string(),
		id: z.number(),
		isCoach: z.boolean(),
		startTime: z.string(),
		title: z.string(),
		waitlistEnabled: z.boolean(),
		waitlistTime: z.number(),
	}),
	type: z.string().optional(),
	user_list: z.string().optional(),
	convo_id: z.number().optional(),
	sender_name: z.string().optional(),
});

export const NotificationsSchema = z.object({
	channelId: z.string(),
	data: NotificationsDataSchema,
	finish: z.function(),
	fireDate: z.number(),
	foreground: z.boolean(),
	id: z.string(),
	message: z.string(),
	title: z.string(),
	userInteraction: z.boolean(),
	identifier: z.unknown(),
});

export const MessageNotificationsSchema = z.object({
	android: z.object({
		sound: z.string(),
	}),
	body: z.string(),
	title: z.string(),
});

export const MessageSchema = z.object({
	collapseKey: z.string(),
	data: z.object({
		convo_id: z.string(),
		message_id: z.string(),
		sender_id: z.string(),
		sender_name: z.string(),
		team_id: z.string(),
		type: z.string(),
		user_list: z.string(),
	}),
	from: z.string(),
	messageId: z.string(),
	notification: MessageNotificationsSchema,
	sentTime: z.number(),
	ttl: z.number(),
});

type NotificationSetting = {
	title: string;
	description: string;
	defaultValue: boolean;
	disabled: boolean;
};

export type NotificationSettings = {
	[key: string]: NotificationSetting;
};

export type NotificationSettingsState = {
	[key: string]: boolean;
};

export type MessageType = z.infer<typeof MessageSchema>;
export type NotificationsType = z.infer<typeof NotificationsSchema>;
export type MessageNotificationsType = z.infer<
	typeof MessageNotificationsSchema
>;
export type NotificationsDataType = z.infer<typeof NotificationsDataSchema>;
