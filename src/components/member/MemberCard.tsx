import { memberTheme } from '@/theme/member';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MemberText from './MemberText';

interface MemberCardProps extends PropsWithChildren {
	title?: string;
	subtitle?: string;
	style?: StyleProp<ViewStyle>;
	elevated?: boolean;
}

const MemberCard = ({
	children,
	title,
	subtitle,
	style,
	elevated = true,
}: MemberCardProps) => (
	<View style={[styles.card, elevated && memberTheme.shadow, style]}>
		{title ? <MemberText variant="sectionTitle">{title}</MemberText> : null}
		{subtitle ? (
			<MemberText variant="meta" muted>
				{subtitle}
			</MemberText>
		) : null}
		{title || subtitle ? (
			<View style={styles.content}>{children}</View>
		) : (
			children
		)}
	</View>
);

const styles = StyleSheet.create({
	card: {
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.lg,
		borderWidth: 1,
		borderColor: memberTheme.colors.border,
		padding: memberTheme.surfaces.cardPadding,
	},
	content: {
		marginTop: memberTheme.spacing.md,
	},
});

export default MemberCard;
