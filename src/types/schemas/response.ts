import { z } from 'zod';
import { GenderSchema, boolOrOneZero } from './common';
import {
	GymClassSchema,
	GymInfoSchema,
	GymSchema,
	GymVenueSchema,
} from './gym';
import {
	ApplausesDataSchema,
	AttendanceGraphSchema,
	AttendanceReportDataSchema,
	GetPastPerformanceResultSchema,
	LeaderboardByWorkoutSchema,
	LeaderboardsDataSchema,
	OneRMDataItemSchema,
	OneRmSchema,
	PastPerformanceHistorySchema,
	PastPerformanceResultSchema,
	PrResultSchema,
	ResultTypeSchema,
	ScoreCommentsDataSchema,
	ScoreDetailsDataSchema,
	ScoreResultSchema,
	ScoringTypeSchema,
	WorkoutItemSchema,
} from './leaderboards';
import {
	AnnouncementsItemSchema,
	ContactDataSchema,
	ConversationArchivedListDataSchema,
	FitboxGalleryDataSchema,
	MessageItemSchema,
	SearchGIFResultsSchema,
	SendMessageDataSchema,
} from './message';
import {
	CardDetailsSchema,
	PaymentInfoDataSchema,
	PaymentIntentSchema,
	PaymentMethodSchema,
} from './payment';
import {
	BookedSessionSchema,
	ClassFiltersDataSchema,
	SessionDetailSchema,
	SessionSchema,
	StaffBookedSessionSchema,
	WorkoutSchema,
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
	FialedInvoiceSchema,
	HealthSchema,
	InjuriesSchema,
	ParentInfoSchema,
	ProfileSchema,
	RegisterUserDataSchema,
	UserHealthInfoSchema,
	UserProfileSchema,
	UserSchema,
	ValidateInviteCodeDataExistsSchema,
	ValidateInviteCodeDataSchema,
} from './user';
import { WaiverSchema } from './waivers';

export const apiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) =>
	z.object({
		data: dataSchema,
		message: z.string(),
		error: z.boolean(),
	});

export const apiPaginationResponseSchema = <T>(dataSchema: z.ZodSchema<T>) =>
	z.object({
		data: dataSchema,
		end: z.number(),
		start: z.number(),
		totalResults: z.number(),
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
	total_pages: z.number(),
});

export const GetAnnouncementsResponseSchema = z.object({
	data: z.array(AnnouncementsItemSchema),
	message: z.string(),
	error: z.boolean(),
});

export const GetUserGymInfoResponseSchema = z.object({
	gym_info: GymInfoSchema,
	message: z.string(),
	error: z.boolean(),
	user_data: z.object({
		has_paid_subscriptions: z.boolean(),
		has_payment_details: boolOrOneZero,
		has_waived_subscriptions: z.boolean(),
		waiver_accepted: boolOrOneZero,
		has_previous_subscriptions: z.boolean(),
	}),
});

export const GetUserGymInfoV2ResponseSchema = z.object({
	gym_info: GymInfoSchema.optional(),
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
	gender: GenderSchema.optional(),
	email: z.string().optional(),
	contact_phone: z.string().nullable().optional(),
	height: z.number().optional(),
	current_weight: z.number().optional(),
	weight_unit: z.string().optional(),
	emergency_contact_name: z.string().nullish(),
	emergency_contact_number: z.string().nullish(),
	default_team_id: z.number().optional(),
});

export type UpdateUserProfileTypes = z.infer<
	typeof UpdateUserProfilePayloadSchema
>;

export const AttendSessionResponseSchema = z.object({
	error: z.boolean(),
	error_code: z.string().nullish(),
	message: z.string(),
	allow_buynow: boolOrOneZero,
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
	z
		.object({
			product: UserSubscriptionProductsSchema,
			subscription: SubscriptionSaveSchema,
		})
		.optional(),
);
export const GetGymVenuesResponseSchema = z.array(GymVenueSchema);
export const GeyGymClassesResponseSchema = apiResponseSchema(
	z.array(GymClassSchema),
);

export const GetPaymentInfoSchema = apiResponseSchema(
	z.union([PaymentInfoDataSchema, z.array(z.unknown())]),
);

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

export const GetContacts = apiResponseSchema(ContactDataSchema);
export const SendConversationMessageSchema = apiResponseSchema(
	SendMessageDataSchema,
);

export const SearchGIFResponseSchema = z.object({
	next: z.string(),
	results: SearchGIFResultsSchema,
});

export type SearchGIFResponseType = z.infer<typeof SearchGIFResponseSchema>;
export const GetConversationMessagesSchema = z.object({
	data: z.array(SendMessageDataSchema),
	error: z.boolean(),
	message: z.string(),
	page: z.number(),
	total_items: z.number(),
	total_pages: z.number(),
});

export const CheckConversationReplyStatusSchema = apiResponseSchema(
	z.object({
		disable_reply: z.number(),
	}),
);

export const GetClassLeaderboardsSchema = apiResponseSchema(
	z.array(LeaderboardsDataSchema),
);

export const GetScoreDetailsSchema = apiResponseSchema(ScoreDetailsDataSchema);
export const GetScoreApplausesSchema = apiResponseSchema(
	z.array(ApplausesDataSchema),
);
export const GetScoreCommentsSchema = apiResponseSchema(
	z.array(ScoreCommentsDataSchema),
);
export const RegisterUserSchema = apiResponseSchema(RegisterUserDataSchema);

export type PrResultDataType = z.infer<typeof PrResultData>;
export const PrResultData = z
	.union([PrResultSchema.nullable(), z.array(PrResultSchema.nullable())])
	.optional();

export const AddScoreResponseSchema = z.object({
	error: z.boolean(),
	message: z.string(),
	prResults: PrResultData,
	prResult: PrResultData,
	data: z
		.object({
			prResult: PrResultData,
		})
		.optional(),
});

export const GetPastPerformanceResponseSchema = apiResponseSchema(
	GetPastPerformanceResultSchema,
);

export const GetScoreResultResponseSchema = apiResponseSchema(
	z.array(ScoreResultSchema),
);

export const GetClassFiltersSchema = apiResponseSchema(
	z.array(ClassFiltersDataSchema),
);

export const GetFitboxGallerySchema = apiResponseSchema(
	FitboxGalleryDataSchema,
);

export const GetAttendanceReportSchema = apiResponseSchema(
	AttendanceReportDataSchema,
);

export const GetAttendanceGraphSchema = apiResponseSchema(
	AttendanceGraphSchema,
);

export const GetUserMovementSchema = apiResponseSchema(
	z.object({
		movements: z.array(PastPerformanceResultSchema),
		one_rm: OneRmSchema.nullable(),
	}),
);

export const GetPastPerformanceHistorySchema = apiPaginationResponseSchema(
	z.array(PastPerformanceHistorySchema),
);

export const GetResultsTypesSchema = apiPaginationResponseSchema(
	z.array(ResultTypeSchema),
);

export const GetScoringTypesSchema = apiResponseSchema(
	z.array(ScoringTypeSchema),
);

export const DeleteScoreResponseSchema = apiResponseSchema(z.any());

export const GetConversationArchivedListSchema = z.object({
	data: z.array(ConversationArchivedListDataSchema),
	error: z.boolean(),
	message: z.string(),
	page: z.number(),
	total_items: z.number(),
	total_pages: z.number(),
	unread_items: z.number(),
});

export const ValidateInviteCodeResponseSchema = apiResponseSchema(
	z.union([ValidateInviteCodeDataSchema, ValidateInviteCodeDataExistsSchema]),
);

export const AcceptInviteResponseSchema = apiResponseSchema(
	z.object({ accepted: z.boolean() }),
);

export const GetWorkoutResponseSchema = apiResponseSchema(
	z.object({
		benchmark: z.array(WorkoutSchema),
		favorite: z.array(WorkoutSchema),
	}),
);

export const GetWorkoutsByClassResponseSchema = apiResponseSchema(
	z.array(WorkoutItemSchema),
);

export const GetAttendanceProfileResponseSchema = z.object({
	failedInvoices: FialedInvoiceSchema,
	health: HealthSchema,
	injuries: InjuriesSchema,
	profile: ProfileSchema,
});

export const GetMinVersionSchema = z.object({
	minVersion: z.string(),
	depth: z.number(),
});

export const GetLeaderboardByWorkoutResponseSchema = apiResponseSchema(
	LeaderboardByWorkoutSchema,
);

export const GetOneRMsBySessionSectionResponseSchema = z.object({
	data: z.array(OneRMDataItemSchema),
	error: z.boolean(),
	message: z.string(),
});
