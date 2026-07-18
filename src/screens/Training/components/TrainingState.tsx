import { StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { trainingTheme } from '@/theme/training';
import PrimaryButton from './PrimaryButton';

type Props = {
	kind: 'empty' | 'error' | 'offline';
	title: string;
	message: string;
	actionLabel?: string;
	onAction?: () => void;
};

const iconFor = {
	empty: 'tray-outline',
	error: 'alert-circle-outline',
	offline: 'wifi-off',
} as const;

const TrainingState = ({
	kind,
	title,
	message,
	actionLabel,
	onAction,
}: Props) => (
	<View style={styles.container} accessibilityRole="summary">
		<View style={styles.iconCircle}>
			<Ionicons
				name={iconFor[kind]}
				size={28}
				color={trainingTheme.colors.textMuted}
			/>
		</View>
		<Text style={styles.title}>{title}</Text>
		<Text style={styles.message}>{message}</Text>
		{actionLabel && onAction ? (
			<View style={styles.action}>
				<PrimaryButton label={actionLabel} onPress={onAction} />
			</View>
		) : null}
	</View>
);

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		padding: trainingTheme.spacing.xl,
		gap: trainingTheme.spacing.sm,
	},
	iconCircle: {
		width: 56,
		height: 56,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.surfaceMuted,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: trainingTheme.spacing.xs,
	},
	title: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 18,
		fontWeight: '700',
		textAlign: 'center',
	},
	message: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		lineHeight: 21,
		textAlign: 'center',
		maxWidth: 320,
	},
	action: { minWidth: 180, marginTop: trainingTheme.spacing.md },
});

export default TrainingState;
