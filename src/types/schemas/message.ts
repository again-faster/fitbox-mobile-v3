import { z } from 'zod';
import { boolOrOneZero } from './common';

export type MessageItemUserType = z.infer<typeof MessageItemUserSchema>;
export const MessageItemUserSchema = z.object({
	id: z.number(),
	firstname: z.string(),
	lastname: z.string(),
	profile_image: z.string(),
});

export type MessageItemAttachmentType = z.infer<
	typeof MessageItemAttachmentSchema
>;
export const MessageItemAttachmentSchema = z.object({
	type: z.string(),
});

export type MessageItemType = z.infer<typeof MessageItemSchema>;
export const MessageItemSchema = z.object({
	id: z.number(),
	userId: z.optional(z.number()),
	sender_id: z.number(),
	message: z.string(),
	profile_image: z.string(),
	num_of_unread_messages: z.number(),
	created_at: z.string(),
	subject: z.string(),
	status: z.number(),
	group: z.array(z.string()),
	convo_id: z.number(),
	firstname: z.string(),
	lastname: z.string(),
	user_list: z.array(MessageItemUserSchema),
	attached_files: z.array(MessageItemAttachmentSchema).or(z.any()),
	is_announcement: z.number().optional(),
});

const LegacyActionSchema = z.object({
	type: z.string(),
	link: z.string(),
});

export type NewActionType = z.infer<typeof NewActionSchema>;
const NewActionSchema = z.object({
	screen: z.string(),
	text: z.string(),
});

export type AnnouncementsItemType = z.infer<typeof AnnouncementsItemSchema>;
export const AnnouncementsItemSchema = z.object({
	id: z.number(),
	sender_id: z.number(),
	subject: z.string(),
	convo_id: z.number(),
	disable_reply: boolOrOneZero,
	message: z.string(),
	created_at: z.string(),
	action: z.union([z.array(LegacyActionSchema), NewActionSchema, z.null()]),
	attached_files: z.array(
		z.object({
			id: z.number(),
			name: z.string(),
			type: z.string(),
			size: z.number(),
			public_url: z.string(),
		}),
	),
});

export const ContactGroupMembersSchema = z.object({
	first_name: z.string(),
	id: z.number(),
	last_name: z.string(),
	member_type: z.string(),
	role: z.string(),
	is_selected: z.boolean().optional(),
	fullname: z.string().optional(),
});

export const ContactGroupSchema = z.object({
	name: z.string(),
	type: z.string(),
	members: z.array(ContactGroupMembersSchema).optional(),
});

export const ContactMembersSchema = z.object({
	fullname: z.string(),
	id: z.number(),
	role: z.string(),
	is_selected: z.boolean().optional(),
});

export const ContactDataSchema = z.object({
	groups: z.array(ContactGroupSchema),
	members: z.array(ContactMembersSchema),
});

export type ContactsDataType = z.infer<typeof ContactDataSchema>;
export type ContactMembersType = z.infer<typeof ContactMembersSchema>;
export type ContactGroupType = z.infer<typeof ContactGroupSchema>;
export type ContactGroupMembersType = z.infer<typeof ContactGroupMembersSchema>;

export const RecipientsSchema = z.object({
	fullname: z.string(),
	id: z.number(),
	profile_image: z.string(),
});

export const AttachedFilesSchema = z.object({
	id: z.number(),
	name: z.string(),
	public_url: z.string(),
	size: z.number(),
	type: z.string(),
});

export const SendMessageDataSchema = z.object({
	attached_files: z.array(AttachedFilesSchema),
	convo_id: z.number().optional(),
	created_at: z.string(),
	firstname: z.string(),
	id: z.number(),
	lastname: z.string(),
	message: z.string(),
	profile_image: z.string(),
	recipients: z.array(RecipientsSchema).optional(),
	sender_id: z.number(),
	status: z.number().optional(),
	subject: z.string().optional(),
});

export const MediaItemSchema = z.object({
	dims: z.array(z.number()),
	duration: z.number(),
	preview: z.string(),
	size: z.number(),
	url: z.string(),
});

export const MediaFormatSchema = z.object({
	gif: MediaItemSchema,
	gifpreview: MediaItemSchema,
	loopedmp4: MediaItemSchema,
	mediumgif: MediaItemSchema,
	mp4: MediaItemSchema,
	nanogif: MediaItemSchema,
	nanogifpreview: MediaItemSchema,
	nanomp4: MediaItemSchema,
	tinygif: MediaItemSchema,
	tinygifpreview: MediaItemSchema,
	tinymp4: MediaItemSchema,
	tinywebm: MediaItemSchema,
	webm: MediaItemSchema,
	webp: MediaItemSchema,
});

export const GIFItemSchema = z.object({
	content_description: z.string(),
	created: z.number(),
	flags: z.array(z.any()),
	hasaudio: z.boolean(),
	id: z.string(),
	itemurl: z.string(),
	media_formats: MediaFormatSchema,
	tags: z.array(z.any()),
	title: z.string(),
	url: z.string(),
});
export const SearchGIFResultsSchema = z.array(GIFItemSchema);

export type MediaFormatType = z.infer<typeof MediaFormatSchema>;
export type GIFItemType = z.infer<typeof GIFItemSchema>;
export type SearchGIFResultsType = z.infer<typeof SearchGIFResultsSchema>;
export type SendMessageDataType = z.infer<typeof SendMessageDataSchema>;

export const FitboxGalleryFilesSchema = z.object({
	bucket: z.string().nullable(),
	bucket_key: z.string().nullable(),
	created_at: z.string(),
	deleted_at: z.string().nullable(),
	folder_id: z.number(),
	id: z.number(),
	mime_type: z.string(),
	name: z.string(),
	public_url: z.string(),
	reference_id: z.number().nullable(),
	reference_type: z.string().nullable(),
	size: z.number(),
	slug: z.string(),
	type: z.string(),
	updated_at: z.string(),
	user_id: z.number(),
});

export const FitboxGalleryDataSchema = z.object({
	files: z.array(FitboxGalleryFilesSchema),
	folders: z.array(z.unknown()),
	parentFolder: z.number().optional(),
	response_code: z.number().optional(),
});

export const ConversationArchivedListDataSchema = z.object({
	created_at: z.string(),
	firstname: z.string(),
	group: z.array(z.unknown()),
	id: z.number(),
	lastname: z.string(),
	message: z.string(),
	profile_image: z.string(),
	sender_id: z.number(),
	status: z.number(),
	subject: z.string(),
	user_list: z.array(z.unknown()),
});

export type ConversationArchivedListDataType = z.infer<
	typeof ConversationArchivedListDataSchema
>;

export type FitboxGalleryFilesType = z.infer<typeof FitboxGalleryFilesSchema>;
