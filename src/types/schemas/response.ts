import { z } from 'zod';
import { GymInfoSchema, GymSchema } from './gym';
import { MessageItemSchema } from './message';
import { BookedSessionSchema, SessionSchema } from './session';
import { UserProfileSchema, UserSchema } from './user';

export const apiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) =>
	z.object({
		// data could be any key in object
		data: dataSchema,
		message: z.string(),
		error: z.boolean(),
	});

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

export const GetUserGymResponseSchema = apiResponseSchema(z.array(GymSchema));

export const CheckEmailResponseSchema = apiResponseSchema(
	z.object({
		exists: z.boolean().optional(),
		isActive: z.boolean().optional(),
		pendingInvite: z.boolean().optional(),
	}),
);

export const BookedSessionResponseSchema = apiResponseSchema(
	z.array(BookedSessionSchema),
);
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
	id: z.number(),
	firstname: z.string(),
	lastname: z.string(),
	dob: z.string(),
	gender: z.string(),
	email: z.string(),
	contact_phone: z.string(),
	height: z.number(),
	current_weight: z.number(),
	weight_unit: z.string(),
	emergency_contact_name: z.string().optional(),
	emergency_contact_number: z.string().optional(),
});

export type UpdateUserProfileTypes = z.infer<
	typeof UpdateUserProfilePayloadSchema
>;

export const AttendSessionResponseSchema = z.object({
	error: z.boolean(),
	message: z.string(),
	allow_override: z.boolean().optional(),
});
