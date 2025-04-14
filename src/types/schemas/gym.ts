import { z } from 'zod';
import { boolOrOneZero } from './common';

export type Gym = z.infer<typeof GymSchema>;
export const GymSchema = z.object({
	id: z.number(),
	logo: z.string(),
	name: z.string(),
	status: z.string(),
});

export const MemberRolesSchema = z.object({
	description: z.string(),
	id: z.number(),
	name: z.string(),
});

export const GymInfoSchema = z.object({
	member_roles: z.array(MemberRolesSchema),
	required_profile_fields: z.array(z.string()),
	allow_leaderboards: boolOrOneZero,
	mobile_force_update: boolOrOneZero,
	country: z.string().default('AU'),
	gym_lookup: z.union([z.number(), z.string()]),
	logo: z.string(),
	banner: z.string().nullable(),
	num_of_unread_messages: z.number(),
	allow_leaderboards_comment: boolOrOneZero,
	online_store: z.string(),
	name: z.string().optional(),
	website: z.string().optional(),
	allow_attendance_report: boolOrOneZero.optional().default(1),
});

export const JoinGymSchema = z.object({
	data: z.array(z.unknown()),
	error: z.boolean(),
	message: z.string(),
});

export const InviteEmailSchema = z.object({
	data: z.array(z.unknown()),
	error: z.boolean(),
	message: z.string(),
	resultCode: z.number().nullable(),
});

export type GymInfoType = z.infer<typeof GymInfoSchema>;
export type MemberRolesType = z.infer<typeof MemberRolesSchema>;

export type GymVenueType = z.infer<typeof GymVenueSchema>;
export const GymVenueSchema = z.object({
	id: z.number().nullable(),
	name: z.string(),
	location: z.string(),
	is_selected: z.boolean().optional(),
});

export type GymClassType = z.infer<typeof GymClassSchema>;
export const GymClassSchema = z.object({
	id: z.number().nullable(),
	name: z.string(),
	location: z.string().optional(),
	is_selected: z.boolean().optional(),
});
