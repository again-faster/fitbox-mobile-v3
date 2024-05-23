import { ApiRoutes } from '@/constants';
import { GetParentInfoSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async () => {
	const response = await securedInstance().get(ApiRoutes.parentInfo).json();

	return GetParentInfoSchema.parse(response);
};
