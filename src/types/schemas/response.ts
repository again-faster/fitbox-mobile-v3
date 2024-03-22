import { z } from 'zod';
import { userSchema } from './user';

export const apiResponseSchema = <T>(dataSchema: z.ZodSchema<T>) =>
	z.object({
		// data could be any key in object
		data: dataSchema,
		message: z.string(),
		error: z.boolean(),
	});

export const loginResponseSchema = z.object({
	id: z.number(),
	error: z.boolean(),
	token: z.string(),
	user_data: userSchema,
});
