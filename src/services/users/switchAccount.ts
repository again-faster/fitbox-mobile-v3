import { ApiRoutes } from '@/constants';
import { SwitchAccountSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (payload: { user_id: number }) => {
	const url = ApiRoutes.switchAccount;

	const response = await securedInstance()
		.post(url, {
			body: JSON.stringify(payload),
		})
		.json();

	return SwitchAccountSchema.parse(response);
};
