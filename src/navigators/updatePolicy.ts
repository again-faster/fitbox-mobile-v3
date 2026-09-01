export const PREVIEW_PACKAGE_NAME = 'com.againfaster.fitbox.preview';

export const shouldCheckMinimumVersion = (
	isDevelopmentBuild: boolean,
	bundleId?: string,
) => !isDevelopmentBuild && bundleId !== PREVIEW_PACKAGE_NAME;
