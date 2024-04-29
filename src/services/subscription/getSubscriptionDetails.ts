import { ApiRoutes } from '@/constants';
import { GetSubscriptionDetailsSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (id?: number) => {
	const url = id
		? `${ApiRoutes.subscriptionDetails}/${id}`
		: `${ApiRoutes.subscriptionDetails}`;

	const response = await securedInstance().post(url).json();
	return GetSubscriptionDetailsSchema.parse(response);
};
