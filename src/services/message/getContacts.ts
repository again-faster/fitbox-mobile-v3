import { ApiRoutes } from '@/constants';
import { GetContacts } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (teamId: number) => {
	const url = `${ApiRoutes.contacts}`;

	const response = await securedInstance()
		.get(url, {
			searchParams: {
				team_id: teamId,
			},
		})
		.json();

	return GetContacts.parse(response);
};
