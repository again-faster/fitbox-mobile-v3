import { ApiRoutes } from '@/constants';
import { GetUserHealthInfo } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async () => {
	const response = await securedInstance()
		.get(ApiRoutes.userHealthInfo)
		.json();
	return GetUserHealthInfo.parse(response);
};
