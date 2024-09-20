import { TextStyle, ViewStyle } from 'react-native';

export default {
	hide: {
		display: 'none',
	},
	col: {
		flexDirection: 'column',
	},
	colReverse: {
		flexDirection: 'column-reverse',
	},
	wrap: {
		flexWrap: 'wrap',
	},
	row: {
		flexDirection: 'row',
	},
	rowReverse: {
		flexDirection: 'row-reverse',
	},
	selfCenter: {
		alignSelf: 'center',
	},
	selfStart: {
		alignSelf: 'flex-start',
	},
	selfEnd: {
		alignSelf: 'flex-end',
	},
	selfStretch: {
		alignSelf: 'stretch',
	},
	itemsCenter: {
		alignItems: 'center',
	},
	itemsStart: {
		alignItems: 'flex-start',
	},
	itemsStretch: {
		alignItems: 'stretch',
	},
	itemsEnd: {
		alignItems: 'flex-end',
	},
	justifyCenter: {
		justifyContent: 'center',
	},
	justifyAround: {
		justifyContent: 'space-around',
	},
	justifyBetween: {
		justifyContent: 'space-between',
	},
	justifyEnd: {
		justifyContent: 'flex-end',
	},
	justifyStart: {
		justifyContent: 'flex-start',
	},
	/* Sizes Layouts */
	flex_1: {
		flex: 1,
	},
	fullWidth: {
		width: '100%',
	},
	fullHeight: {
		height: '100%',
	},
	/* Positions */
	relative: {
		position: 'relative',
	},
	absolute: {
		position: 'absolute',
	},
	top0: {
		top: 0,
	},
	bottom0: {
		bottom: 0,
	},
	left0: {
		left: 0,
	},
	right0: {
		right: 0,
	},
	z1: {
		zIndex: 1,
	},
	z10: {
		zIndex: 10,
	},
	// TODO: Remove unused font files once design is confirmed
	/* Fonts */
	fontMontserratRegular: {
		fontFamily: 'Montserrat-Regular',
	},
	fontMontserratBold: {
		fontFamily: 'Montserrat-Bold',
	},
	fontRobotoRegular: {
		fontFamily: 'Roboto-Regular',
	},
	fontBarlowLight: {
		fontFamily: 'Barlow-Light',
	},
	fontInterRegular: {
		fontFamily: 'Inter-Variable',
		fontWeight: '400',
	},
	fontInterBold: {
		fontFamily: 'Inter-Variable',
		fontWeight: 'bold',
	},
	/* Shadows */
	shadowLight: {
		backgroundColor: 'white',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 1,
		},
		shadowOpacity: 0.2,
		shadowRadius: 1.41,
		elevation: 2,
	},
	shadowMedium: {
		backgroundColor: 'white',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.23,
		shadowRadius: 2.62,
		elevation: 4,
	},
	shadowHeavy: {
		backgroundColor: 'white',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4.65,
		elevation: 8,
	},
} as const satisfies Record<string, ViewStyle | TextStyle>;
