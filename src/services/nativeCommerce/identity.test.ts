import { buildNativeCommerceIdentity } from './identity';

describe('native commerce identity bootstrap', () => {
	it('uses the member token when the legacy store signature is unavailable', () => {
		expect(
			buildNativeCommerceIdentity({
				teamId: 231,
				email: 'member@example.com',
				first: 'Alex',
				last: 'Member',
				memberToken: 'member-token',
			}),
		).toEqual({
			email: 'member@example.com',
			first: 'Alex',
			last: 'Member',
			gymId: 231,
			memberToken: 'member-token',
		});
	});

	it('preserves the legacy signed-session identity when no member token exists', () => {
		expect(
			buildNativeCommerceIdentity({
				teamId: 231,
				email: 'member@example.com',
				first: 'Alex',
				last: 'Member',
				storeSignature: 'signature',
				storeSignatureExpiry: 2_000_000_100,
			}),
		).toEqual({
			email: 'member@example.com',
			first: 'Alex',
			last: 'Member',
			expiry: 2_000_000_100,
			signature: 'signature',
			gymId: 231,
		});
	});

	it('does not enter the native path without either supported credential', () => {
		expect(
			buildNativeCommerceIdentity({
				teamId: 231,
				email: 'member@example.com',
				first: 'Alex',
				last: 'Member',
			}),
		).toBeNull();
	});
});
