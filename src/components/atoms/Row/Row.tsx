import {
	FlexAlignType,
	StyleProp,
	TouchableOpacity,
	View,
	ViewStyle,
} from 'react-native';

interface RowProps {
	spacing?:
		| 'flex-start'
		| 'flex-end'
		| 'center'
		| 'space-between'
		| 'space-around'
		| 'space-evenly';
	align?: FlexAlignType;
	onPress?: () => void;
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}

const Row = ({
	spacing: justifyContent,
	align: alignItems,
	children,
	onPress,
	style,
}: RowProps) => {
	const viewStyle: StyleProp<ViewStyle> = {
		flexDirection: 'row',
		justifyContent,
		alignItems,
	};

	const component = <View style={[viewStyle, style]}>{children}</View>;

	if (onPress) {
		return (
			<TouchableOpacity onPress={onPress}>{component}</TouchableOpacity>
		);
	}

	return component;
};

export default Row;
