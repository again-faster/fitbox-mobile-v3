import { ApiRoutes } from '@/constants';
import { mmkvStorage } from '@/storage';
import { ErrorMessageResponse } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (email: string) => {
	const url = ApiRoutes.resetPassword;
	const apiToken = () => mmkvStorage.getString('apiToken');

	const payload = {
		api_key: apiToken(),
		email,
	};

	const response = await securedInstance()
		.post(url, {
			body: JSON.stringify(payload),
		})
		.json();

	return ErrorMessageResponse.parse(response);
};
