import { ApiRoutes } from '@/constants';
import { ToggleEmailNotificationsSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async () => {
	const url = ApiRoutes.toggleEmailNotifications;

	const response = await securedInstance().post(url).json();
	return ToggleEmailNotificationsSchema.parse(response);
};
