import { ApiRoutes } from '@/constants';
import { instance } from '@/services/instance';
import { checkEmailResponseSchema } from '@/types/schemas/auth';

export default async (email: string) => {
	const response = await instance
		.get(`${ApiRoutes.checkEmail}?email=${email}`)
		.json();

	return checkEmailResponseSchema.parse(response);
};
