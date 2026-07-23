import { memberTheme } from '@/theme/member';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

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
	<TouchableOpacity
		style={[styles.pill, selected && styles.selected]}
		onPress={onPress}
		activeOpacity={0.8}
		accessibilityRole="button"
		accessibilityLabel={accessibilityLabel ?? label}
		accessibilityState={{ selected }}
	>
		<Text style={[styles.label, selected && styles.selectedLabel]}>
			{label}
		</Text>
	</TouchableOpacity>
);

const styles = StyleSheet.create({
	pill: {
		minHeight: 42,
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
		color: memberTheme.colors.primaryInk,
		fontSize: 14,
		fontWeight: '600',
	},
	selectedLabel: {
		color: memberTheme.colors.surface,
	},
});

export default MemberPill;
