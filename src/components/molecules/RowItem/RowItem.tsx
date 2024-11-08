import { Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import {
	StyleProp,
	StyleSheet,
	TextStyle,
	TouchableOpacity,
	ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface RowItemProps {
	title: string;
	onPress: () => void;
	containerStyle?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	rightIcon?: string;
	iconColor?: string;
	iconSize?: number;
}

const RowItem = ({
	title,
	onPress,
	containerStyle,
	textStyle,
	rightIcon,
	iconColor,
	iconSize,
}: RowItemProps) => {
	const useIconColor = iconColor ?? config.fonts.colors.info;

	const useIconSize = iconSize || 18;

	return (
		<TouchableOpacity
			activeOpacity={0.8}
			style={[styles.rowItemStyle, containerStyle]}
			onPress={onPress}
		>
			<Text size="md" color="darkgray" style={[layout.flex_1, textStyle]}>
				{title}
			</Text>
			{rightIcon && (
				<Icon
					name={rightIcon}
					color={useIconColor}
					size={useIconSize}
					style={{ width: useIconSize + 3 }}
				/>
			)}
		</TouchableOpacity>
	);
};

export default RowItem;

const styles = StyleSheet.create({
	rowItemStyle: {
		backgroundColor: 'white',
		width: '100%',
		borderColor: '#eee',
		borderWidth: 1,
		paddingHorizontal: 10,
		paddingVertical: 13,
		marginBottom: 10,
		borderRadius: 4,
		justifyContent: 'space-between',
		flexDirection: 'row',
		alignItems: 'center',
	},
});
