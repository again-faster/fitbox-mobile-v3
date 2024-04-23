import { ApiRoutes } from '@/constants';
import { UpdateUserProfileSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (payload: object) => {
	const url = ApiRoutes.userProfileImage;

	const response = await securedInstance()
		.put(url, {
			body: JSON.stringify(payload),
		})
		.json();

	return UpdateUserProfileSchema.parse(response);
};
