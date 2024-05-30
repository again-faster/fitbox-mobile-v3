import { ApiRoutes } from '@/constants';
import { ErrorMessageResponse } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async (payload: {
	[key: string]: {
		data: { [key: string]: string | number | boolean }[];
		value: boolean | string;
	};
}) => {
	const url = ApiRoutes.saveHealthInfo;

	const response = await securedInstance()
		.post(url, {
			body: JSON.stringify(payload),
		})
		.json();

	return ErrorMessageResponse.parse(response);
};
