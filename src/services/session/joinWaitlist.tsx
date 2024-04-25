import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { AttendSessionResponseSchema } from '@/types/schemas/response';

export default async (class_id: number, calendar_event_id: number) => {
	const response = await securedInstance()
		.get(ApiRoutes.joinWaitlist, {
			throwHttpErrors: false,
			searchParams: {
				class_id,
				calendar_event_id,
			},
		})
		.json();

	return AttendSessionResponseSchema.parse(response);
};
