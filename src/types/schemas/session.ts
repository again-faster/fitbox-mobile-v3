import { z } from 'zod';
import { boolOrOneZero } from './common';
import { apiResponseSchema } from './response';

export const BookableSchema = z.object({
	group_class: z.string(),
	payment_details: z.string(),
	group_member: z.string(),
});

export const WaitlistInfoSchema = z.object({
	enable_waitlist: boolOrOneZero,
	waitlist_timelimit: z.number().nullable(),
});

export const FBClassSchema = z.object({
	id: z.number(),
	context_id: z.number(),
	name: z.string(),
	description: z.string(),
	start_date: z.string(),
	end_date: z.string().nullable(),
	deleted_at: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
	type_id: z.number(),
	is_private: boolOrOneZero,
	attendance_limit: z.number().nullable(),
	created_by: z.number(),
	locktime_HH: z.number(),
	locktime_MM: z.number(),
	class_colour_hex: z.string(),
	class_visibility: z.number(),
	is_free_class: boolOrOneZero,
});

export const CalendarEventSchema = z.object({
	id: z.number(),
	comment: z.string(),
	description: z.string(),
	event_type_id: z.number(),
	code: z.string(),
	ref_id: z.number(),
	variant: z.string().nullable(),
	sender_user_id: z.number(),
	updated_by: z.string().nullable(),
	context_id: z.number(),
	attendance_limit: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
	venue_id: z.number().nullable(),
	start_datetime: z.string(),
	end_datetime: z.string(),
	duration: z.number(),
	alert: z.string(),
	repeat: z.string(),
	until_end_date: z.string(),
	display_after: z.string(),
	all_day: boolOrOneZero,
	enabled_sunday: boolOrOneZero,
	enabled_monday: boolOrOneZero,
	enabled_tuesday: boolOrOneZero,
	enabled_wednesday: boolOrOneZero,
	enabled_thursday: boolOrOneZero,
	enabled_friday: boolOrOneZero,
	enabled_saturday: boolOrOneZero,
	record_timezone: z.string(),
	event_timezone: z.string(),
	video_link: z.string().nullable(),
	locktime_HH: z.number(),
	locktime_MM: z.number(),
	booking_HH: z.number(),
	booking_MM: z.number(),
});

export const SessionSchema = apiResponseSchema(
	z.array(
		z.object({
			id: z.number(),
			context_id: z.number(),
			leaderboard_id: z.number(),
			user_id: z.number(),
			program_wod_id: z.number(),
			class_id: z.number(),
			event_id: z.number(),
			session_date: z.string(),
			session_date_utc: z.string().nullable(),
			ranking: z.string(),
			created_at: z.string(),
			updated_at: z.string(),
			deleted_at: z.string().nullable(),
			status: z.string(),
			subscription_id: z.number(),
			waitlist: z.array(z.any()).nullable(),
			bookable: BookableSchema,
			waitlist_info: WaitlistInfoSchema,
			fb_class: FBClassSchema,
			calendar_event: CalendarEventSchema,
		}),
	),
);

export type ParsedSessionSchemaType = z.infer<typeof ParsedSessionSchema>;
export const ParsedSessionSchema = z.object({
	event_id: z.number(),
	bookable: BookableSchema,
	start_time: z.string(),
	end_time: z.string(),
	name: z.string(),
	event: CalendarEventSchema,
	is_attend: z.boolean(),
	class_id: z.number(),
	waitlistEnabled: z.boolean(),
	waitlistTime: z.number(),
});
