import { z } from 'zod';
import { boolOrOneZero } from './common';

export type Gym = z.infer<typeof GymSchema>;
export const GymSchema = z.object({
	id: z.number(),
	logo: z.string(),
	name: z.string(),
});

export const GymInfoSchema = z.object({
	member_roles: z.array(z.any()),
	required_profile_fields: z.array(z.string()),
	allow_leaderboards: boolOrOneZero,
	mobile_force_update: boolOrOneZero,
	country: z.optional(z.string()),
	gym_lookup: z.number(),
	logo: z.string(),
	banner: z.string().nullable(),
	num_of_unread_messages: z.number(),
	allow_leaderboards_comment: boolOrOneZero,
	online_store: z.string(),
	name: z.string().optional(),
	website: z.string().optional(),
});

export type GymInfoType = z.infer<typeof GymInfoSchema>;

export type GymVenueType = z.infer<typeof GymVenueSchema>;
export const GymVenueSchema = z.object({
	id: z.number(),
	name: z.string(),
	location: z.string(),
});

export type GymClassType = z.infer<typeof GymClassSchema>;
export const GymClassSchema = z.object({
	id: z.number(),
	name: z.string(),
});
