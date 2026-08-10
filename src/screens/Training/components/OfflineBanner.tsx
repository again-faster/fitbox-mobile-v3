import { StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MemberButton, MemberText } from '@/components/member';
import { memberTheme } from '@/theme/member';

type Props = {
	onRetry?: () => void;
	message?: string;
};

const OfflineBanner = ({
	onRetry,
	message = "You're offline. Some Training information may be out of date.",
}: Props) => (
	<View style={styles.banner} accessibilityRole="alert">
		<Ionicons name="wifi-off" size={18} color={memberTheme.colors.warning} />
		<MemberText role="meta" style={styles.message}>{message}</MemberText>
		{onRetry ? (
			<MemberButton
				label="Retry"
				variant="quiet"
				compact
				onPress={onRetry}
				style={styles.retry}
			/>
		) : null}
	</View>
);

const styles = StyleSheet.create({
	banner: {
		minHeight: memberTheme.controls.minTouchTarget,
		borderRadius: memberTheme.radius.sm,
		backgroundColor: memberTheme.colors.warningSoft,
		borderColor: memberTheme.colors.warning,
		borderWidth: StyleSheet.hairlineWidth,
		paddingHorizontal: memberTheme.spacing.md,
		paddingVertical: memberTheme.spacing.sm,
		flexDirection: 'row',
		alignItems: 'center',
		gap: memberTheme.spacing.sm,
	},
	message: {
		flex: 1,
	},
	retry: {
		paddingHorizontal: memberTheme.spacing.xs,
	},
});

export default OfflineBanner;
