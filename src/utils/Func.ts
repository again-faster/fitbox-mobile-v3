/* eslint-disable quotes */

import {
	BookableSchemaType,
	SessionSectionSchemaType,
} from '@/types/schemas/session';
import moment from 'moment';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { VisibilityOptions } from './Enum';

const decodeHtml = (str: string): string => {
	const entityMap: Record<string, string> = {
		amp: '&',
		apos: "'",
		'#x27': "'",
		'#x2F': '/',
		'#39': "'",
		'#47': '/',
		lt: '<',
		gt: '>',
		nbsp: ' ',
		quot: '"',
		rsquo: "'",
		hellip: '...',
		ldquo: '“',
		rdquo: '”',
		ndash: '-',
		mdash: '–',
	};

	// Create a single regex pattern to match all entities.
	const entityRegex = new RegExp(
		`&(${Object.keys(entityMap).join('|')});`,
		'g',
	);

	// Use the regex to replace all entities in one pass with their corresponding values.
	return str.replace(
		entityRegex,
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		(match, entity) => entityMap[entity] || match,
	);
};

const stripHtmlTags = (str: string) => {
	return decodeHtml(str)
		.replace(/(<([^>]+)>)/gi, '')
		.replace(/&nbsp;/g, ' ');
};

const getDuration = (start: string, end: string) => {
	return moment.duration(moment(end).diff(moment(start))).asMinutes();
};

const checkSubscription = (bookable?: BookableSchemaType) => {
	let subscribed = true;

	if (bookable?.group_class === 'True') {
		if (
			bookable?.payment_details === 'False' ||
			bookable?.group_member === 'False'
		) {
			subscribed = false;
		}
	}

	return subscribed;
};

const isSessionVisible = (
	bookable: BookableSchemaType,
	checkVisibility: VisibilityOptions,
	visibility: VisibilityOptions,
) => {
	if (
		visibility === checkVisibility &&
		checkVisibility === VisibilityOptions.LIMITED
	) {
		return (
			(bookable?.group_class === 'True' &&
				bookable?.group_member === 'False') ||
			(bookable?.group_class === 'False' &&
				bookable?.payment_details === 'False')
		);
	}

	if (
		visibility === checkVisibility &&
		checkVisibility === VisibilityOptions.SUBSCRIBED
	) {
		return (
			(bookable?.group_class === 'True' &&
				bookable?.group_member === 'False') ||
			(bookable?.group_class === 'False' &&
				bookable?.payment_details === 'False')
		);
	}

	return false;
};

const checkSessionLock = (
	startTime: string,
	locktime_HH: number,
	locktime_MM: number,
) => {
	let isLock = false;

	// validate if not set, it is default 0 when both locktime fields have been migrated in DB, just a double check to make sure.
	const lockTimeHH = locktime_HH >= 0 ? locktime_HH : 0;
	const lockTimeMM = locktime_MM >= 0 ? locktime_MM : 0;

	if (lockTimeHH > 0 || lockTimeMM > 0) {
		// these are dates based on startTime data which is full time and date, we just subrtract time in hours and minutes.
		const lockTime = moment(startTime).subtract({
			hours: locktime_HH,
			minutes: locktime_MM,
		});
		const currTime = moment();

		isLock = !!currTime.isAfter(lockTime);
	}

	return isLock;
};

const getSpotLeft = (attendance_limit: number, number_of_attendees: number) => {
	let spotsLeft = null;

	if (attendance_limit !== null) {
		spotsLeft = attendance_limit - number_of_attendees;
	} else {
		spotsLeft = number_of_attendees + 10; // unlimited spots
	}

	return spotsLeft;
};

const checkSectionsIfAvailable = (
	sections: SessionSectionSchemaType[] | string,
) => typeof sections !== 'string' && sections.length !== 0;

const validURL = (s: string) => {
	const res = s.match(
		/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/g,
	);
	return res !== null;
};

const getYoutubeUrl = (u: string) => {
	let useId = '';

	const url = String(u)
		.replace(/(>|<)/gi, '')
		.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);

	if (url[2] !== undefined) {
		const [urlParts] = url[2].split(/[^0-9a-z_-]/i);
		useId = urlParts !== undefined ? urlParts : '';
	}

	return useId;
};

const getBase64 = async (uri: string) => {
	return ReactNativeBlobUtil.fs.readFile(uri, 'base64');
};

const getFileExt = (filename: string) => {
	const split: string[] = filename.split('.');
	return split.pop()?.toLowerCase();
};

export default {
	decodeHtml,
	stripHtmlTags,
	getDuration,
	checkSubscription,
	isSessionVisible,
	checkSessionLock,
	getSpotLeft,
	checkSectionsIfAvailable,
	validURL,
	getYoutubeUrl,
	getBase64,
	getFileExt,
};
