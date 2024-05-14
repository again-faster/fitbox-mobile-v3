import { ApiRoutes } from '@/constants';
import { GetAcceptedWaiversSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async () => {
	const url = ApiRoutes.acceptedWaivers;

	const response = await securedInstance().get(url).json();

	return GetAcceptedWaiversSchema.parse(response);
};
