/**
 * Constant.ts
 * Should contain all the constant values used in the application.
 * Must be CAPITALIZED and use underscore (_) to separate words.
 */

import { Platform } from 'react-native';

const CONSTANT_SAMPLE = 'just a test';
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

export default {
	API_URL: process.env.API_URL ?? '',
	HELP_URL: process.env.HELP_URL ?? '',
	CONSTANT_SAMPLE,
	IS_ANDROID: Platform.OS === 'android',
	BODY_PARTS,
	QUESTIONS_LIST,
};
