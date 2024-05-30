import { z } from 'zod';
import {
	GymClassSchema,
	GymInfoSchema,
	GymSchema,
	GymVenueSchema,
} from './gym';
import { MessageItemSchema } from './message';
import {
	CardDetailsSchema,
	PaymentInfoDataSchema,
	PaymentIntentSchema,
	PaymentMethodSchema,
} from './payment';
import {
	BookedSessionSchema,
	SessionDetailSchema,
	SessionSchema,
	StaffBookedSessionSchema,
} from './session';
import {
	SubscriptionDetailsSchema,
	SubscriptionSaveSchema,
	SubscriptionSchema,
	TransactionsSchema,
	UserSubscriptionProductsSchema,
} from './subscription';
import {
	ChildDataSchema,
	ParentInfoSchema,
	UserHealthInfoSchema,
	UserProfileSchema,
	UserSchema,
} from './user';
import { WaiverSchema } from './waivers';

export const apiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) =>
	z.object({
		// data could be any key in object
		data: dataSchema,
		message: z.string(),
		error: z.boolean(),
	});

export type LoginResponseSchemaType = z.infer<typeof LoginResponseSchema>;
export const LoginResponseSchema = z.object({
	id: z.number(),
	error: z.boolean(),
	token: z.string(),
	user_data: UserSchema,
});

export const GetConversationListResponseSchema = z.object({
	data: z.array(MessageItemSchema),
	message: z.string(),
	error: z.boolean(),
	total_items: z.number(),
});

export const GetUserGymInfoResponseSchema = z.object({
	gym_info: GymInfoSchema,
	message: z.string(),
	error: z.boolean(),
});

export const GetScheduleListResponseSchema = apiResponseSchema(
	z.array(SessionSchema),
);

export const GetScheduleDetailResponseSchema =
	apiResponseSchema(SessionDetailSchema);

export const GetUserGymResponseSchema = apiResponseSchema(z.array(GymSchema));

export const CheckEmailResponseSchema = apiResponseSchema(
	z.object({
		exists: z.boolean().optional(),
		isActive: z.boolean().optional(),
		pendingInvite: z.boolean().optional(),
	}),
);

export const BookedSessionResponseSchema = z.object({
	data: z.array(BookedSessionSchema),
	staffSessions: z.array(StaffBookedSessionSchema),
	message: z.string(),
	error: z.boolean(),
});

export const GetUserProfileResponseSchema = z.object({
	error: z.boolean(),
	message: z.string(),
	user_data: UserProfileSchema,
});

export const UpdateUserProfileSchema = z.object({
	error: z.boolean(),
	message: z.string(),
	user_data: UserProfileSchema,
});

export const UpdateUserProfilePayloadSchema = z.object({
	id: z.number().optional(),
	firstname: z.string().optional(),
	lastname: z.string().optional(),
	dob: z.string().optional(),
	gender: z.string().optional(),
	email: z.string().optional(),
	contact_phone: z.string().optional(),
	height: z.number().optional(),
	current_weight: z.number().optional(),
	weight_unit: z.string().optional(),
	emergency_contact_name: z.string().optional(),
	emergency_contact_number: z.string().optional(),
	default_team_id: z.number().optional(),
});

export type UpdateUserProfileTypes = z.infer<
	typeof UpdateUserProfilePayloadSchema
>;

export const AttendSessionResponseSchema = z.object({
	error: z.boolean(),
	message: z.string(),
	allow_override: z.boolean().optional(),
});

export const GetSubscriptionInfoSchema = z.object({
	current: z.array(SubscriptionSchema),
	notify_email_subscription: z.number(),
	past: z.array(SubscriptionSchema),
	suspended: z.array(SubscriptionSchema),
	transactions: z.array(TransactionsSchema),
});

export type GetSubscriptionInfoType = z.infer<typeof GetSubscriptionInfoSchema>;

export const GetSubscriptionDetailsSchema = z.array(SubscriptionDetailsSchema);
export type GetSubscriptionDetailsType = z.infer<
	typeof GetSubscriptionDetailsSchema
>;

export const GetUserSubscriptionProductsSchema = apiResponseSchema(
	z.array(UserSubscriptionProductsSchema),
);
export type GetUserSubscriptionProductsType = z.infer<
	typeof GetUserSubscriptionProductsSchema
>;

export const SaveSubscriptionSchema = apiResponseSchema(
	z.object({
		product: UserSubscriptionProductsSchema,
		subscription: SubscriptionSaveSchema,
	}),
);
export const GetGymVenuesResponseSchema = z.array(GymVenueSchema);
export const GeyGymClassesResponseSchema = apiResponseSchema(
	z.array(GymClassSchema),
);

export const GetPaymentInfoSchema = apiResponseSchema(PaymentInfoDataSchema);

export const SetupPaymentIntentSchema = z.object({
	message: z.string(),
	success: z.boolean(),
});

export const GetPaymentMethodSchema = PaymentMethodSchema;
export const StripeGetCardDetails = CardDetailsSchema;
export const SetupPaymentIntent = PaymentIntentSchema;
export const GetAcceptedWaiversSchema = apiResponseSchema(
	z.array(WaiverSchema),
);
export const GetEulaSchema = z.object({
	error: z.boolean(),
	message: z.string(),
	eula: z.string(),
});

export const ErrorMessageResponse = z.object({
	error: z.boolean(),
	message: z.string(),
});

export const GetWaiverSchema = z.object({
	error: z.boolean(),
	message: z.string(),
	url: z.string(),
});
export const GetChildInfoSchema = z.object({
	error: z.boolean(),
	message: z.string(),
	child_data: z.array(ChildDataSchema),
});

export const GetParentInfoSchema = z.object({
	error: z.boolean(),
	message: z.string(),
	parent_data: z.array(ParentInfoSchema),
});

export type GetChildInfoType = z.infer<typeof GetChildInfoSchema>;
export type GetParentInfoType = z.infer<typeof GetParentInfoSchema>;

export const SwitchAccountSchema = z.object({
	error: z.boolean(),
	id: z.number(),
	message: z.string(),
	token: z.string(),
	user_data: UserSchema,
});
export const GetUserHealthInfo = UserHealthInfoSchema;
