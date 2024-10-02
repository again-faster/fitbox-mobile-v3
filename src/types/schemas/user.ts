import { z } from 'zod';
import { GenderSchema, boolOrOneZero } from './common';

export const UserSchema = z.object({
	user_id: z.number(),
	first_name: z.string(),
	last_name: z.string(),
	face_id: z.null().optional(),
	email: z.string().email(),
	contact_phone: z.string().nullable(),
	dob: z.object({
		date: z.string(),
		timezone_type: z.literal(3),
		timezone: z.string(),
	}),
	height: z.number(),
	current_weight: z.number(),
	gender: GenderSchema,
	show_subscription_from: z.boolean().optional(),
	show_payment_form: boolOrOneZero,
	show_billing_form: boolOrOneZero,
	billing_agreement_accepted: boolOrOneZero,
	device_type: z.number().nullable().optional(),
	push_token: z.string().nullable(),
	profile_image: z.string().url(),
	gym_logo: z.string().url(),
	banner_image: z.string().nullable(),
	unread_item: z.number(),
	eula_accepted: boolOrOneZero,
	has_waived_subscriptions: boolOrOneZero,
	has_paid_subscriptions: boolOrOneZero,
	waiver_accepted: boolOrOneZero,
	has_payment_details: z.union([
		z.boolean(),
		z.string(),
		z.literal(1),
		z.literal(0),
	]),
	is_staff: boolOrOneZero,
	notice: z.string(),
	last_login: z.union([z.boolean().nullable(), z.string().nullable()]),
	is_health_captured: boolOrOneZero,
	allow_leaderboards: boolOrOneZero,
	allow_leaderboards_comment: boolOrOneZero,
	is_parent: boolOrOneZero,
	is_child: boolOrOneZero,
	from_parent: z.boolean().optional(),
	parent_id: z.number(),
	onboarding_gym_ids: z.array(z.number()).optional(),
	emergency_contact_name: z.string().nullable().optional(),
	emergency_contact_number: z.string().nullable().optional(),
});

export const UserProfileSchema = z.object({
	address1: z.string().optional(),
	address2: z.string().optional(),
	city: z.string().optional(),
	contact_phone: z.string().nullable(),
	current_weight: z.number(),
	dob: z.object({
		date: z.string(),
		timezone: z.string(),
		timezone_type: z.number(),
	}),
	email: z.string(),
	emergency_contact_name: z.string().nullable(),
	emergency_contact_number: z.string().nullable(),
	eula_accepted: z.number().optional(),
	face_id: z.any().optional(),
	first_name: z.string(),
	gender: GenderSchema,
	has_payment_details: z.number().optional(),
	height: z.number(),
	last_name: z.string(),
	postcode: z.string().optional(),
	profile_image: z.string(),
	state: z.string().optional(),
	timezone: z.string(),
	user_id: z.number(),
	waiver_accepted: z.number().optional(),
});

export const ChildrenInfoSchema = z.object({
	child_id: z.number(),
	child_info: z.object({
		email: z.string(),
		firstname: z.string(),
		id: z.number(),
		lastname: z.string(),
		profile_image: z.string().optional(),
	}),
	context_id: z.number(),
	profile_image: z.string().optional(),
});

export const ParentInfoSchema = z.object({
	email: z.string(),
	firstname: z.string(),
	id: z.number(),
	lastname: z.string(),
	profile_image: z.string().optional(),
});
export const ChildDataSchema = z.object({
	children: z.array(ChildrenInfoSchema),
	context_id: z.number(),
	parent_id: z.number(),
});

export const RegisterUserDataSchema = z.object({
	completed_profile: z.number().optional(),
	contact_phone: z.string().optional(),
	created_at: z.string().optional(),
	created_by: z.number().optional(),
	default_team_id: z.number().optional(),
	email: z.string().optional(),
	emergency_contact_name: z.string().optional(),
	emergency_contact_number: z.string().optional(),
	firstname: z.string().optional(),
	id: z.number().optional(),
	lastname: z.string().optional(),
	timezone: z.string().optional(),
	updated_at: z.string().optional(),
	updated_by: z.number().optional(),
	password: z.array(z.string()).optional(),
	password_confirmation: z.array(z.string()).optional(),
});

export type RegisterUserDataType = z.infer<typeof RegisterUserDataSchema>;

export type ChildrenType = z.infer<typeof ChildrenInfoSchema>;
export type ParentType = z.infer<typeof ParentInfoSchema>;
export const UserHealthInfoSchema = z.object({
	allergies: z.array(z.any()),
	injuries: z.array(z.any()),
	pre_existing: z.array(z.any()),
	prescription: z.array(z.any()),
});

export type UserProfileType = z.infer<typeof UserProfileSchema>;
export type UserSchemaType = z.infer<typeof UserSchema>;
export type UserHealthInfoType = z.infer<typeof UserHealthInfoSchema>;
