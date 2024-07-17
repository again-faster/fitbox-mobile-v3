import { z } from 'zod';

export const SectionSchema = z.object({
	id: z.number(),
	name: z.string(),
	scoring_type_id: z.number(),
	scored: z.boolean(),
	scoring_by: z.string(),
	rounds: z.number().nullable(),
	sets: z.number().nullable(),
	reps: z.string().nullable(),
	duration: z.number(),
	sequence: z.number(),
	scoring_type: z.object({
		id: z.number(),
		context_id: z.number(),
		name: z.string(),
		unit_type: z.string(),
		method: z.string(),
		default_param: z.unknown().nullable(),
		created_at: z.unknown().nullable(),
		updated_at: z.string(),
		sort_type: z.string(),
		hidden_to: z.unknown().nullable(),
	}),
});

export const LeaderboardsDataSchema = z.object({
	firstname: z.string(),
	lastname: z.string(),
	gender: z.string().nullable(),
	profile_image: z.string(),
	venue_id: z.number().nullable(),
	score_type: z.string().nullable(),
	value: z.string().optional(),
	num_of_applause: z.number().optional(),
	applause_type: z.string().nullable(),
	applaused: z.number(),
	applaused_type: z.string().nullable(),
	commented: z.number(),
	score_id: z.number(),
	num_of_comments: z.number(),
	user_id: z.number(),
	age: z.number().nullable(),
	wod_section_id: z.number(),
	wod_attendance_id: z.number(),
	sequence: z.number(),
	reps: z.union([z.string(), z.number()]),
	is_PR: z.number(),
	section: SectionSchema,
});

export const ScoreDetailsDataSchema = z.object({
	firstname: z.string(),
	lastname: z.string(),
	profile_image: z.string(),
	score_id: z.number(),
	score_type: z.string(),
	user_id: z.number(),
	value: z.string(),
	wod_attendance_id: z.number(),
});

export const ApplausesDataSchema = z.object({
	applause_type: z.string(),
	firstname: z.string(),
	lastname: z.string(),
	profile_image: z.string().nullable(),
	score_id: z.number(),
	user_id: z.number(),
});

export const ScoreCommentsDataSchema = z.object({
	comment: z.string(),
	comment_date: z.string(),
	firstname: z.string(),
	lastname: z.string(),
	profile_image: z.string(),
});

export type SectionType = z.infer<typeof SectionSchema>;
export type LeaderboardsDataType = z.infer<typeof LeaderboardsDataSchema>;
export type ScoreDetailsDataType = z.infer<typeof ScoreDetailsDataSchema>;
export type ApplauseDataType = z.infer<typeof ApplausesDataSchema>;
export type ScoreCommentsDataType = z.infer<typeof ScoreCommentsDataSchema>;
