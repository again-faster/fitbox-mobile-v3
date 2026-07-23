import { Text } from '@/components/atoms';
import { memberTheme } from '@/theme/member';
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
	const color = pressed
		? memberTheme.colors.surface
		: memberTheme.colors.primaryInk;
	const background = pressed
		? memberTheme.colors.primary
		: memberTheme.colors.surface;

	const buttonStyle = {
		...styles.optionButtonStyles,
		borderColor: pressed
			? memberTheme.colors.primary
			: memberTheme.colors.border,
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
		paddingHorizontal: memberTheme.spacing.lg,
		paddingVertical: memberTheme.spacing.sm,
		borderWidth: 1,
		borderRadius: memberTheme.radius.pill,
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: 96,
		minHeight: 42,
	},
});

export default OptionButton;
