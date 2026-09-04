import type { NativeCommerceIdentity } from './protocol';

export type NativeCommerceIdentityInput = {
	teamId?: number | null;
	email?: string | null;
	first?: string | null;
	last?: string | null;
	storeSignature?: string | null;
	storeSignatureExpiry?: number | null;
	memberToken?: string | null;
};

/**
 * Build the credentials needed to probe the native store.
 *
 * The legacy WooCommerce signature is optional for the newer member-token
 * flow. Keeping the two credential paths independent prevents a missing
 * legacy field from silently forcing the app back to the WooCommerce WebView.
 */
export const buildNativeCommerceIdentity = (
	input: NativeCommerceIdentityInput,
): NativeCommerceIdentity | null => {
	const {
		teamId,
		email,
		first,
		last,
		storeSignature,
		storeSignatureExpiry,
		memberToken,
	} = input;
	const hasLegacySignature = Boolean(storeSignature && storeSignatureExpiry);
	const hasMemberToken = Boolean(memberToken);

	if (!teamId || !email || (!hasLegacySignature && !hasMemberToken))
		return null;

	return {
		email,
		first: first ?? '',
		last: last ?? '',
		...(hasLegacySignature
			? {
					expiry: storeSignatureExpiry as number,
					signature: storeSignature as string,
				}
			: {}),
		gymId: teamId,
		...(hasMemberToken ? { memberToken: memberToken as string } : {}),
	};
};
