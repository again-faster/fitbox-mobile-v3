import { ApiRoutes } from '@/constants';
import { CheckPaymentIntentForInvoice } from '@/types/schemas/payment';
import { securedInstance } from '../instance';

export default async (invoiceId: number, paymentIntentId: string) => {
	const url = `${ApiRoutes.checkPaymentIntentForInvoice}/${invoiceId}`;
	const response = await securedInstance(40000)
		.post(url, {
			body: JSON.stringify({
				paymentIntentId,
			}),
			throwHttpErrors: false,
			searchParams: {
				id: invoiceId,
			},
		})
		.json();

	return CheckPaymentIntentForInvoice.parse(response);
};
