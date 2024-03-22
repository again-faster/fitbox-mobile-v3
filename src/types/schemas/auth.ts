import { z } from 'zod';
import { apiResponseSchema } from './response';

export const checkEmailResponseSchema = apiResponseSchema(
	z.object({
		exists: z.boolean().optional(),
		isActive: z.boolean().optional(),
		pendingInvite: z.boolean().optional(),
	}),
);
