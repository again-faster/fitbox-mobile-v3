import { ApiRoutes } from '@/constants';
import { SendConversationMessageSchema } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (payload: {
	subject: string;
	message: string;
	recipients?: string;
	disable_reply?: boolean;
	convo_id?: number;
	mediaAttachments?: string[];
}) => {
	const url = ApiRoutes.sendConversationMessage;
	const response = await securedInstance()
		.post(url, {
			body: JSON.stringify(payload),
			throwHttpErrors: false,
		})
		.json();
	return SendConversationMessageSchema.parse(response);
};
