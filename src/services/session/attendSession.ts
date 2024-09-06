import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { mmkvStorage } from '@/storage';
import { AttendSessionResponseSchema } from '@/types/schemas/response';

export type AttendSessionParams = {
	event_id: number;
	is_attend: boolean;
	user_id?: number;
	admin_override?: boolean;
};

export default async (payload: AttendSessionParams) => {
	const apiToken = () => mmkvStorage.getString('apiToken');

	const body = {
		api_key: apiToken(),
		data: [payload],
	};

	const response = await securedInstance()
		.post(ApiRoutes.attendSession, {
			body: JSON.stringify(body),
			throwHttpErrors: false,
		})
		.json();

	return AttendSessionResponseSchema.parse(response);
};
