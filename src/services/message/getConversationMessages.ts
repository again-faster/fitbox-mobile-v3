import { ApiRoutes } from '@/constants';
import { GetConversationMessagesSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async ({
	conversationId,
	page,
}: {
	conversationId: number;
	page: number;
}) => {
	const response = await securedInstance()
		.get(`${ApiRoutes.conversationMessages}/${conversationId}`, {
			searchParams: {
				page,
			},
		})
		.json();

	return GetConversationMessagesSchema.parse(response);
};
