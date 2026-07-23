import { memberTheme } from '@/theme/member';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

interface MemberCardProps extends PropsWithChildren {
	style?: ViewStyle | ViewStyle[];
	elevated?: boolean;
}

const MemberCard = ({ children, style, elevated = true }: MemberCardProps) => (
	<View style={[styles.card, elevated && memberTheme.shadow, style]}>
		{children}
	</View>
);

const styles = StyleSheet.create({
	card: {
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.lg,
		borderWidth: 1,
		borderColor: memberTheme.colors.border,
		padding: memberTheme.spacing.lg,
	},
});

export default MemberCard;
