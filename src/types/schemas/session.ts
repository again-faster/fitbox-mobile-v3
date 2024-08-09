import { z } from 'zod';
import { boolOrOneZero } from './common';

export type BookableSchemaType = z.infer<typeof BookableSchema>;
export const BookableSchema = z.object({
	group_class: z.string(),
	payment_details: z.string(),
	group_member: z.string(),
});

export const WaitlistInfoSchema = z.object({
	enable_waitlist: z.number().nullish(),
	waitlist_timelimit: z.number().nullish(),
});

export type FBClassSchemaType = z.infer<typeof FBClassSchema>;
export const FBClassSchema = z.object({
	id: z.number(),
	context_id: z.number(),
	name: z.string(),
	description: z.string(),
	start_date: z.string(),
	end_date: z.string().nullish(),
	deleted_at: z.string().nullish(),
	created_at: z.string(),
	updated_at: z.string(),
	type_id: z.number(),
	is_private: boolOrOneZero,
	attendance_limit: z.number().nullish(),
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
	variant: z.string().nullish(),
	sender_user_id: z.number(),
	updated_by: z.number().nullish(),
	context_id: z.number(),
	attendance_limit: z.number().nullish(),
	created_at: z.string(),
	updated_at: z.string(),
	venue_id: z.number().nullable(),
	venue_name: z.string().optional(),
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
	video_link: z.string().nullish(),
	locktime_HH: z.number(),
	locktime_MM: z.number(),
	booking_HH: z.number(),
	booking_MM: z.number(),
});

export const StaffSessionSchema = z.object({
	id: z.number(),
	context_id: z.number(),
	leaderboard_id: z.number(),
	user_id: z.number(),
	program_wod_id: z.number(),
	class_id: z.number(),
	event_id: z.number(),
	session_date: z.string(),
	session_date_utc: z.string().nullish(),
	ranking: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	deleted_at: z.string().nullish(),
	status: z.string(),
	subscription_id: z.number(),
	waitlist: z.array(z.any()).nullish(),
	bookable: BookableSchema,
	waitlist_info: WaitlistInfoSchema,
	fb_class: FBClassSchema,
	calendar_event: CalendarEventSchema,
});

export const StaffBookedSessionSchema = z.object({
	id: z.number(),
	title: z.string(),
	start: z.string(),
	end: z.string(),
	venue_id: z.number().nullish(),
	venue_name: z.string().nullish(),
});

export const BookedSessionSchema = z.object({
	id: z.number(),
	context_id: z.number(),
	leaderboard_id: z.number().nullish(),
	user_id: z.number(),
	program_wod_id: z.number().nullish(),
	class_id: z.number(),
	event_id: z.number(),
	session_date: z.string(),
	session_date_utc: z.string().nullish(),
	ranking: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	deleted_at: z.string().nullish(),
	status: z.string(),
	subscription_id: z.number(),
	waitlist: z.array(z.any()).nullish(),
	bookable: BookableSchema,
	waitlist_info: WaitlistInfoSchema,
	fb_class: FBClassSchema,
	calendar_event: CalendarEventSchema,
});

export type ParsedBookedSessionSchemaType = z.infer<
	typeof ParsedBookedSessionSchema
>;
export const ParsedBookedSessionSchema = z.object({
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
	venue: z.string().nullish(),
});

export type SessionClassSchemaType = z.infer<typeof SessionClassSchema>;
export const SessionClassSchema = z.object({
	id: z.number(),
	context_id: z.number(),
	name: z.string(),
	description: z.string(),
	type_id: z.number(),
	start_date: z.string(),
	end_date: z.string().nullish(),
	is_private: boolOrOneZero,
	attendance_limit: z.number().nullish(),
	class_colour_hex: z.string(),
	class_visibility: z.number(),
	is_free_class: boolOrOneZero,
	class_waitlist: z.array(z.any()).nullish(),
});

export const AttendanceSchema = z.object({
	id: z.number(),
	context_id: z.number(),
	leaderboard_id: z.number().nullish(),
	user_id: z.number(),
	program_wod_id: z.number().nullish(),
	class_id: z.number(),
	event_id: z.number(),
	session_date: z.string(),
	session_date_utc: z.string().nullish(),
	ranking: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	deleted_at: z.string().nullish(),
	status: z.string(),
	subscription_id: z.number(),
});

export const SessionWaitlistSchema = z.object({
	calendar_event_id: z.number(),
	user_id: z.number(),
});

export type SessionSchemaType = z.infer<typeof SessionSchema>;
export const SessionSchema = z.object({
	id: z.number(),
	event_id: z.number(),
	title: z.string(),
	description: z.string(),
	start: z.string(),
	end: z.string(),
	venue: z.string(),
	venue_id: z.number().nullish(),
	user_start_iso: z.string(),
	user_end_iso: z.string(),
	timezone: z.string(),
	startTime: z.string(),
	duration: z.number(),
	allDay: z.boolean(),
	bg_colour_hex: z.string(),
	fg_colour_hex: z.string(),
	attachments: z.array(z.any()).nullish(),
	code: z.string(),
	utc_start: z.string(),
	utc_end: z.string(),
	utc_startTime: z.string(),
	event_type_id: z.number(),
	sender: z.number(),
	repeat: z.boolean(),
	repeatUntil: z.string(),
	alert: z.string(),
	locktime_HH: z.number(),
	locktime_MM: z.number(),
	booking_HH: z.number(),
	booking_MM: z.number(),
	event_timezone: z.string(),
	user_timezone: z.string(),
	local_start: z.string(),
	local_end: z.string(),
	local_startTime: z.string(),
	local_start_iso: z.string(),
	local_end_iso: z.string(),
	member_attendance: z.array(AttendanceSchema).nullish(),
	member_waitlist: z.array(SessionWaitlistSchema),
	attendance_limit: z.number().nullish(),
	waitlist: WaitlistInfoSchema,
	bookable: BookableSchema,
	class: SessionClassSchema,
	fb_class: FBClassSchema.nullish(),
	read_only: z.string(),
	user_editable: z.boolean(),
	variant: z.string().nullish(),
	isCoach: z.boolean(),
});

export const ClassEventSchema = z.object({
	class_id: z.number(),
	event_id: z.number(),
	workout_id: z.number(),
	coaches: z.array(z.array(z.union([z.number(), z.string()]))),
	created_at: z.string(),
	updated_at: z.string(),
	id: z.number(),
});

export type SessionWODMovementDetailsSchemaType = z.infer<
	typeof SessionWODMovementDetailsSchema
>;

export const SessionWODMovementDetailsSchema = z.object({
	id: z.number(),
	context_id: z.number(),
	name: z.string(),
	description: z.string(),
	gymnastics: z.boolean(),
	weightlifting: z.boolean(),
	monostructural: z.boolean(),
	weight: z.boolean(),
	height: z.boolean(),
	bodyweight: z.boolean(),
	distance: z.boolean(),
	calories: z.boolean(),
	time: z.boolean(),
	other: z.string(),
	w_distance: z.string(),
	bw_weight1: z.string(),
	bw_distance1: z.string(),
	bw_weight2: z.string(),
	bw_distance2: z.string(),
	video_template: z.string().nullish(),
	created_at: z.string().nullish(),
	updated_at: z.string().nullish(),
	deleted_at: z.string().nullish(),
});

export type SessionWODMovementSchemaType = z.infer<
	typeof SessionWODMovementSchema
>;
export const SessionWODMovementSchema = z.object({
	id: z.number(),
	wod_section_id: z.number(),
	movement_id: z.number(),
	scored: z.boolean(),
	reps: z.string().nullable(),
	height_male: z.string().nullable(),
	height_female: z.string().nullable(),
	height_unit: z.string().nullable(),
	weight_male: z.string().nullable(),
	weight_female: z.string().nullable(),
	weight_unit: z.string().nullable(),
	calories: z.string().nullable(),
	calories_male: z.string().nullable(),
	calories_female: z.string().nullable(),
	distance_male: z.string().nullable(),
	distance_female: z.string().nullable(),
	distance: z.string().nullish(),
	distance_unit: z.string(),
	time: z.number().nullish(),
	time_unit: z.string(),
	sequence: z.number(),
	notes: z.string(),
	video: z.string().nullish(),
	created_at: z.string(),
	updated_at: z.string(),
	deleted_at: z.string().nullish(),
	movement: SessionWODMovementDetailsSchema,
});

export const SessionFBWODSchema = z.object({
	id: z.number(),
	context_id: z.number(),
	name: z.string(),
	summary: z.string(),
	is_benchmark: z.number(),
	created_at: z.string(),
	updated_at: z.string(),
	deleted_at: z.string().nullish(),
	notes: z.string(),
	wod_section: z.object({
		id: z.number(),
		belong_benchmark_wod_id: z.number().nullish(),
		belong_program_wod_id: z.number().nullish(),
		has_benchmark_wod_id: z.number().nullish(),
		name: z.string(),
		scored: z.boolean(),
		scoring_by: z.string(),
		scoring_type_id: z.number().nullable(),
		rounds: z.number(),
		sets: z.number().nullish(),
		reps: z.string(),
		duration: z.number().nullish(),
		sequence: z.number().nullish(),
		created_at: z.string(),
		updated_at: z.string(),
		deleted_at: z.string().nullish(),
		text_section: z.string().nullish(),
		publishing_rule: z.string().nullish(),
		video: z.string().nullish(),
		is_leaderboard: boolOrOneZero,
		allow_sets_or_round_scoring: boolOrOneZero,
		member_notes: z.string().nullable(),
		coach_notes: z.string().nullable(),
		default_collapse_state: boolOrOneZero,
		staff_only: boolOrOneZero,
		wod_movements: z.array(SessionWODMovementSchema).nullish(),
	}),
});

export type SessionSectionSchemaType = z.infer<typeof SessionSectionSchema>;
export const SessionSectionSchema = z.object({
	default_collapse_state: boolOrOneZero,
	video: z.string().nullish(),
	id: z.number(),
	fb_wod: SessionFBWODSchema.nullish(),
	wod_movements: z.array(SessionWODMovementSchema).nullish(),
	text_section: z.string().nullish(),
	name: z.string(),
	leaderboard_section_id: z.number().nullish(),
	scoring_type: z
		.object({
			id: z.number(),
			name: z.string(),
			unit_type: z.string(),
			method: z.string(),
		})
		.nullish(),
	scoring_type_id: z.number().nullable(),
	scoring_by: z.string().nullish(),
	sets: z.number().nullish(),
	rounds: z.number().nullish(),
	reps: z.string().nullish(),
	duration: z.number().nullish(),
	coach_notes: z.string().nullish(),
	member_notes: z.string().nullish(),
	scored: z.boolean().nullish(),
	staff_only: boolOrOneZero,
	is_leaderboard: boolOrOneZero,
	isRx: boolOrOneZero,
});

const paymentSchema = z.object({
	id: z.number(),
	user_id: z.number(),
	context_id: z.number(),
	user_type: z.string(),
	gateway: z.string(),
	method: z.string().nullable(),
	source_id: z.nullable(z.string()),
	account_id: z.string(),
	default: z.number(),
	is_active: z.number(),
	created_at: z.string(),
	updated_at: z.string(),
	payment_method_id: z.string(),
});

const attendanceSchema = z.object({
	id: z.number(),
	context_id: z.number(),
	leaderboard_id: z.number(),
	user_id: z.number(),
	program_wod_id: z.number(),
	class_id: z.number(),
	event_id: z.number(),
	session_date: z.string(),
	session_date_utc: z.nullable(z.string()),
	ranking: z.string(),
	created_at: z.string(),
	updated_at: z.string(),
	deleted_at: z.nullable(z.string()),
	status: z.string(),
	subscription_id: z.number(),
});

const MemberActiveSubscriptionSchema = z.object({
	product_id: z.number(),
	customer_id: z.number(),
	free_membership: z
		.object({
			id: z.number(),
			payment_gateway: z.string().nullable(),
			context_id: z.number(),
			remote_id: z.string(),
			name: z.string(),
			description: z.string(),
			reference: z.string(),
			set_up_price_in_cents: z.number(),
			trial_type: z.string(),
			trial_price_in_cents: z.number(),
			trial_interval: z.number(),
			trial_interval_unit: z.string(),
			price_in_cents: z.number(),
			type: z.string(),
			recurring_interval: z.number(),
			recurring_interval_unit: z.string(),
			expiration_interval: z.number(),
			expiration_interval_unit: z.string(),
			sessions_limit: z.any(),
			sessions_limit_frequency: z.any(),
			return_url: z.string(),
			return_params: z.string(),
			subscription_available_on_mobile: boolOrOneZero,
			archived: boolOrOneZero,
			notify_on_low_count: z.number(),
			apply_transaction_fees_to_member: boolOrOneZero,
			created_at: z.string(),
			updated_at: z.string(),
			show_after_signup: boolOrOneZero,
			show_existing_users: boolOrOneZero,
		})
		.nullable(),
});

const SessionMemberAttendanceUseSchema = z.object({
	id: z.number(),
	firstname: z.string(),
	lastname: z.string(),
	profile_image: z.string().url(),
	email: z.string(),
	payments: z.array(paymentSchema),
});

export type SessionMemberAttendanceSchemaType = z.infer<
	typeof SessionMemberAttendanceSchema
>;
export const SessionMemberAttendanceSchema = z.object({
	team_id: z.number(),
	user_id: z.number(),
	status: z.string(),
	role: z.string(),
	position_id: z.number(),
	created_at: z.string(),
	updated_at: z.string(),
	member_active_subscription: MemberActiveSubscriptionSchema.nullable(),
	user: SessionMemberAttendanceUseSchema,
	attendance: attendanceSchema,
});

export type NotBookedMemberSchemaType = z.infer<typeof NotBookedMemberSchema>;
export const NotBookedMemberSchema = z.object({
	user_id: z.number(),
	member_active_subscription: MemberActiveSubscriptionSchema.nullable(),
	user: SessionMemberAttendanceUseSchema,
});

export type SessionSectionDataSchemaType = z.infer<
	typeof SessionSectionDataSchema
>;
export const SessionSectionDataSchema = z
	.array(SessionSectionSchema)
	.or(z.string());

export type SessionDetailSchemaType = z.infer<typeof SessionDetailSchema>;
export const SessionDetailSchema = z.object({
	alert: z.string(),
	all_day: boolOrOneZero,
	assigned_groups: z.array(z.any()),
	assigned_members: z.array(z.any()),
	attendance_limit: z.number().nullish(),
	attendance_view: z.boolean(),
	bookable: BookableSchema,
	booking_HH: z.number(),
	booking_MM: z.number(),
	class: FBClassSchema.nullish(),
	class_event: ClassEventSchema,
	code: z.string(),
	comment: z.string(),
	context_id: z.number(),
	created_at: z.string(),
	description: z.string(),
	display_after: z.string(),
	duration: z.number(),
	enabled_friday: boolOrOneZero,
	enabled_monday: boolOrOneZero,
	enabled_saturday: boolOrOneZero,
	enabled_sunday: boolOrOneZero,
	enabled_thursday: boolOrOneZero,
	enabled_tuesday: boolOrOneZero,
	enabled_wednesday: boolOrOneZero,
	end_datetime: z.string(),
	event_timezone: z.string(),
	event_type_id: z.number(),
	fb_class: FBClassSchema,
	id: z.number(),
	large_logo: z.string(),
	locktime_HH: z.number(),
	locktime_MM: z.number(),
	member_attendance: z.array(SessionMemberAttendanceSchema),
	members_attendance: z.array(z.any()),
	not_book_members: z.array(NotBookedMemberSchema),
	record_timezone: z.string(),
	ref_id: z.number(),
	repeat: z.string(),
	sections: SessionSectionDataSchema,
	sender_user_id: z.number(),
	small_logo: z.string(),
	start_datetime: z.string(),
	until_end_date: z.string(),
	updated_at: z.string(),
	updated_by: z.number().nullish(),
	variant: z.string().nullish(),
	venue_id: z.number().nullish(),
	venue_location: z.string().nullish(),
	venue_name: z.string().nullish(),
	video_link: z.string().nullish(),
	waitlist: z.array(SessionWaitlistSchema),
});

export const ClassFiltersDataSchema = z.object({
	classIds: z.array(z.number()),
	context_id: z.number().optional(),
	created_at: z.string().optional(),
	id: z.number(),
	isDefault: z.union([z.boolean(), z.number()]),
	locationIds: z.array(z.number()),
	name: z.string(),
	sequence: z.number(),
	updated_at: z.string().optional(),
});

export type ClassFiltersDataType = z.infer<typeof ClassFiltersDataSchema>;
