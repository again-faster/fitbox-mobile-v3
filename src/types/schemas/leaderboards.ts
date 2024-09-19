import { z } from 'zod';
import { GenderSchema, boolOrOneZero } from './common';

export const ScoringTypeSchema = z.object({
	id: z.number(),
	context_id: z.number().optional(),
	name: z.string(),
	unit_type: z.string(),
	method: z.string(),
	default_param: z.unknown().optional(),
	created_at: z.unknown().optional(),
	updated_at: z.string().optional(),
	sort_type: z.string(),
	hidden_to: z.unknown().optional(),
});

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
	scoring_type: ScoringTypeSchema,
});

export const LeaderboardsDataSchema = z.object({
	firstname: z.string(),
	lastname: z.string(),
	gender: GenderSchema,
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

export const PrResultSchema = z.object({
	isPR: z.boolean().optional(),
	resultCount: z.number().optional(),
	prMessage: z.string().optional(),
});

export const PastPerformanceResultSchema = z.object({
	isResult: boolOrOneZero,
	scored: boolOrOneZero,
	comments: z.string().nullish(),
	date_input: z.string().nullish(),
	notes: z.string().nullish(),
	created_at: z.string().nullish(),
	scoring_type_id: z.number().nullish(),
	completed: boolOrOneZero,
	wod_score_id: boolOrOneZero,
	value: z.string().nullish(),
	time: z.string().nullish(),
	reps: z.string().nullish(),
	wod_score_reps: z.number().nullish(),
	rounds: z.number().nullish(),
	sets: z.number().nullish(),
	weight: z.string().nullish(),
	weight_unit: z.string().nullish(),
	distance: z.string().nullish(),
	distance_unit: z.string().nullish(),
	calories: z.string().nullish(),
	movement_name: z.string().nullish(),
	one_rm: z
		.object({
			weight: z.string().nullish(),
			// other fields
		})
		.nullish(),
});

export const GetPastPerformanceResultSchema = z.object({
	section_scores: z.array(PastPerformanceResultSchema).optional(),
	user_movement: z.array(PastPerformanceResultSchema).optional(),
});

export const ScoreResultSchema = z.object({
	value: z.string(),
	reps: z.number(),
	comments: z.string(),
	comment_leaderboard_visible: boolOrOneZero,
	score_type: z.string(),
	wod_movement_id: z.number().nullish(),
	wod_section_id: z.number().nullish(),
	leaderboard_visible: z.number().nullish(),
});

export const AttendanceReportDataSchema = z.object({
	lastMonth: z.number(),
	lastWeek: z.number(),
	lifetime: z.number(),
	monthToDate: z.number(),
	weekToDate: z.number(),
	yearToDate: z.number(),
});

export const PastPerformanceHistorySchema = z.object({
	id: z.number().nullable(),
	date_input: z.string(),
	past_performance_id: z.number(),
	displayName: z.string(),
	type: z.string(),
	program_wod_id: z.number().nullable(),
	context_id: z.number().nullable(),
});

export const ResultTypeSchema = z.object({
	id: z.number(),
	name: z.string(),
	type: z.string(),
});

export const OneRmSchema = z.object({
	is_independent_scores: z.boolean(),
	movement_name: z.string(),
	scoring_type_method: z.string(),
	scoring_type_name: z.string(),
	scoring_type_unit: z.string(),
	weight: z.string(),
});

export type IScoringType = z.infer<typeof ScoringTypeSchema>;
export type SectionType = z.infer<typeof SectionSchema>;
export type LeaderboardsDataType = z.infer<typeof LeaderboardsDataSchema>;
export type ScoreDetailsDataType = z.infer<typeof ScoreDetailsDataSchema>;
export type ApplauseDataType = z.infer<typeof ApplausesDataSchema>;
export type ScoreCommentsDataType = z.infer<typeof ScoreCommentsDataSchema>;
export type PrResultSchemaType = z.infer<typeof PrResultSchema>;
export type PastPerformanceResultType = z.infer<
	typeof PastPerformanceResultSchema
>;
export type GetPastPerformanceResultType = z.infer<
	typeof GetPastPerformanceResultSchema
>;
export type ScoreResultType = z.infer<typeof ScoreResultSchema>;
export type AttendanceReportDataType = z.infer<
	typeof AttendanceReportDataSchema
>;
export type PastPerformanceHistoryType = z.infer<
	typeof PastPerformanceHistorySchema
>;
export type ResultType = z.infer<typeof ResultTypeSchema>;
