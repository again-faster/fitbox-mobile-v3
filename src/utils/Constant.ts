/**
 * Constant.ts
 * Should contain all the constant values used in the application.
 * Must be CAPITALIZED and use underscore (_) to separate words.
 */

import { NotificationSettings } from '@/types/schemas/notifications';
import { Dimensions, Platform } from 'react-native';

/**
 * This is to enable the environment picker in the login screen to switch between different environments
 */
const ENABLE_ENV_PICKER = false;

/**
 * This is the API token for the masquerade user
 * Leave it empty if you don't want to use the masquerade user
 */
const MASQUERADE_USER_API_TOKEN = '';

/**
 * Get the device height
 */
const DEVICEHEIGHT = Dimensions.get('screen').height;

/**
 * Get the device width
 */
const DEVICEWIDTH = Dimensions.get('screen').width;

/**
 * Base URLs for the API
 */
const API_BASE_URLS = {
	DEV: 'https://dev.fitbox.iq',
	STAGING: 'https://staging.fitbox.iq',
	PROD: 'https://fitbox.iq',
};

/**
 * Recaptcha keys
 */
const RECAPTCHA = {
	siteKey: '6Ldez1UdAAAAAI_K-Fz1pDkcbQCLHN3JZ6b8hXE1',
	baseURL: 'http://fitboxcorp.com/',
};

/**
 * Stripe Keys
 */
const STRIPE_PUBLISHABLE_KEY = {
	TEST: 'pk_test_FXdNftSfeoWHolUG1cwGCLxK00gUIDUAec',
	LIVE: 'pk_live_o1GIALVbZwAltbmrw1rXaOyf00T1zjQ3RU',
};

const SORT_OPTIONS = [
	{ name: 'Members', value: 'player' },
	{ name: 'Staff', value: 'staff' },
	{ name: 'Groups', value: 'group' },
];

/**
 * Default date format
 */
const DEFAULT_DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Tenor API Key
 */
const TENOR_API_KEY = 'AIzaSyCe3wcxBWD8Oe5SBfBz7qhR2680gYvIqEA';

/**
 * Notification Service URL for Push Notifications depending on the environment
 */

const NOTIFICATION_SERVICE_URL = {
	DEV: 'https://fitbox-dev-microservices.azurewebsites.net/api/NotificationService?code=sYC9PuVtRl8udPnN8LQTzF/gX2YtX0OltS6xX3bQCAp1ZH0Mg3FknQ==',
	STG: 'https://fitbox-stg-microservices.azurewebsites.net/api/NotificationService?code=/W0YnAVNdmeGd/gcnAbvIMQqhcpTpiKIs0Qk696AfcAG5EeD5Bg5/Q==',
	PROD: 'https://fitbox.azurewebsites.net/api/NotificationService?code=Eb7se86SBFJyrQYlOc1294j45eT86UXCuRHV5d6ZpWHf3QpYMUrBog==',
};
/**
 * Number of results to show in the performance summary on fetch
 */
const PAGINATE_FETCH_LIMIT = 20;

/**
 * Options for Notification Settings
 */
const NOTIFICATION_SETTINGS: NotificationSettings = {
	session: {
		title: 'Session Start',
		description: 'Receive a notification when a session is about to start',
		defaultValue: false,
		disabled: false,
	},
	// Note: Commenting this for now since these options aren't configurable as of the moment
	// waitlist: {
	//     title: "Waitlist",
	//     description: "Receive a notification when a session is about to start",
	//     defaultValue: true,
	//     disabled: true // TODO: disabled for now, backend will be implemented
	// },
	// message: {
	//     title: "Messages",
	//     description: "Stay up to date by receiving a notification whenever a new message is received.",
	//     defaultValue: true,
	//     disabled: true // TODO: disabled for now, backend will be implemented
	// },

	// NOTE: Add more settings here
};

// Movement params used in SessionSections tab
const MOVEMENT_PARAMS = [
	{ key: 'calories' },
	{ key: 'distance' },
	{ key: 'height' },
	{ key: 'weight' },
	{ key: 'time' },
];

// Timeout in milliseconds for getting a response
const RESPONSE_TIMEOUT = {
	DEV: 70000,
	STG: 70000,
	PROD: 30000,
};

// Transaction Fees in subscription details
const TRANSACTION_FEES = {
	CARD: {
		title: 'Card:',
		value: '$0.35 + 1.75%',
	},
	DIRECT_DEBIT: {
		title: 'Direct-Debit:',
		value: '$0.35 + 1.0%',
	},
	FAILED_PAYMENTS: {
		title: 'Failed Payments:',
		value: '$6.00',
	},
};

const BETA_ACTIVE = 'https://fitbox.iq/beta_active';

/**
 * Min Version URL
 * just put empty string if you don't want to check for min version
 */
const MIN_VERSION_URL = 'https://fitbox.iq/appVersionConfig.json';

export default {
	ENABLE_ENV_PICKER,
	MASQUERADE_USER_API_TOKEN,
	API_URL: process.env.API_URL ?? '',
	HELP_URL: process.env.HELP_URL ?? '',
	WS_SUPABASE_URL:
		process.env.WS_SUPABASE_URL ??
		'https://vwubzxjfyfnxabbelcnz.supabase.co',
	WS_SUPABASE_ANON_KEY: process.env.WS_SUPABASE_ANON_KEY ?? '',
	WS_BRIDGE_URL:
		process.env.WS_BRIDGE_URL ??
		'https://studio.fitbox.iq/api/public/mobile/auth/exchange',
	WS_BRIDGE_KEY: process.env.WS_BRIDGE_KEY ?? '',
	WS_MOBILE_API_URL:
		process.env.WS_MOBILE_API_URL ??
		'https://studio.fitbox.iq/api/public/mobile',
	IS_ANDROID: Platform.OS === 'android',
	SORT_OPTIONS,
	DEFAULT_DATE_FORMAT,
	TENOR_API_KEY,
	API_BASE_URLS,
	DEVICEHEIGHT,
	DEVICEWIDTH,
	RECAPTCHA,
	STRIPE_PUBLISHABLE_KEY,
	PAGINATE_FETCH_LIMIT,
	NOTIFICATION_SERVICE_URL,
	NOTIFICATION_SETTINGS,
	MOVEMENT_PARAMS,
	RESPONSE_TIMEOUT,
	TRANSACTION_FEES,
	BETA_ACTIVE,
	MIN_VERSION_URL,
};
