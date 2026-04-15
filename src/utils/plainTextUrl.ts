/**
 * Helpers for detecting and opening URLs typed as plain text in chat (not HTML anchors).
 */

/** Strip trailing punctuation often glued to pasted URLs. */
export const trimTrailingNonUrlChars = (url: string): string => {
	let u = url.trimEnd();
	while (u.length > 0 && /[),.;:!?]+$/u.test(u)) {
		u = u.slice(0, -1);
	}
	return u;
};

const hasExplicitScheme = (s: string): boolean => /^https?:\/\//i.test(s);

const isWwwHost = (s: string): boolean => /^www\./i.test(s);

/**
 * Hostname-style token (no scheme): at least one dot and a 2+ letter TLD, optional subdomains.
 */
export const looksLikeBareDomain = (s: string): boolean => {
	const t = trimTrailingNonUrlChars(s);
	if (!t || hasExplicitScheme(t) || isWwwHost(t)) return false;
	return /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(
		t,
	);
};

export const looksLikeLeadingPlainTextUrl = (token: string): boolean => {
	const t = trimTrailingNonUrlChars(token);
	if (!t) return false;
	return hasExplicitScheme(t) || isWwwHost(t) || looksLikeBareDomain(t);
};

/**
 * Apex bare host (`example.com`): prepend `www.` so opens like `https://www.example.com`.
 * Subdomains (`mail.example.com`) or explicit `http(s)` / `www.` are left as-is (aside from https for www).
 */
export const normalizePlainTextUrlToHttps = (matched: string): string => {
	const trimmed = trimTrailingNonUrlChars(matched.trim());
	if (!trimmed) return '';
	if (hasExplicitScheme(trimmed)) return trimmed;
	if (isWwwHost(trimmed)) {
		return `https://${trimmed}`;
	}
	if (looksLikeBareDomain(trimmed)) {
		const slashIdx = trimmed.indexOf('/');
		const hostWithMaybePort =
			slashIdx >= 0 ? trimmed.slice(0, slashIdx) : trimmed;
		const path = slashIdx >= 0 ? trimmed.slice(slashIdx) : '';
		const colonIdx = hostWithMaybePort.indexOf(':');
		const host =
			colonIdx >= 0
				? hostWithMaybePort.slice(0, colonIdx)
				: hostWithMaybePort;
		const portSuffix =
			colonIdx >= 0 ? hostWithMaybePort.slice(colonIdx) : '';
		const labelCount = host.split('.').filter(Boolean).length;
		if (labelCount === 2) {
			return `https://www.${host}${portSuffix}${path}`;
		}
		return `https://${trimmed}`;
	}
	return `https://${trimmed}`;
};

/**
 * URL passed to link-preview / fetch: trim, ensure scheme, lowercase http(s) so parsers match.
 */
export const normalizeForLinkPreviewRequest = (raw: string): string => {
	const trimmed = trimTrailingNonUrlChars(raw.trim());
	if (!trimmed) return trimmed;
	const withScheme = normalizePlainTextUrlToHttps(trimmed);
	return withScheme.replace(/^https?:\/\//i, m => m.toLowerCase());
};

/**
 * If the message starts with a URL token (http(s), www., or bare domain), peel it off for preview.
 * Remainder keeps original spacing after the first token (same as previous http-only behavior).
 */
export const splitLeadingPlainTextUrl = (
	text: string,
): { url: string | null; remainder: string } => {
	if (!text) return { url: null, remainder: text };
	const splitString = text.split(' ');
	const firstToken = splitString[0];
	if (firstToken === undefined || !looksLikeLeadingPlainTextUrl(firstToken)) {
		return { url: null, remainder: text };
	}
	const url = trimTrailingNonUrlChars(firstToken);
	splitString.shift();
	const remainder = splitString.join(' ');
	return { url, remainder };
};
