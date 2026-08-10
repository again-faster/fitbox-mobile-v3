import { memberTheme } from '@/theme/member';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MemberText from './MemberText';

export type MemberStatus = 'default' | 'success' | 'warning' | 'danger' | 'info';

type MemberStatusPillProps = {
	label: string;
	status?: MemberStatus;
	accessibilityLabel?: string;
	style?: StyleProp<ViewStyle>;
};

const MemberStatusPill = ({
	label,
	status = 'default',
	accessibilityLabel,
	style,
}: MemberStatusPillProps) => (
	<View
		style={[styles.pill, styles[status], style]}
		accessible
		accessibilityRole="text"
		accessibilityLabel={accessibilityLabel ?? label}
	>
		<MemberText role="label" style={styles[`${status}Label`]}>
			{label}
		</MemberText>
	</View>
);

const styles = StyleSheet.create({
	pill: {
		minHeight: memberTheme.controls.compactHeight,
		paddingHorizontal: memberTheme.spacing.md,
		borderRadius: memberTheme.radius.pill,
		alignItems: 'center',
		justifyContent: 'center',
		alignSelf: 'flex-start',
	},
	default: {
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	success: {
		backgroundColor: memberTheme.colors.successSoft,
	},
	warning: {
		backgroundColor: memberTheme.colors.warningSoft,
	},
	danger: {
		backgroundColor: memberTheme.colors.dangerSoft,
	},
	info: {
		backgroundColor: memberTheme.colors.infoSoft,
	},
	defaultLabel: {
		color: memberTheme.colors.primaryInk,
	},
	successLabel: {
		color: memberTheme.colors.success,
	},
	warningLabel: {
		color: memberTheme.colors.warning,
	},
	dangerLabel: {
		color: memberTheme.colors.danger,
	},
	infoLabel: {
		color: memberTheme.colors.info,
	},
});

export default MemberStatusPill;
