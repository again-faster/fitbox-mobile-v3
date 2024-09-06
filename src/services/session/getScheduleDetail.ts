import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { GetScheduleDetailResponseSchema } from '@/types/schemas/response';

export default async (id: number) => {
	const response = await securedInstance()
		.get(ApiRoutes.scheduleDetail, {
			searchParams: {
				id,
			},
		})
		.json();

	return GetScheduleDetailResponseSchema.parse(response);
};
