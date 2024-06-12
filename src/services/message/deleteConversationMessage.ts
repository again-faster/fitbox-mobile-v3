import { ApiRoutes } from '@/constants';
import { ErrorMessageResponse } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (payload: number) => {
	const url = `${ApiRoutes.deleteConversationMessage}/${payload}`;

	const response = await securedInstance().delete(url).json();

	return ErrorMessageResponse.parse(response);
};
