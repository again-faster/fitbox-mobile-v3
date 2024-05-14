import { z } from 'zod';

export const WaiverSchema = z.object({
	agreed: z.number(),
	context_id: z.number(),
	created_at: z.string(),
	deleted_at: z.string().nullable(),
	file_path: z.string(),
	id: z.number(),
	updated_at: z.string(),
	user: z.object({
		email: z.string(),
		face_id: z.string().nullable(),
		firstname: z.string(),
		gender: z.string(),
		id: z.number(),
		lastname: z.string(),
	}),
	user_id: z.number(),
	waiver_id: z.number(),
});

export type WaiverType = z.infer<typeof WaiverSchema>;
