import { StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { MemberButton, MemberText } from '@/components/member';
import { memberTheme } from '@/theme/member';

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
				color={memberTheme.colors.textMuted}
			/>
		</View>
		<MemberText variant="sectionTitle" style={styles.title}>
			{title}
		</MemberText>
		<MemberText variant="body" muted style={styles.message}>
			{message}
		</MemberText>
		{actionLabel && onAction ? (
			<View style={styles.action}>
				<MemberButton label={actionLabel} onPress={onAction} />
			</View>
		) : null}
	</View>
);

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		padding: memberTheme.spacing.xl,
		gap: memberTheme.spacing.sm,
	},
	iconCircle: {
		width: 56,
		height: 56,
		borderRadius: memberTheme.radius.pill,
		backgroundColor: memberTheme.colors.surfaceSoft,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: memberTheme.spacing.xs,
	},
	title: {
		textAlign: 'center',
	},
	message: {
		textAlign: 'center',
		maxWidth: 320,
	},
	action: { minWidth: 180, marginTop: memberTheme.spacing.md },
});

export default TrainingState;
