import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { trainingTheme } from '@/theme/training';

type Props = {
	onRetry?: () => void;
	message?: string;
};

const OfflineBanner = ({
	onRetry,
	message = "You're offline. Some Training information may be out of date.",
}: Props) => (
	<View style={styles.banner} accessibilityRole="alert">
		<Ionicons
			name="wifi-off"
			size={18}
			color={trainingTheme.colors.warning}
		/>
		<Text style={styles.message}>{message}</Text>
		{onRetry ? (
			<TouchableOpacity
				accessibilityRole="button"
				onPress={onRetry}
				style={styles.retry}
			>
				<Text style={styles.retryText}>Retry</Text>
			</TouchableOpacity>
		) : null}
	</View>
);

const styles = StyleSheet.create({
	banner: {
		minHeight: trainingTheme.touchTarget,
		borderRadius: trainingTheme.radius.sm,
		backgroundColor: trainingTheme.colors.warningSoft,
		borderColor: '#F0D699',
		borderWidth: StyleSheet.hairlineWidth,
		paddingHorizontal: trainingTheme.spacing.md,
		paddingVertical: trainingTheme.spacing.sm,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.sm,
	},
	message: {
		flex: 1,
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 12,
		lineHeight: 17,
	},
	retry: {
		minHeight: trainingTheme.touchTarget,
		justifyContent: 'center',
		paddingHorizontal: trainingTheme.spacing.xs,
	},
	retryText: {
		color: trainingTheme.colors.warning,
		fontFamily: 'Inter-Variable',
		fontSize: 13,
		fontWeight: '700',
	},
});

export default OfflineBanner;
