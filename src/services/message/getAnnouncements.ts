import { ApiRoutes } from '@/constants';
import { GetAnnouncementsResponseSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (teamId: number) => {
	const response = await securedInstance()
		.get(`${ApiRoutes.announcements}`, {
			// body: JSON.stringify({ page: 0 }),
			searchParams: {
				team_id: teamId,
			},
		})
		.json();

	return GetAnnouncementsResponseSchema.parse(response);
};
