import { ApiRoutes } from '@/constants';
import { GetSubscriptionInfoSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async () => {
	const url = ApiRoutes.subscriptionInfo;

	const response = await securedInstance().post(url).json();
	return GetSubscriptionInfoSchema.parse(response);
};
