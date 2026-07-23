import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingActivate'>;
type Message = {
	icon: string;
	eyebrow: string;
	title: string;
	body: string;
	nextStep: string;
};

const MESSAGES: Record<string, Message> = {
	NOT_FOUND: {
		icon: 'account-plus-outline',
		eyebrow: 'PROFILE LINK NEEDED',
		title: 'Activate your training profile',
		body: "Your Fitbox account isn't linked to Workout Studio yet.",
		nextStep:
			'Ask your gym team to add you to Workout Studio using the same email address as your Fitbox account.',
	},
	NO_MEMBERSHIP: {
		icon: 'account-off-outline',
		eyebrow: 'MEMBERSHIP NEEDED',
		title: 'No active training membership',
		body: 'Your Workout Studio account exists, but it does not have an active gym membership or solo subscription.',
		nextStep:
			'Contact your gym to confirm your membership, or activate a solo athlete subscription in Workout Studio.',
	},
	UNKNOWN_GYM: {
		icon: 'office-building-remove-outline',
		eyebrow: 'GYM SETUP NEEDED',
		title: "Your gym isn't connected yet",
		body: 'Workout Studio has not been enabled for your gym.',
		nextStep:
			'Ask your gym team to enable Workout Studio, or use a solo athlete subscription.',
	},
	PROVISION_FAILED: {
		icon: 'account-sync-outline',
		eyebrow: 'SETUP INTERRUPTED',
		title: 'Account setup did not finish',
		body: "We couldn't finish setting up your Workout Studio profile.",
		nextStep:
			'Try again now. If the problem continues, contact your gym or Fitbox support.',
	},
	NETWORK_ERROR: {
		icon: 'wifi-off',
		eyebrow: 'CONNECTION ISSUE',
		title: 'Workout Studio is out of reach',
		body: "We couldn't connect to Workout Studio from this device.",
		nextStep: 'Check your mobile data or Wi-Fi connection, then try again.',
	},
	default: {
		icon: 'account-plus-outline',
		eyebrow: 'WORKOUT STUDIO',
		title: 'Activate your training profile',
		body: 'Connect your Fitbox membership to access your complete training experience.',
		nextStep:
			'Your gym links your profile using the email address on your Fitbox account.',
	},
};

const benefits = [
	{ icon: 'dumbbell', label: 'Assigned workouts and training history' },
	{ icon: 'chart-line', label: 'Results, progress and personal records' },
	{ icon: 'heart-pulse', label: 'Wellness and recovery context' },
] as const;

const Activate = ({ route, navigation }: Props) => {
	const errorCode = route.params?.errorCode ?? 'default';
	const message = (MESSAGES[errorCode] ?? MESSAGES.default)!;
	const isRetryable =
		errorCode === 'NETWORK_ERROR' || errorCode === 'PROVISION_FAILED';

	return (
		<SafeAreaView style={styles.screen} edges={['top']}>
			<View style={styles.header}>
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityLabel="Go back"
					style={styles.backButton}
					onPress={() => navigation.goBack()}
				>
					<Ionicons
						name="arrow-left"
						size={24}
						color={trainingTheme.colors.text}
					/>
				</TouchableOpacity>
				<View style={styles.headerCopy}>
					<Text style={styles.headerTitle}>Training setup</Text>
					<Text style={styles.headerSubtitle}>
						Connect your Fitbox membership.
					</Text>
				</View>
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.heroCard}>
					<View style={styles.heroIcon}>
						<Ionicons
							name={message.icon}
							size={38}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<Text style={styles.eyebrow}>{message.eyebrow}</Text>
					<Text style={styles.title}>{message.title}</Text>
					<Text style={styles.body}>{message.body}</Text>
				</View>

				<View style={styles.nextStepCard}>
					<View style={styles.nextStepIcon}>
						<Ionicons
							name={isRetryable ? 'refresh' : 'lightbulb-outline'}
							size={23}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<View style={styles.flexCopy}>
						<Text style={styles.nextStepTitle}>
							What to do next
						</Text>
						<Text style={styles.nextStepBody}>
							{message.nextStep}
						</Text>
					</View>
				</View>

				{isRetryable && (
					<TouchableOpacity
						accessibilityRole="button"
						accessibilityLabel="Try connecting to Workout Studio again"
						style={styles.primaryButton}
						onPress={() => navigation.replace('TrainingRoot')}
					>
						<Ionicons name="refresh" size={20} color="#FFFFFF" />
						<Text style={styles.primaryButtonText}>Try again</Text>
					</TouchableOpacity>
				)}

				<Text style={styles.sectionTitle}>Once connected</Text>
				<View style={styles.benefitsCard}>
					{benefits.map((benefit, index) => (
						<View key={benefit.label}>
							<View style={styles.benefitRow}>
								<View style={styles.benefitIcon}>
									<Ionicons
										name={benefit.icon}
										size={22}
										color={trainingTheme.colors.primary}
									/>
								</View>
								<Text style={styles.benefitLabel}>
									{benefit.label}
								</Text>
							</View>
							{index < benefits.length - 1 && (
								<View style={styles.divider} />
							)}
						</View>
					))}
				</View>

				<View style={styles.helpRow}>
					<Ionicons
						name="shield-check-outline"
						size={20}
						color={trainingTheme.colors.success}
					/>
					<Text style={styles.helpText}>
						Use the same email in Fitbox and Workout Studio so your
						training data stays with the right profile.
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: trainingTheme.spacing.lg,
		paddingTop: trainingTheme.spacing.md,
		paddingBottom: trainingTheme.spacing.lg,
		gap: trainingTheme.spacing.md,
	},
	backButton: {
		width: trainingTheme.touchTarget,
		height: trainingTheme.touchTarget,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerCopy: { flex: 1 },
	headerTitle: {
		fontSize: 28,
		lineHeight: 34,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	headerSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	content: {
		paddingHorizontal: trainingTheme.spacing.lg,
		paddingBottom: trainingTheme.spacing.xxl,
		gap: trainingTheme.spacing.lg,
	},
	heroCard: {
		alignItems: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.xl,
	},
	heroIcon: {
		width: 72,
		height: 72,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: trainingTheme.spacing.lg,
	},
	eyebrow: {
		fontSize: 11,
		lineHeight: 15,
		fontWeight: '800',
		letterSpacing: 1,
		color: trainingTheme.colors.primary,
		textAlign: 'center',
	},
	title: {
		fontSize: 25,
		lineHeight: 31,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		textAlign: 'center',
		marginTop: trainingTheme.spacing.sm,
	},
	body: {
		fontSize: 15,
		lineHeight: 22,
		color: trainingTheme.colors.textMuted,
		textAlign: 'center',
		marginTop: trainingTheme.spacing.sm,
	},
	nextStepCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: trainingTheme.spacing.md,
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surface,
		...trainingTheme.shadow,
	},
	nextStepIcon: {
		width: 46,
		height: 46,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	flexCopy: { flex: 1 },
	nextStepTitle: {
		fontSize: 16,
		lineHeight: 21,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	nextStepBody: {
		fontSize: 13,
		lineHeight: 19,
		color: trainingTheme.colors.textMuted,
		marginTop: 4,
	},
	primaryButton: {
		minHeight: 54,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primary,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: trainingTheme.spacing.sm,
	},
	primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
	sectionTitle: {
		fontSize: 20,
		lineHeight: 26,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		marginTop: trainingTheme.spacing.sm,
	},
	benefitsCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		paddingHorizontal: trainingTheme.spacing.lg,
		...trainingTheme.shadow,
	},
	benefitRow: {
		minHeight: 72,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		paddingVertical: trainingTheme.spacing.md,
	},
	benefitIcon: {
		width: 44,
		height: 44,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	benefitLabel: {
		flex: 1,
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '700',
		color: trainingTheme.colors.text,
	},
	divider: { height: 1, backgroundColor: trainingTheme.colors.border },
	helpRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: trainingTheme.spacing.sm,
		paddingHorizontal: trainingTheme.spacing.sm,
	},
	helpText: {
		flex: 1,
		fontSize: 12,
		lineHeight: 18,
		color: trainingTheme.colors.textMuted,
	},
});

export default Activate;
