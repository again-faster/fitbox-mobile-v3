import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { GetClassFiltersSchema } from '@/types/schemas/response';

export default async () => {
	const url = ApiRoutes.classFilters;
	const response = await securedInstance().get(url).json();

	return GetClassFiltersSchema.parse(response);
};
