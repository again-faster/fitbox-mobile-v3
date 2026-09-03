import {
	buildNativeCommerceHeaders,
	nativeCommerceEndpoint,
	parseNativeCommerceResponse,
} from './protocol';
import { isNativeStoreResponse } from './index';

describe('native commerce mobile protocol', () => {
	it('builds headers from the existing Fitbox signed store session', () => {
		expect(
			buildNativeCommerceHeaders(
				{
					email: 'member@example.com',
					first: 'Alex',
					last: 'Member',
					expiry: 2_000_000_100,
					signature: 'signature',
					gymId: 42,
				},
				'anon-key',
			),
		).toEqual({
			Accept: 'application/json',
			'Content-Type': 'application/json',
			apikey: 'anon-key',
			'x-fitbox-email': 'member@example.com',
			'x-fitbox-first': 'Alex',
			'x-fitbox-last': 'Member',
			'x-fitbox-expiry': '2000000100',
			'x-fitbox-signature': 'signature',
			'x-fitbox-gym': '42',
		});
	});

	it('adds the existing member bearer token for the native store bridge', () => {
		expect(
			buildNativeCommerceHeaders(
				{
					email: 'member@example.com',
					first: 'Alex',
					last: 'Member',
					expiry: 2_000_000_100,
					signature: 'signature',
					gymId: 42,
					memberToken: 'member-token',
				},
				'anon-key',
			),
		).toMatchObject({
			Authorization: 'Bearer member-token',
		});
	});

	it('normalizes the Supabase Edge Function endpoint', () => {
		expect(nativeCommerceEndpoint('https://example.supabase.co/')).toBe(
			'https://example.supabase.co/functions/v1/native-store-member',
		);
	});

	it('rejects malformed member responses before the UI consumes them', () => {
		expect(() =>
			parseNativeCommerceResponse('store', { request_id: 'r1' }),
		).toThrow('Invalid native commerce response');
	});

	it('accepts the canonical shadow store and supplier shipping groups', () => {
		const shippingGroup = {
			supplier_key: 'abco',
			supplier_name: 'ABCO',
			merchandise_subtotal: { currency: 'AUD', minor: 12000 },
			shipping_amount: { currency: 'AUD', minor: 900 },
			currency: 'AUD',
			free_shipping: false,
		};

		expect(
			parseNativeCommerceResponse('store', {
				request_id: 'r1',
				gym_id: 231,
				store_mode: 'shadow',
				currency: 'AUD',
				products: [],
				categories: [],
				next_cursor: null,
			}),
		).toMatchObject({ store_mode: 'shadow' });
		expect(
			parseNativeCommerceResponse('cart.get', {
				request_id: 'r2',
				gym_id: 231,
				version: 1,
				lines: [],
				subtotal: { currency: 'AUD', minor: 12000 },
				shipping_groups: [shippingGroup],
			}),
		).toMatchObject({ shipping_groups: [shippingGroup] });
	});

	it('accepts explicit legacy fallback responses and rejects malformed shipping groups', () => {
		expect(
			parseNativeCommerceResponse('store', {
				request_id: 'r1',
				gym_id: 231,
				store_mode: 'legacy',
				fallback_url: 'https://store.fitbox.iq/evolutionfit',
			}),
		).toMatchObject({ store_mode: 'legacy' });
		expect(() =>
			parseNativeCommerceResponse('cart.get', {
				request_id: 'r2',
				gym_id: 231,
				version: 1,
				lines: [],
				subtotal: { currency: 'AUD', minor: 0 },
				shipping_groups: [{ supplier_key: 'abco' }],
			}),
		).toThrow('Invalid native commerce response');
	});

	it('narrows store responses without treating a legacy fallback as a catalogue', () => {
		expect(
			isNativeStoreResponse({
				request_id: 'r1',
				gym_id: 231,
				store_mode: 'shadow',
				currency: 'AUD',
				products: [],
				categories: [],
				next_cursor: null,
			}),
		).toBe(true);
		expect(
			isNativeStoreResponse({
				request_id: 'r2',
				gym_id: 231,
				store_mode: 'legacy',
				fallback_url: 'https://store.fitbox.iq/evolutionfit',
			}),
		).toBe(false);
	});
});
