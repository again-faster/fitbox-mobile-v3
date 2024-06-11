import { z } from 'zod';

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

export const SendMessageDataSchema = z.object({
	attached_files: z.array(z.any()),
	convo_id: z.number(),
	created_at: z.string(),
	firstname: z.string(),
	id: z.number(),
	lastname: z.string(),
	message: z.string(),
	profile_image: z.string(),
	recipients: z.array(RecipientsSchema),
	sender_id: z.number(),
	status: z.number(),
	subject: z.string(),
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
