import { z } from 'zod';

export const SubscriptionSchema = z.object({
	expiration_date: z.string().nullable(),
	expiration_interval: z.number(),
	expiration_interval_unit: z.string(),
	first_billing_date: z.string(),
	id: z.number(),
	name: z.string(),
	payment_gateway: z.string().nullable(),
	price_in_cents: z.number(),
	recurring_interval: z.number(),
	recurring_interval_unit: z.string(),
	sessions_count: z.number().nullable(),
	sessions_limit: z.number().nullable(),
	sessions_limit_frequency: z.string().nullable(),
	set_up_price_in_cents: z.number(),
	start_date: z.string(),
	status: z.string(),
	trial_price_in_cents: z.number(),
});

export type SubscriptionType = z.infer<typeof SubscriptionSchema>;

export const TransactionsSchema = z.object({
	amount: z.number(),
	calculated_fee: z.number(),
	created_at: z.string(),
	id: z.number(),
	name: z.string(),
});

export type TransactionsType = z.infer<typeof TransactionsSchema>;

export const SubscriptionDetailsSchema = z.object({
	apply_transaction_fees_to_member: z.number(),
	cancellation_date: z.string().nullable(),
	description: z.string(),
	expiration_interval: z.number(),
	expiration_interval_unit: z.string(),
	first_billing_date: z.string(),
	id: z.number(),
	name: z.string(),
	next_payment_date: z.string().nullable(),
	price_in_cents: z.number(),
	recurring_interval: z.number(),
	recurring_interval_unit: z.string(),
	sessions_count: z.number().nullable(),
	sessions_limit: z.number().nullable(),
	sessions_limit_frequency: z.string(),
	set_up_price_in_cents: z.number(),
	suspended_begin_date: z.string().nullable(),
	suspended_until_date: z.string().nullable(),
	trial_price_in_cents: z.number(),
	type: z.string(),
});

export type SubscriptionDetailsType = z.infer<typeof SubscriptionDetailsSchema>;
