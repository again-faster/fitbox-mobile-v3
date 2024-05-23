import { ApiRoutes } from '@/constants';
import { GetChildInfoSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async () => {
	const response = await securedInstance().get(ApiRoutes.childInfo).json();
	return GetChildInfoSchema.parse(response);
};
