import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { mmkvStorage } from '@/storage';
import { AttendSessionResponseSchema } from '@/types/schemas/response';

export default async (event_id: number, is_attend: boolean) => {
	const apiToken = () => mmkvStorage.getString('apiToken');

	const payload = {
		api_key: apiToken(),
		data: [
			{
				event_id,
				is_attend,
			},
		],
	};

	const response = await securedInstance()
		.post(ApiRoutes.attendSession, {
			body: JSON.stringify(payload),
			throwHttpErrors: false,
		})
		.json();

	return AttendSessionResponseSchema.parse(response);
};
