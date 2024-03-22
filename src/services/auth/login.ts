import { ApiRoutes } from '@/constants';
import { instance } from '@/services/instance';
import { loginResponseSchema } from '@/types/schemas/response';
import base64 from 'react-native-base64';

export default async (email: string, password: string) => {
	// encode email and password
	const encoded = base64.encode(`${email}:${password}`);

	const response = await instance
		.post(ApiRoutes.login, {
			headers: {
				authorization: `Basic ${encoded}`,
			},
		})
		.json();

	return loginResponseSchema.parse(response);
};
