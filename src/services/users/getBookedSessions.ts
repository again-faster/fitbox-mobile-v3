import { ApiRoutes } from '@/constants';
import { SessionSchema } from '@/types/schemas/session';
import { securedInstance } from '../instance';

export default async () => {
	const response = await securedInstance()
		.get(ApiRoutes.bookedSessions)
		.json();

	return SessionSchema.parse(response);
};
