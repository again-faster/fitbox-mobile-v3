import { ApiRoutes } from '@/constants';
import { InviteEmailSchema } from '@/types/schemas/gym';
import { securedInstance } from '../instance';

export default async ({
	email,
	team_id,
}: {
	email: string;
	team_id: string;
}) => {
	const response = await securedInstance()
		.get(`${ApiRoutes.inviteEmail}`, {
			searchParams: {
				email,
				team_id,
			},
		})
		.json();

	return InviteEmailSchema.parse(response);
};
