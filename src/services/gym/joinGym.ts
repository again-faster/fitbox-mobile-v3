import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { JoinGymSchema } from '@/types/schemas/gym';

export default async (payload: { team_id: string }) => {
	const response = await securedInstance()
		.post(`${ApiRoutes.joinGym}`, {
			body: JSON.stringify(payload),
			throwHttpErrors: false,
		})
		.json();

	return JoinGymSchema.parse(response);
};
