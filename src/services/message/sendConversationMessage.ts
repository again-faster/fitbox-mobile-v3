import { ApiRoutes } from '@/constants';
import { SendConversationMessageSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (payload: {
	subject: string;
	message: string;
	recipients?: string;
	disable_reply?: boolean;
	convo_id?: number;
	mediaAttachments?: unknown[];
}) => {
	const response = await securedInstance()
		.post(`${ApiRoutes.sendConversationMessage}`, {
			body: JSON.stringify(payload),
		})
		.json();

	return SendConversationMessageSchema.parse(response);
};
