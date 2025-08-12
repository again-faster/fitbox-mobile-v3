import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { GetWorkoutsByClassResponseSchema } from '@/types/schemas/response';

export default async (class_id: number) => {
	const response = await securedInstance()
		.get(ApiRoutes.getWorkoutsByClass, {
			searchParams: {
				class_id,
			},
		})
		.json();

	return GetWorkoutsByClassResponseSchema.parse(response);
};
