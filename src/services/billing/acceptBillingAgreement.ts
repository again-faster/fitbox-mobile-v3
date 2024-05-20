import { ApiRoutes } from '@/constants';
import { ErrorMessageResponse } from '@/types/schemas/response';
import { securedInstance } from '../instance';

export default async () => {
	const url = ApiRoutes.acceptBillingAgreement;

	const response = await securedInstance().get(url).json();
	return ErrorMessageResponse.parse(response);
};
