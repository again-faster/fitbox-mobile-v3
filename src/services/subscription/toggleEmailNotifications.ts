import { ApiRoutes } from '@/constants';
import { ErrorMessageResponse } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async () => {
	const url = ApiRoutes.toggleEmailNotifications;

	const response = await securedInstance().post(url).json();
	return ErrorMessageResponse.parse(response);
};
