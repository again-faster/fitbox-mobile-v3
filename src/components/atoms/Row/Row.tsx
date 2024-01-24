import { FlexAlignType, StyleProp, View, ViewStyle } from 'react-native';
import { TouchableRipple } from 'react-native-paper';

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
		return <TouchableRipple onPress={onPress}>{component}</TouchableRipple>;
	}

	return component;
};

Row.defaultProps = {
	spacing: undefined,
	align: undefined,
	onPress: undefined,
	style: undefined,
};

export default Row;
