import { ImageSourcePropType } from 'react-native';

import addReaction from './images/add-reaction.png';
import bankCardCancel from './images/bank-card-cancel.png';
import birthday from './images/birthday-cake.png';
import clapOIcon from './images/clap-o.png';
import clapIcon from './images/clap.png';
import commentsOIcon from './images/comments-o.png';
import commentsIcon from './images/comments.png';
import faceBandage from './images/face-with-head-bandage.png';
import fractureLeg from './images/fracture-leg.png';
import monthToDate from './images/month-to-date.png';
import trophy from './images/trophy.png';
import yearToDate from './images/year-to-date.png';

export default {
	react: {
		clap: '👏',
		fire: '🔥',
		celebrate: '🎉',
		fist: '👊',
		poo: '💩',
		cake: '🎂',
	},
	icon: {
		clap: clapIcon as ImageSourcePropType,
		clapo: clapOIcon as ImageSourcePropType,
		comments: commentsIcon as ImageSourcePropType,
		commentso: commentsOIcon as ImageSourcePropType,
		addReaction: addReaction as ImageSourcePropType,
		monthToDate: monthToDate as ImageSourcePropType,
		yearToDate: yearToDate as ImageSourcePropType,
		birthday: birthday as ImageSourcePropType,
		fractureLeg: fractureLeg as ImageSourcePropType,
		bankCardCancel: bankCardCancel as ImageSourcePropType,
		faceBandage: faceBandage as ImageSourcePropType,
		trophy: trophy as ImageSourcePropType,
	},
};
