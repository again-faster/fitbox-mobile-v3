import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { GetOneRMsBySessionSectionResponseSchema } from '@/types/schemas/response';

export default async (section_id: number, session_id: number) => {
	const response = await securedInstance()
		.get(ApiRoutes.getOneRMsBySessionSection, {
			searchParams: {
				section_id,
				session_id,
			},
		})
		.json();

	return GetOneRMsBySessionSectionResponseSchema.parse(response);
};
