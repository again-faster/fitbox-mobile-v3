import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { trainingTheme } from '@/theme/training';

type Props = PropsWithChildren<{
	style?: ViewStyle | ViewStyle[];
	accent?: 'primary' | 'success' | 'warning';
}>;

const accentColor = {
	primary: trainingTheme.colors.primary,
	success: trainingTheme.colors.success,
	warning: trainingTheme.colors.warning,
};

const TrainingCard = ({ children, style, accent }: Props) => (
	<View
		style={[
			styles.card,
			accent
				? { borderLeftColor: accentColor[accent], borderLeftWidth: 4 }
				: null,
			style,
		]}
	>
		{children}
	</View>
);

const styles = StyleSheet.create({
	card: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: trainingTheme.radius.md,
		padding: trainingTheme.spacing.lg,
	},
});

export default TrainingCard;
