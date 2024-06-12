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
	const url = `${ApiRoutes.conversationMessages}/${conversationId}?page=${page}`;

	const response = await securedInstance().get(url).json();

	return GetConversationMessagesSchema.parse(response);
};
