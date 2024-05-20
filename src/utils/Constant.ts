/**
 * Constant.ts
 * Should contain all the constant values used in the application.
 * Must be CAPITALIZED and use underscore (_) to separate words.
 */

import { Platform } from 'react-native';

const CONSTANT_SAMPLE = 'just a test';

export default {
	API_URL: process.env.API_URL ?? '',
	HELP_URL: process.env.HELP_URL ?? '',
	CONSTANT_SAMPLE,
	IS_ANDROID: Platform.OS === 'android',
};
