import { z } from 'zod';

export const boolOrOneZero = z
	.union([z.literal(1), z.literal(0), z.boolean()])
	.transform(value => {
		if (typeof value === 'boolean') {
			return value;
		}

		return value === 1;
	});
