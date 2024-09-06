import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { GetScheduleListResponseSchema } from '@/types/schemas/response';

export default async (start: string, end: string) => {
	const response = await securedInstance()
		.get(ApiRoutes.scheduleList, {
			searchParams: {
				start,
				end,
			},
		})
		.json();

	return GetScheduleListResponseSchema.parse(response);
};
