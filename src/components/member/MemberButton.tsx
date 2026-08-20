import { memberTheme } from '@/theme/member';
import {
	Pressable,
	StyleSheet,
	type GestureResponderEvent,
	type StyleProp,
	type ViewStyle,
} from 'react-native';
import MemberText from './MemberText';

export type MemberButtonVariant =
	| 'primary'
	| 'secondary'
	| 'outlined'
	| 'quiet'
	| 'danger';

type MemberButtonProps = {
	label: string;
	variant?: MemberButtonVariant;
	compact?: boolean;
	disabled?: boolean;
	onPress: (event?: GestureResponderEvent) => void;
	accessibilityLabel?: string;
	style?: StyleProp<ViewStyle>;
	testID?: string;
};

const MemberButton = ({
	label,
	variant = 'primary',
	compact = false,
	disabled = false,
	onPress,
	accessibilityLabel,
	style,
	testID,
}: MemberButtonProps) => (
	<Pressable
		testID={testID}
		style={[
			styles.button,
			compact ? styles.compact : styles.primary,
			styles[variant],
			disabled && styles.disabled,
			style,
		]}
		onPress={onPress}
		disabled={disabled}
		accessibilityRole="button"
		accessibilityLabel={accessibilityLabel ?? label}
		accessibilityState={{ disabled }}
	>
		<MemberText variant="button" style={styles[`${variant}Label`]}>
			{label}
		</MemberText>
	</Pressable>
);

const styles = StyleSheet.create({
	button: {
		minHeight: memberTheme.controls.minTouchTarget,
		paddingHorizontal: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.pill,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
	},
	primary: {
		minHeight: memberTheme.controls.primaryHeight,
		backgroundColor: memberTheme.colors.primary,
	},
	compact: {
		minHeight: memberTheme.controls.minTouchTarget,
		paddingVertical: 0,
	},
	secondary: {
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	outlined: {
		backgroundColor: memberTheme.colors.surface,
		borderWidth: 1,
		borderColor: memberTheme.colors.primary,
	},
	quiet: {
		backgroundColor: 'transparent',
		paddingHorizontal: memberTheme.spacing.sm,
	},
	danger: {
		backgroundColor: memberTheme.colors.danger,
	},
	primaryLabel: {
		color: memberTheme.colors.surface,
	},
	secondaryLabel: {
		color: memberTheme.colors.primaryInk,
	},
	outlinedLabel: {
		color: memberTheme.colors.primary,
	},
	quietLabel: {
		color: memberTheme.colors.primary,
	},
	dangerLabel: {
		color: memberTheme.colors.surface,
	},
	disabled: {
		backgroundColor: memberTheme.colors.disabledSoft,
		borderColor: memberTheme.colors.disabled,
	},
});

export default MemberButton;
