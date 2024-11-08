import { z } from 'zod';

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
		bsb_number: z.string(),
		fingerprint: z.string(),
		last4: z.string(),
	})
	.optional();

export type BECSDebitType = z.infer<typeof BECSDebitSchema>;

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
	clientSecret: z.string(),
	paymentMethodType: z.array(z.string()),
	id: z.string(),
	success: z.boolean(),
});
