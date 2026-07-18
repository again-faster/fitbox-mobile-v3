import {
	StyleSheet,
	Text,
	TouchableOpacity,
	type GestureResponderEvent,
} from 'react-native';
import { trainingTheme } from '@/theme/training';

type Props = {
	label: string;
	onPress: (event: GestureResponderEvent) => void;
	disabled?: boolean;
};

const PrimaryButton = ({ label, onPress, disabled = false }: Props) => (
	<TouchableOpacity
		accessibilityRole="button"
		accessibilityState={{ disabled }}
		activeOpacity={0.82}
		disabled={disabled}
		onPress={onPress}
		style={[styles.button, disabled && styles.disabled]}
	>
		<Text style={styles.label}>{label}</Text>
	</TouchableOpacity>
);

const styles = StyleSheet.create({
	button: {
		minHeight: 48,
		borderRadius: trainingTheme.radius.sm,
		backgroundColor: trainingTheme.colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: trainingTheme.spacing.lg,
	},
	disabled: { opacity: 0.5 },
	label: {
		color: '#FFFFFF',
		fontFamily: 'Inter-Variable',
		fontSize: 15,
		fontWeight: '700',
	},
});

export default PrimaryButton;
