import { memberTheme } from '@/theme/member';
import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MemberText from './MemberText';

type MemberSectionProps = PropsWithChildren<{
	title: string;
	actionLabel?: string;
	onActionPress?: () => void;
	style?: StyleProp<ViewStyle>;
	actionAccessibilityLabel?: string;
}>;

const MemberSection = ({
	title,
	actionLabel,
	onActionPress,
	style,
	actionAccessibilityLabel,
	children,
}: MemberSectionProps) => (
	<View style={[styles.section, style]}>
		<View style={styles.header}>
			<MemberText role="sectionTitle">{title}</MemberText>
			{actionLabel && onActionPress ? (
				<Pressable
					style={styles.action}
					onPress={onActionPress}
					accessibilityRole="button"
					accessibilityLabel={actionAccessibilityLabel ?? actionLabel}
				>
					<MemberText role="label" style={styles.actionLabel}>
						{actionLabel}
					</MemberText>
				</Pressable>
			) : null}
		</View>
		{children}
	</View>
);

const styles = StyleSheet.create({
	section: {
		gap: memberTheme.surfaces.sectionGap,
	},
	header: {
		minHeight: memberTheme.controls.minTouchTarget,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	action: {
		minHeight: memberTheme.controls.minTouchTarget,
		paddingHorizontal: memberTheme.spacing.sm,
		alignItems: 'center',
		justifyContent: 'center',
	},
	actionLabel: {
		color: memberTheme.colors.primary,
	},
});

export default MemberSection;
