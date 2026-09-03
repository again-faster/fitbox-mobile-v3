import Constant from '@/utils/Constant';
import {
	buildNativeCommerceHeaders,
	nativeCommerceEndpoint,
	parseNativeCommerceResponse,
	type NativeCommerceIdentity,
} from './protocol';

export type NativeMoney = { currency: string; minor: number };

export type NativeStoreProduct = {
	product_id: string;
	title: string;
	description: string | null;
	category_slug: string;
	category_name: string;
	supplier_name: string;
	image_url: string | null;
	price: NativeMoney;
	stock_status: 'instock' | 'low_stock' | 'out_of_stock' | 'unknown';
	is_custom_apparel: boolean;
	variants: Array<{
		variant_id: string;
		label: string;
		value: string;
		price: NativeMoney;
		stock_status: NativeStoreProduct['stock_status'];
	}>;
};

export type NativeStoreResponse = {
	request_id: string;
	gym_id: number;
	gym_name?: string | null;
	store_mode: 'shadow' | 'native';
	currency: string;
	products: NativeStoreProduct[];
	categories: Array<{ slug: string; name: string; image_url: string | null }>;
	next_cursor: string | null;
};

export type NativeStoreFallbackResponse = {
	request_id: string;
	gym_id: number;
	store_mode: 'legacy' | 'paused';
	fallback_url: string;
	currency?: string;
};

export const isNativeStoreResponse = (
	response: NativeStoreResponse | NativeStoreFallbackResponse,
): response is NativeStoreResponse =>
	response.store_mode === 'shadow' || response.store_mode === 'native';

export type NativeCartLine = {
	line_id: string;
	variant_id: string;
	product_id: string;
	title: string;
	supplier_name?: string | null;
	variant_label: string | null;
	quantity: number;
	unit_price: NativeMoney;
	line_total: NativeMoney;
	stock_status: NativeStoreProduct['stock_status'];
};

export type NativeCartResponse = {
	request_id: string;
	gym_id: number;
	currency: string;
	version: number;
	lines: NativeCartLine[];
	subtotal: NativeMoney;
	shipping_groups?: NativeShippingGroup[];
};

export type NativeShippingGroup = {
	supplier_key: string;
	supplier_name: string | null;
	merchandise_subtotal: NativeMoney;
	shipping_amount: NativeMoney;
	currency: string;
	free_shipping: boolean;
};

export type NativeCheckoutResponse = {
	request_id: string;
	gym_id: number;
	order_id: string;
	order_number: number;
	currency: string;
	subtotal: NativeMoney;
	shipping: NativeMoney;
	tax: NativeMoney;
	discount: NativeMoney;
	total: NativeMoney;
	payment_status: 'unpaid' | 'requires_action' | 'paid';
	simulated?: boolean;
	shipping_groups?: NativeShippingGroup[];
	payment_intent_client_secret?: string | null;
};

export type NativeOrderSummary = {
	order_id: string;
	order_number: number;
	status: string;
	payment_status: string;
	fulfillment_status: string;
	currency: string;
	total: NativeMoney;
	created_at: string;
};

export type NativeOrderLine = {
	line_id: string;
	title: string;
	variant_label: string | null;
	quantity: number;
	quantity_fulfilled: number;
	quantity_refunded: number;
	unit_price: NativeMoney;
	line_total: NativeMoney;
};

export type NativeFulfillmentGroup = {
	fulfillment_group_id: string;
	status: string;
	supplier_name: string | null;
	supplier_order_ref: string | null;
	tracking_number: string | null;
	tracking_url: string | null;
	shipped_at: string | null;
	delivered_at: string | null;
};

export type NativeOrderDetail = NativeOrderSummary & {
	subtotal: NativeMoney;
	shipping: NativeMoney;
	tax: NativeMoney;
	discount: NativeMoney;
	lines: NativeOrderLine[];
	fulfillment_groups: NativeFulfillmentGroup[];
};

export class NativeCommerceError extends Error {
	constructor(
		public readonly code: string,
		message: string,
		public readonly status: number,
	) {
		super(message);
	}
}

const request = async <T>(
	identity: NativeCommerceIdentity,
	body: Record<string, unknown>,
): Promise<T> => {
	const response = await fetch(
		nativeCommerceEndpoint(Constant.COMMERCE_SUPABASE_URL),
		{
			method: 'POST',
			headers: buildNativeCommerceHeaders(
				identity,
				Constant.COMMERCE_SUPABASE_ANON_KEY,
			),
			body: JSON.stringify({ gym_id: identity.gymId, ...body }),
		},
	);

	let payload: any = null;
	try {
		payload = await response.json();
	} catch {
		payload = null;
	}
	if (!response.ok) {
		const error = payload?.error;
		throw new NativeCommerceError(
			error?.code ?? 'internal',
			error?.message ?? 'The store is temporarily unavailable.',
			response.status,
		);
	}
	return parseNativeCommerceResponse<T>(
		String(body.action ?? 'unknown'),
		payload,
	);
};

const requestKey = (prefix: string): string => {
	return `${prefix}:${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const nativeCommerce = {
	getStore: (
		identity: NativeCommerceIdentity,
		query?: string,
		categorySlug?: string,
	) =>
		request<NativeStoreResponse | NativeStoreFallbackResponse>(identity, {
			action: 'store',
			...(query ? { query } : {}),
			...(categorySlug ? { category_slug: categorySlug } : {}),
		}),
	getCart: (identity: NativeCommerceIdentity) =>
		request<NativeCartResponse>(identity, { action: 'cart.get' }),
	replaceCart: (
		identity: NativeCommerceIdentity,
		lines: Array<{ variant_id: string; quantity: number }>,
	) =>
		request<NativeCartResponse>(identity, {
			action: 'cart.replace',
			request_key: requestKey('cart'),
			lines,
		}),
	prepareCheckout: (
		identity: NativeCommerceIdentity,
		shippingAddress: Record<string, string>,
	) =>
		request<NativeCheckoutResponse>(identity, {
			action: 'checkout.prepare',
			idempotency_key: requestKey('checkout'),
			shipping_address: shippingAddress,
		}),
	getOrders: (identity: NativeCommerceIdentity, cursor?: string) =>
		request<{
			request_id: string;
			gym_id: number;
			orders: NativeOrderSummary[];
		}>(identity, {
			action: 'orders.list',
			...(cursor ? { cursor } : {}),
		}),
	getOrder: (identity: NativeCommerceIdentity, orderId: string) =>
		request<{
			request_id: string;
			gym_id: number;
			order: NativeOrderDetail;
		}>(identity, {
			action: 'orders.get',
			order_id: orderId,
		}),
};

export type { NativeCommerceIdentity } from './protocol';
