import { ApiRoutes } from '@/constants';
import { CheckConversationReplyStatusSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (payload: number) => {
	const url = `${ApiRoutes.checkConversationReplyStatus}/${payload}`;

	const response = await securedInstance().get(url).json();

	return CheckConversationReplyStatusSchema.parse(response);
};
