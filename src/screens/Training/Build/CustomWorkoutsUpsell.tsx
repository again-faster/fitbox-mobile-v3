import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import {
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<
	TrainingStackParamList,
	'TrainingCustomWorkoutsUpsell'
>;

const WS_UPSELL_URL = 'https://studio.fitbox.iq/custom-workouts';
const BENEFITS = [
	{
		icon: 'pencil-ruler',
		title: 'Build it your way',
		body: 'Choose exercises and organise each training section.',
	},
	{
		icon: 'calendar-blank-outline',
		title: 'Schedule ahead',
		body: 'Add workouts to your plan when they suit you.',
	},
	{
		icon: 'chart-line',
		title: 'Track your results',
		body: 'Log every session and see your progress over time.',
	},
] as const;

const CustomWorkoutsUpsell = ({ navigation }: Props) => (
	<SafeAreaView style={styles.screen} edges={['top']}>
		<View style={styles.header}>
			<TouchableOpacity
				accessibilityRole="button"
				accessibilityLabel="Go back"
				onPress={() => navigation.goBack()}
				style={styles.backButton}
			>
				<Ionicons
					name="arrow-left"
					size={24}
					color={trainingTheme.colors.text}
				/>
			</TouchableOpacity>
			<View style={styles.headerCopy}>
				<Text style={styles.headerTitle}>Custom workouts</Text>
				<Text style={styles.headerSubtitle}>
					Your training, your way.
				</Text>
			</View>
		</View>

		<ScrollView
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.hero}>
				<View style={styles.heroIcon}>
					<Ionicons
						name="dumbbell"
						size={42}
						color={trainingTheme.colors.primary}
					/>
				</View>
				<Text style={styles.eyebrow}>CUSTOM TRAINING</Text>
				<Text style={styles.title}>Build workouts made for you</Text>
				<Text style={styles.body}>
					Create repeatable sessions, put them in your calendar and
					keep your results together in Fitbox.
				</Text>
			</View>

			<View style={styles.benefitsCard}>
				{BENEFITS.map((benefit, index) => (
					<View
						key={benefit.title}
						style={[
							styles.benefit,
							index < BENEFITS.length - 1 &&
								styles.benefitDivider,
						]}
					>
						<View style={styles.benefitIcon}>
							<Ionicons
								name={benefit.icon}
								size={23}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<View style={styles.benefitCopy}>
							<Text style={styles.benefitTitle}>
								{benefit.title}
							</Text>
							<Text style={styles.benefitBody}>
								{benefit.body}
							</Text>
						</View>
					</View>
				))}
			</View>

			<View style={styles.actionArea}>
				<Text style={styles.accessNote}>
					Available through participating gyms or a solo subscription.
				</Text>
				<TouchableOpacity
					accessibilityRole="link"
					accessibilityLabel="Unlock Custom Workouts in your browser"
					style={styles.primaryButton}
					onPress={() => void Linking.openURL(WS_UPSELL_URL)}
				>
					<Text style={styles.primaryButtonText}>
						Explore Custom Workouts
					</Text>
					<Ionicons name="open-in-new" size={20} color="#FFFFFF" />
				</TouchableOpacity>
				<Text style={styles.hint}>
					Opens studio.fitbox.iq in your browser
				</Text>
			</View>
		</ScrollView>
	</SafeAreaView>
);

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: trainingTheme.colors.background,
	},
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
		fontSize: 15,
		lineHeight: 21,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	content: {
		paddingHorizontal: trainingTheme.spacing.lg,
		paddingBottom: trainingTheme.spacing.xxl,
	},
	hero: {
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.xl,
		alignItems: 'flex-start',
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
		fontSize: 12,
		lineHeight: 16,
		fontWeight: '800',
		letterSpacing: 1.1,
		color: trainingTheme.colors.primary,
		marginBottom: trainingTheme.spacing.sm,
	},
	title: {
		fontSize: 27,
		lineHeight: 33,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	body: {
		fontSize: 16,
		lineHeight: 24,
		color: trainingTheme.colors.textMuted,
		marginTop: trainingTheme.spacing.md,
	},
	benefitsCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		paddingHorizontal: trainingTheme.spacing.lg,
		marginTop: trainingTheme.spacing.lg,
		...trainingTheme.shadow,
	},
	benefit: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: trainingTheme.spacing.lg,
		gap: trainingTheme.spacing.md,
	},
	benefitDivider: {
		borderBottomWidth: 1,
		borderBottomColor: trainingTheme.colors.border,
	},
	benefitIcon: {
		width: 48,
		height: 48,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	benefitCopy: { flex: 1 },
	benefitTitle: {
		fontSize: 16,
		lineHeight: 21,
		fontWeight: '700',
		color: trainingTheme.colors.text,
	},
	benefitBody: {
		fontSize: 14,
		lineHeight: 20,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	actionArea: {
		marginTop: trainingTheme.spacing.xl,
		alignItems: 'center',
	},
	accessNote: {
		fontSize: 14,
		lineHeight: 20,
		color: trainingTheme.colors.textMuted,
		textAlign: 'center',
		paddingHorizontal: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.lg,
	},
	primaryButton: {
		minHeight: 56,
		width: '100%',
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primary,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: trainingTheme.spacing.sm,
		paddingHorizontal: trainingTheme.spacing.lg,
	},
	primaryButtonText: {
		fontSize: 16,
		lineHeight: 22,
		fontWeight: '800',
		color: '#FFFFFF',
	},
	hint: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: trainingTheme.spacing.md,
	},
});

export default CustomWorkoutsUpsell;
