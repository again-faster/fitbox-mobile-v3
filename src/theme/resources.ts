import { ImageSourcePropType } from 'react-native';

import addReaction from './images/add-reaction.png';
import clapOIcon from './images/clap-o.png';
import clapIcon from './images/clap.png';
import commentsOIcon from './images/comments-o.png';
import commentsIcon from './images/comments.png';
import monthToDate from './images/month-to-date.png';
import yearToDate from './images/year-to-date.png';

export default {
	react: {
		clap: '👏',
		fire: '🔥',
		celebrate: '🎉',
		fist: '👊',
		poo: '💩',
	},
	icon: {
		clap: clapIcon as ImageSourcePropType,
		clapo: clapOIcon as ImageSourcePropType,
		comments: commentsIcon as ImageSourcePropType,
		commentso: commentsOIcon as ImageSourcePropType,
		addReaction: addReaction as ImageSourcePropType,
		monthToDate: monthToDate as ImageSourcePropType,
		yearToDate: yearToDate as ImageSourcePropType,
	},
};
