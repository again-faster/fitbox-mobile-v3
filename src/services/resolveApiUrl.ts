export const resolveApiUrl = (
	persistedUrl: string | null | undefined,
	configuredUrl: string | null | undefined,
	fallbackUrl: string,
): string => {
	return persistedUrl?.trim() || configuredUrl?.trim() || fallbackUrl;
};
