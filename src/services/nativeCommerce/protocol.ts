export type NativeCommerceIdentity = {
	email: string;
	first: string;
	last: string;
	expiry: number;
	signature: string;
	gymId: number;
};

export const nativeCommerceEndpoint = (supabaseUrl: string): string =>
	`${supabaseUrl.replace(/\/$/, '')}/functions/v1/native-store-member`;

export const buildNativeCommerceHeaders = (
	identity: NativeCommerceIdentity,
	anonKey: string,
): Record<string, string> => ({
	Accept: 'application/json',
	'Content-Type': 'application/json',
	...(anonKey ? { apikey: anonKey } : {}),
	'x-fitbox-email': identity.email,
	'x-fitbox-first': identity.first,
	'x-fitbox-last': identity.last,
	'x-fitbox-expiry': String(identity.expiry),
	'x-fitbox-signature': identity.signature,
	'x-fitbox-gym': String(identity.gymId),
});

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const isMoney = (value: unknown): boolean =>
	isRecord(value) &&
	typeof value.currency === 'string' &&
	typeof value.minor === 'number';

const isShippingGroup = (value: unknown): boolean =>
	isRecord(value) &&
	typeof value.supplier_key === 'string' &&
	(typeof value.supplier_name === 'string' || value.supplier_name === null) &&
	isMoney(value.merchandise_subtotal) &&
	isMoney(value.shipping_amount) &&
	typeof value.currency === 'string' &&
	typeof value.free_shipping === 'boolean';

const hasRequestId = (value: unknown): value is JsonRecord =>
	isRecord(value) && typeof value.request_id === 'string';

/**
 * Keep malformed server payloads out of the native Store UI. The member
 * function is a remote boundary, so TypeScript's compile-time types cannot
 * provide runtime protection here.
 */
export const parseNativeCommerceResponse = <T>(
	action: string,
	payload: unknown,
): T => {
	const validBase = hasRequestId(payload);
	const record = isRecord(payload) ? payload : null;
	const valid = (() => {
		if (!validBase || !record) return false;

		switch (action) {
			case 'store':
				if (
					(record.store_mode === 'legacy' ||
						record.store_mode === 'paused') &&
					typeof record.fallback_url === 'string'
				)
					return true;
				return (
					(record.store_mode === 'shadow' ||
						record.store_mode === 'native') &&
					typeof record.gym_id === 'number' &&
					Array.isArray(record.products) &&
					Array.isArray(record.categories)
				);
			case 'cart.get':
			case 'cart.replace':
				return (
					typeof record.gym_id === 'number' &&
					typeof record.version === 'number' &&
					Array.isArray(record.lines) &&
					isMoney(record.subtotal) &&
					(!('shipping_groups' in record) ||
						(Array.isArray(record.shipping_groups) &&
							record.shipping_groups.every(isShippingGroup)))
				);
			case 'checkout.prepare':
				return (
					typeof record.gym_id === 'number' &&
					typeof record.order_id === 'string' &&
					(typeof record.order_number === 'number' ||
						typeof record.order_number === 'string') &&
					isMoney(record.subtotal) &&
					isMoney(record.shipping) &&
					isMoney(record.tax) &&
					isMoney(record.discount) &&
					isMoney(record.total) &&
					(!('shipping_groups' in record) ||
						(Array.isArray(record.shipping_groups) &&
							record.shipping_groups.every(isShippingGroup)))
				);
			case 'orders.list':
				return (
					typeof record.gym_id === 'number' &&
					Array.isArray(record.orders)
				);
			case 'orders.get':
				return (
					typeof record.gym_id === 'number' && isRecord(record.order)
				);
			default:
				return true;
		}
	})();

	if (!valid)
		throw new Error(`Invalid native commerce response for ${action}`);
	return payload as T;
};
