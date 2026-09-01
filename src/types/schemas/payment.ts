import { z } from 'zod';
import { boolOrOneZero } from './common';

export const PaymentInfoDataSchema = z.object({
	account_id: z.string(),
	context_id: z.number(),
	default: z.number(),
	gateway: z.string(),
	id: z.number(),
	is_active: z.number(),
	method: z.string(),
	payment_method_id: z.string(),
	source_id: z.string().nullable(),
	user_id: z.number(),
	user_type: z.string(),
});
export type PaymetInfoDatatype = z.infer<typeof PaymentInfoDataSchema>;

export const ApplePayWalletSchema = z.object({
	apple_pay: z.object({
		type: z.string(),
	}),
	dynamic_last4: z.string(),
	type: z.string(),
});
export const GooglePayWalletSchema = z.object({
	// google_pay //not used so not going to validate
	dynamic_last4: z.string(),
	type: z.string(),
});

export const CardSchema = z
	.object({
		brand: z.string(),
		checks: z.object({
			address_line1_check: z.string().nullable(),
			address_postal_code_check: z.string().nullable(),
			cvc_check: z.string().nullable(),
		}),
		country: z.string(),
		display_brand: z.string(),
		exp_month: z.number(),
		exp_year: z.number(),
		fingerprint: z.string(),
		funding: z.string(),
		generated_from: z.string().nullable(),
		last4: z.string(),
		networks: z.object({
			available: z.array(z.string()),
			preferred: z.string().nullable(),
		}),
		three_d_secure_usage: z.object({
			supported: z.boolean(),
		}),
		wallet: z
			.union([z.string(), ApplePayWalletSchema, GooglePayWalletSchema])
			.nullable(),
	})
	.optional();

export const BECSDebitSchema = z
	.object({
		bsb_number: z.string().optional(),
		fingerprint: z.string().optional(),
		last4: z.string(),
	})
	.optional();

export type BECSDebitType = z.infer<typeof BECSDebitSchema>;

export const NZBankAccountSchema = z
	.object({
		account_holder_name: z.string().nullable(),
		bank_code: z.string().nullable(),
		bank_name: z.string().nullable(),
		branch_code: z.string().nullable(),
		last4: z.string().nullable(),
		suffix: z.string().nullable(),
	})
	.optional();

export type NZBankAccountType = z.infer<typeof NZBankAccountSchema>;

export const PaymentMethodSchema = z.object({
	allow_redisplay: z.string(),
	billing_details: z.object({
		address: z.object({
			city: z.string().nullable(),
			country: z.string().nullable(),
			line1: z.string().nullable(),
			line2: z.string().nullable(),
			postal_code: z.string().nullable(),
			state: z.string().nullable(),
		}),
		email: z.string().nullable(),
		name: z.string().nullable(),
		phone: z.string().nullable(),
	}),
	nz_bank_account: NZBankAccountSchema,
	card: CardSchema,
	au_becs_debit: BECSDebitSchema,
	created: z.number(),
	customer: z.string().nullable(),
	id: z.string(),
	livemode: z.boolean(),
	metadata: z.array(z.any()),
	object: z.string(),
	type: z.string(),
});

export type PaymentMethodType = z.infer<typeof PaymentMethodSchema>;

export const CardDetailsSchema = z
	.object({
		card: z.object({
			address_city: z.string().nullable(),
			address_country: z.string().nullable(),
			address_line1: z.string().nullable(),
			address_line1_check: z.string().nullable(),
			address_line2: z.string().nullable(),
			address_state: z.string().nullable(),
			address_zip: z.string().nullable(),
			address_zip_check: z.string().nullable(),
			brand: z.string(),
			country: z.string(),
			cvc_check: z.string().nullable(),
			dynamic_last4: z.string().nullable(),
			exp_month: z.number(),
			exp_year: z.number(),
			fingerprint: z.string(),
			funding: z.string(),
			id: z.string(),
			last4: z.string(),
			metadata: z.object({}),
			name: z.string().nullable(),
			networks: z.object({
				preferred: z.string().nullable(),
			}),
			object: z.string(),
			tokenization_method: z.string().nullable(),
			wallet: z.string().nullable(),
		}),
		client_ip: z.string(),
		created: z.number(),
		id: z.string(),
		livemode: z.boolean(),
		object: z.string(),
		type: z.string(),
		used: z.boolean(),
	})
	.nullable();

export type CardDetailsType = z.infer<typeof CardDetailsSchema>;

export const PaymentIntentSchema = z.object({
	clientSecret: z.string().nullish(),
	paymentMethodType: z.array(z.string()).nullish(),
	id: z.string().nullish(),
	success: z.boolean(),
});

export const InvoicesSchema = z.object({
	description: z.string(),
	id: z.number(),
	date: z.string(),
	amount: z.number(),
	calculatedFee: z.number().optional(),
	apply_transaction_fees_to_member: boolOrOneZero,
});

export const InsufficientFundsInvoicesSchema = z.object({
	amount: z.number(),
	forInvoice: z.number(),
});

export const FailedInvoicesSchema = z.object({
	invoices: z.array(InvoicesSchema),
	insufficientFundsInvoices: z.array(InsufficientFundsInvoicesSchema),
	failedInvoiesDayThreshold: z.number().optional(),
});

export const PaymentIntentForInvoiceSchema = z.object({
	customerEphemeralSecret: z.string(),
	paymentIntentId: z.string(),
	paymentIntentSecret: z.string(),
	stripeCustomerId: z.string(),
});

export const CheckPaymentIntentForInvoice = z.object({
	amountCaptured: z.number(),
	error: z.boolean(),
	userPaymentDetailsUpdated: z.boolean(),
});

export const MobilePayStartSchema = z.object({
	amount: z.number(),
	currency: z.string(),
	customer_ephemeral_key_secret: z.string(),
	customer_id: z.string(),
	order_id: z.number(),
	payment_intent_client_secret: z.string(),
	payment_intent_id: z.string(),
});

export type FailedInvoicesType = z.infer<typeof FailedInvoicesSchema>;
export type InsufficientFundsInvoicesType = z.infer<
	typeof InsufficientFundsInvoicesSchema
>;
export type InvoicesType = z.infer<typeof InvoicesSchema>;
export type PaymentIntentForInvoiceType = z.infer<
	typeof PaymentIntentForInvoiceSchema
>;
