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
	show_subscription_form: z.boolean().optional(),
	show_payment_form: boolOrOneZero,
	show_billing_form: boolOrOneZero,
	billing_agreement_accepted: boolOrOneZero,
	device_type: z.number().nullable().optional(),
	push_token: z.string().nullable().optional(),
	profile_image: z.string().url().optional(),
	gym_logo: z.string().url().optional(),
	banner_image: z.string().nullable().optional(),
	unread_item: z.number().optional(),
	eula_accepted: boolOrOneZero,
	has_waived_subscriptions: boolOrOneZero,
	has_paid_subscriptions: boolOrOneZero,
	waiver_accepted: boolOrOneZero,
	has_payment_details: z
		.union([z.boolean(), z.string(), z.literal(1), z.literal(0)])
		.optional(),
	is_staff: boolOrOneZero,
	notice: z.string().optional(),
	last_login: z
		.union([z.boolean().nullable(), z.string().nullable()])
		.optional(),
	is_health_captured: boolOrOneZero,
	allow_leaderboards: boolOrOneZero,
	allow_leaderboards_comment: boolOrOneZero,
	is_parent: boolOrOneZero,
	is_child: boolOrOneZero,
	from_parent: z.boolean().optional(),
	parent_id: z.number().optional(),
	onboarding_gym_ids: z.array(z.number()).optional(),
	emergency_contact_name: z.string().nullish(),
	emergency_contact_number: z.string().nullish(),
	has_previous_subscriptions: z.boolean().default(false),
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
	emergency_contact_name: z.string().nullable().optional(),
	emergency_contact_number: z.string().nullable().optional(),
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
	is_staff: boolOrOneZero.optional(),
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
	contact_phone: z.union([z.string(), z.array(z.string())]).optional(),
	created_at: z.string().optional(),
	created_by: z.number().optional(),
	default_team_id: z.number().optional(),
	email: z.string().optional(),
	emergency_contact_name: z.string().nullish(),
	emergency_contact_number: z.string().nullish(),
	firstname: z.union([z.string(), z.array(z.string())]).optional(),
	id: z.number().optional(),
	lastname: z.union([z.string(), z.array(z.string())]).optional(),
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

export const UserDetailsSchema = z.object({
	email: z.string(),
	firstname: z.string(),
	lastname: z.string(),
	password: z.string().optional(),
	confirm_password: z.string().optional(),
});

export type UserDetailsType = z.infer<typeof UserDetailsSchema>;

export const ValidateInviteCodeDataSchema = z.object({
	exists: z.boolean(),
	gymDetails: z.object({
		id: z.number(),
		name: z.string(),
		small_logo: z.string(),
	}),
	userAlreadyActive: z.boolean(),
	userDetails: UserDetailsSchema,
	valid: z.boolean(),
});

export const ValidateInviteCodeDataExistsSchema = z.object({
	exists: z.boolean(),
	valid: z.boolean(),
});

export type ValidateInviteCodeDataType = z.infer<
	typeof ValidateInviteCodeDataSchema
>;

export type ValidateInviteCodeDataExistsType = z.infer<
	typeof ValidateInviteCodeDataExistsSchema
>;

export type ValidateInviteCodeResponseType = {
	data: ValidateInviteCodeDataType;
	message: string;
	error: boolean;
};

export const FialedInvoiceSchema = z.array(
	z.object({
		name: z.string(),
		id: z.number(),
		created_at: z.string(),
		amount: z.number(),
		apply_transaction_fees_to_member: boolOrOneZero,
	}),
);

export const HealthSchema = z.object({
	allergies: z.array(
		z.object({
			id: z.number(),
			user_id: z.number(),
			allergy: z.string(),
			requires_treatment_plan: boolOrOneZero,
			notes: z.string(),
			deleted_at: z.string().nullish(),
			created_at: z.string(),
			updated_at: z.string(),
		}),
	),
	pre_existing_conditions: z.array(
		z.object({
			advised_to_limit_activities: boolOrOneZero,
			condition: z.string(),
			created_at: z.string(),
			deleted_at: z.string().nullish(),
			id: z.number(),
			notes_and_limitations: z.string(),
			updated_at: z.string(),
			user_id: z.number(),
		}),
	),
	prescriptions: z.array(
		z.object({
			advised_to_limit_activities: boolOrOneZero,
			medication: z.string(),
			created_at: z.string(),
			deleted_at: z.string().nullable(),
			id: z.number(),
			notes_and_limitations: z.string(),
			updated_at: z.string(),
			user_id: z.number(),
		}),
	),
	has_permission: z.boolean(),
});

export const InjuriesSchema = z.object({
	has_permission: z.boolean(),
	injuries: z.array(
		z.object({
			id: z.number(),
			user_id: z.number(),
			body_side: z.string(),
			body_part: z.string(),
			description: z.string(),
			when_injury_occured: z.string(),
			advised_to_limit_activities: boolOrOneZero,
			activity_limitations: z.string(),
			deleted_at: z.string().nullable(),
			created_at: z.string(),
			updated_at: z.string(),
		}),
	),
});

export const ProfileSchema = z.object({
	dob: z.string().nullish(),
	gender: z.string().nullish(),
	contact_phone: z.string().nullish(),
	emergency_contact_name: z.string().nullish(),
	emergency_contact_number: z.string().nullish(),
	height: z.number().optional(),
	payment_method: z.string().nullish(),
	weight: z.number().optional(),
	memberships: z.array(
		z.object({
			name: z.string(),
			start_date: z.string(),
			expiration_date: z.string().nullish(),
			status: z.string(),
		}),
	),
});

export type FailedInvoiceType = z.infer<typeof FialedInvoiceSchema>;
export type HealthType = z.infer<typeof HealthSchema>;
export type InjuriesType = z.infer<typeof InjuriesSchema>;
export type ProfileType = z.infer<typeof ProfileSchema>;
