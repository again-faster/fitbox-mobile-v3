const PREVIEW_PACKAGE_NAMES = new Set([
	'com.againfaster.fitbox.preview',
	'com.wa.fitbox.dev',
]);

export const shouldCheckMinimumVersion = (
	isDevelopmentBuild: boolean,
	bundleId: string,
) => !isDevelopmentBuild && !PREVIEW_PACKAGE_NAMES.has(bundleId);
