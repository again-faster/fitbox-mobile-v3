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
const ENABLE_ENV_PICKER = true;

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

// TODO: Move this to a more appropriate location
const BODY_PARTS = [
	{ label: 'Neck', value: 'Neck' },
	{ label: 'Shoulder', value: 'Shoulder' },
	{ label: 'Arm', value: 'Arm' },
	{ label: 'Elbow', value: 'Elbow' },
	{ label: 'Wrist', value: 'Wrist' },
	{ label: 'Hand', value: 'Hand' },
	{ label: 'Chest', value: 'Chest' },
	{ label: 'Abdomen', value: 'Abdomen' },
	{ label: 'Hip', value: 'Hip' },
	{ label: 'Leg', value: 'Leg' },
	{ label: 'Knee', value: 'Knee' },
	{ label: 'Ankle', value: 'Ankle' },
	{ label: 'Foot', value: 'Foot' },
];
const SORT_OPTIONS = [
	{ name: 'Members', value: 'player' },
	{ name: 'Staff', value: 'staff' },
	{ name: 'Groups', value: 'group' },
];

/**
 * Tenor API Key
 * TODO: transfer apiKey or retrieve somewhere
 */
const TENOR_API_KEY = 'AIzaSyCe3wcxBWD8Oe5SBfBz7qhR2680gYvIqEA';

// TODO: Move this to a more appropriate location
const QUESTIONS_LIST = [
	{
		qid: 'allergies',
		question: 'Do you have any allergies?',
		value: null,
		tableColumns: [
			{
				slug: 'allergy',
				title: 'Allergic To:',
				type: 'text',
				placeholder: 'e.g. Eggs',
				required: true,
			},
			{
				slug: 'requires_treatment_plan',
				title: 'Requires Treatment Plan?',
				type: 'checkbox',
			},
			{
				slug: 'notes',
				title: 'Notes:',
				type: 'text',
				required: true,
			},
		],
		data: [],
	},
	{
		qid: 'existingMedConditions',
		question: 'Do you have any Pre-Existing Medical Conditions? ',
		afterQuestionText: 'e.g. heart condition, respiratory condition',
		value: null,
		tableColumns: [
			{
				slug: 'condition',
				title: 'Condition Name:',
				type: 'text',
				required: true,
			},
			{
				slug: 'advised_to_limit_activities',
				title: 'Has your Doctor advised you to limit any activities as a result of your condition?',
				type: 'checkbox',
			},
			{
				slug: 'notes_and_limitations',
				title: 'Notes & Limitations:',
				type: 'text',
				required: true,
			},
		],
		data: [],
	},
	{
		qid: 'medications',
		question: 'Do you take any prescription medication?',
		value: null,
		tableColumns: [
			{
				slug: 'medication',
				title: 'Medication Name:',
				type: 'text',
				required: true,
			},
			{
				slug: 'advised_to_limit_activities',
				title: 'Has your Doctor or Pharmacist advised you to limit any activities while taking this medication?',
				type: 'checkbox',
				required: true,
			},
			{
				slug: 'notes_and_limitations',
				title: 'Notes & Limitations:',
				type: 'text',
				required: true,
			},
		],
		data: [],
	},
	{
		qid: 'injuries',
		question: 'Do you have any current injuries we should know about?',
		afterQuestionText: 'e.g. calf tear, ankle sprain, knee injury',
		value: null,
		singleData: true,
		tableColumns: [
			{
				slug: 'body_side',
				title: 'Body Side:',
				type: 'select',
				selectItems: [
					{ label: 'Left', value: 'left' },
					{ label: 'Right', value: 'right' },
				],
				required: true,
			},
			{
				slug: 'body_part',
				title: 'Body Part:',
				type: 'select',
				selectItems: BODY_PARTS,
				required: true,
			},
			{
				slug: 'description',
				title: 'Description:',
				type: 'text',
				required: true,
			},
			{
				slug: 'when_injury_occured',
				title: 'Approximately when did this injury occur:',
				type: 'date',
				required: true,
			},
			{
				slug: 'advised_to_limit_activities',
				title: 'Has your Doctor, Physiotherapist or other medical practitioner advised you to limit any activities while recovering from this injury:',
				type: 'checkbox',
				required: true,
			},
			{
				slug: 'activity_limitations',
				title: 'What limitations do you have while recovering from this injury:',
				type: 'text',
				required: true,
			},
		],
		data: [],
	},
];

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

export default {
	ENABLE_ENV_PICKER,
	MASQUERADE_USER_API_TOKEN,
	API_URL: process.env.API_URL ?? '',
	HELP_URL: process.env.HELP_URL ?? '',
	IS_ANDROID: Platform.OS === 'android',
	BODY_PARTS,
	QUESTIONS_LIST,
	SORT_OPTIONS,
	TENOR_API_KEY,
	API_BASE_URLS,
	DEVICEHEIGHT,
	DEVICEWIDTH,
	RECAPTCHA,
	STRIPE_PUBLISHABLE_KEY,
	PAGINATE_FETCH_LIMIT,
	NOTIFICATION_SERVICE_URL,
	NOTIFICATION_SETTINGS,
};
