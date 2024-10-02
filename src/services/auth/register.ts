import { ApiRoutes } from '@/constants';
import { RegisterUserSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (payload: unknown) => {
	const url = ApiRoutes.register;

	const response = await securedInstance()
		.post(url, {
			body: JSON.stringify(payload),
			timeout: 30000,
		})
		.json();

	return RegisterUserSchema.parse(response);
};
