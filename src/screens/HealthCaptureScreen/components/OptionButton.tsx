import { Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import { StyleSheet, TouchableOpacity } from 'react-native';

const OptionButton = ({
	title,
	pressed,
	onPress,
}: {
	title: string;
	pressed: boolean;
	onPress: () => void;
}) => {
	const color = pressed ? 'white' : config.backgrounds.darkgray;
	const background = pressed ? config.colors.brand : 'transparent';

	const buttonStyle = {
		...styles.optionButtonStyles,
		borderColor: color,
		backgroundColor: background,
	};

	return (
		<TouchableOpacity style={buttonStyle} onPress={onPress}>
			<Text style={{ color }}>{title}</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	optionButtonStyles: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderWidth: 1,
		borderRadius: 4,
		alignItems: 'center',
		justifyContent: 'center',
		width: '20%',
		height: 30,
	},
});

export default OptionButton;
