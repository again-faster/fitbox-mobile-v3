import { memberTheme } from '@/theme/member';
import { Pressable, StyleSheet } from 'react-native';
import MemberText from './MemberText';

interface MemberPillProps {
	label: string;
	selected?: boolean;
	onPress: () => void;
	accessibilityLabel?: string;
}

const MemberPill = ({
	label,
	selected = false,
	onPress,
	accessibilityLabel,
}: MemberPillProps) => (
	<Pressable
		style={[styles.pill, selected && styles.selected]}
		onPress={onPress}
		accessibilityRole="button"
		accessibilityLabel={accessibilityLabel ?? label}
		accessibilityState={{ selected }}
	>
		<MemberText
			variant="label"
			style={[styles.label, selected && styles.selectedLabel]}
		>
			{label}
		</MemberText>
	</Pressable>
);

const styles = StyleSheet.create({
	pill: {
		minHeight: memberTheme.controls.minTouchTarget,
		paddingHorizontal: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.pill,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	selected: {
		backgroundColor: memberTheme.colors.ink,
	},
	label: {
		...memberTheme.typography.label,
		color: memberTheme.colors.primaryInk,
	},
	selectedLabel: {
		color: memberTheme.colors.surface,
	},
});

export default MemberPill;
