export const PREVIEW_PACKAGE_NAME = 'com.againfaster.fitbox.preview';

export const shouldCheckMinimumVersion = (
	isDevelopmentBuild: boolean,
	bundleId: string,
	platform: string,
) =>
	!isDevelopmentBuild &&
	!(platform === 'ios' && bundleId === PREVIEW_PACKAGE_NAME);
