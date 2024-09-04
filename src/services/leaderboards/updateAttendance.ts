import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { ErrorMessageResponse } from '@/types/schemas/response';

export type UpdateAttendanceParams = {
	event_id: number;
	user_id?: number;
	status?: string;
};

export default async (payload: UpdateAttendanceParams) => {
	const response = await securedInstance()
		.post(`${ApiRoutes.updateAttendance}`, {
			body: JSON.stringify(payload),
			throwHttpErrors: false,
		})
		.json();

	return ErrorMessageResponse.parse(response);
};
