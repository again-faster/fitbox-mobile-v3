import { memberTheme } from '@/theme/member';
import type { PropsWithChildren } from 'react';
import {
	Pressable,
	StyleSheet,
	View,
	type StyleProp,
	type ViewStyle,
} from 'react-native';
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
}: MemberSectionProps) => {
	const action = (() => {
		if (!actionLabel) return null;

		const content = (
			<MemberText variant="label" style={styles.actionLabel}>
				{actionLabel}
			</MemberText>
		);

		if (onActionPress) {
			return (
				<Pressable
					style={styles.action}
					onPress={onActionPress}
					accessibilityRole="button"
					accessibilityLabel={actionAccessibilityLabel ?? actionLabel}
				>
					{content}
				</Pressable>
			);
		}

		return <View style={styles.action}>{content}</View>;
	})();

	return (
		<View style={[styles.section, style]}>
			<View style={styles.header}>
				<MemberText variant="sectionTitle">{title}</MemberText>
				{action}
			</View>
			{children}
		</View>
	);
};

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
