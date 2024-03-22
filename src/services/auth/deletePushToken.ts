import { ApiRoutes } from '@/constants';
import ky from 'ky';

export default async (pushToken: string, userId: number) => {
	const response = await ky
		.delete(
			`${ApiRoutes.PushNotificationService}&token=${pushToken}&userId=${userId}`,
		)
		.json();

	return response;
};
