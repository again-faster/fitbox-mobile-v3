import { mmkvStorage } from '@/storage';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import moment from 'moment';
import {
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingWearables'>;
type ProviderProps = {
	name: string;
	description: string;
	icon: string;
	status: string;
	active?: boolean;
	available?: boolean;
	onPress?: () => void;
};

const Provider = ({
	name,
	description,
	icon,
	status,
	active = false,
	available = false,
	onPress,
}: ProviderProps) => (
	<TouchableOpacity
		accessibilityRole={onPress ? 'button' : undefined}
		accessibilityLabel={`${name}. ${description}. ${status}`}
		accessibilityState={{ disabled: !onPress }}
		disabled={!onPress}
		onPress={onPress}
		activeOpacity={0.75}
		style={styles.provider}
	>
		<View
			style={[
				styles.providerIcon,
				(active || available) && styles.providerIconAvailable,
			]}
		>
			<Ionicons
				name={icon}
				size={25}
				color={
					active || available
						? trainingTheme.colors.primary
						: trainingTheme.colors.textMuted
				}
			/>
		</View>
		<View style={styles.providerCopy}>
			<Text style={styles.providerName}>{name}</Text>
			<Text style={styles.providerDescription}>{description}</Text>
		</View>
		<View
			style={[
				styles.statusPill,
				available && styles.statusAvailable,
				active && styles.statusActive,
			]}
		>
			<Text
				style={[
					styles.statusText,
					available && styles.statusTextAvailable,
					active && styles.statusTextActive,
				]}
			>
				{status}
			</Text>
		</View>
		{onPress && (
			<Ionicons
				name="chevron-right"
				size={20}
				color={trainingTheme.colors.textMuted}
			/>
		)}
	</TouchableOpacity>
);

const Wearables = ({ navigation }: Props) => {
	const appleConnected =
		Platform.OS === 'ios' &&
		mmkvStorage.getString('healthkit.authorized') === 'true';
	const lastSync = mmkvStorage.getString('healthkit.lastSyncedAt');

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
					<Text style={styles.headerTitle}>Wearables</Text>
					<Text style={styles.headerSubtitle}>
						Your health data, connected.
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
							name="watch-variant"
							size={37}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<Text style={styles.heroEyebrow}>HEALTH CONNECTIONS</Text>
					<Text style={styles.heroTitle}>
						Bring recovery into focus
					</Text>
					<Text style={styles.heroBody}>
						Connect approved health metrics and recorded sessions to
						your Fitbox training history.
					</Text>
				</View>

				<View style={styles.privacyCard}>
					<View style={styles.privacyIcon}>
						<Ionicons
							name="shield-check-outline"
							size={24}
							color={trainingTheme.colors.success}
						/>
					</View>
					<View style={styles.providerCopy}>
						<Text style={styles.privacyTitle}>
							You stay in control
						</Text>
						<Text style={styles.privacyBody}>
							Only approved categories are read. Disconnecting
							stops future syncs.
						</Text>
					</View>
				</View>

				<View style={styles.sectionHeading}>
					<Text style={styles.sectionTitle}>On this phone</Text>
					<Text style={styles.sectionHint}>
						{Platform.OS === 'ios' ? 'iPhone' : 'Android'}
					</Text>
				</View>
				{Platform.OS === 'ios' ? (
					<Provider
						name="Apple Health"
						description={
							lastSync
								? `Last synced ${moment(lastSync).fromNow()}`
								: 'Workouts, sleep, heart and activity metrics'
						}
						icon="heart-pulse"
						status={appleConnected ? 'Connected' : 'Set up'}
						active={appleConnected}
						available
						onPress={() =>
							navigation.navigate('TrainingAppleHealth')
						}
					/>
				) : (
					<Provider
						name="Health Connect"
						description="Android health connection support is planned"
						icon="heart-pulse"
						status="Coming soon"
					/>
				)}

				<View style={styles.sectionHeading}>
					<Text style={styles.sectionTitle}>Other providers</Text>
					<Text style={styles.sectionHint}>Web managed</Text>
				</View>
				<View style={styles.providerGroup}>
					<Provider
						name="WHOOP"
						description="Recovery, strain and sleep"
						icon="watch-variant"
						status="Web only"
					/>
					<View style={styles.providerDivider} />
					<Provider
						name="Fitbit"
						description="Activity, sleep and heart metrics"
						icon="watch"
						status="Web only"
					/>
				</View>
				<View style={styles.webNote}>
					<Ionicons
						name="web"
						size={20}
						color={trainingTheme.colors.primary}
					/>
					<Text style={styles.webNoteText}>
						WHOOP and Fitbit connections are currently managed in
						Workout Studio on the web.
					</Text>
				</View>

				<Text style={styles.sectionTitle}>Readiness</Text>
				<View style={styles.readinessCard}>
					<View style={styles.readinessIcon}>
						<Ionicons
							name="weather-sunset-up"
							size={27}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<View style={styles.providerCopy}>
						<Text style={styles.providerName}>
							{appleConnected && lastSync
								? 'Health data synced'
								: 'Connect a wearable to get started'}
						</Text>
						<Text style={styles.providerDescription}>
							{appleConnected && lastSync
								? 'Recent signals can contribute to readiness once enough data is available.'
								: 'Readiness can add recovery context without automatically changing your prescribed workout.'}
						</Text>
					</View>
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
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.xl,
		alignItems: 'flex-start',
	},
	heroIcon: {
		width: 68,
		height: 68,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: trainingTheme.spacing.lg,
	},
	heroEyebrow: {
		fontSize: 11,
		lineHeight: 15,
		fontWeight: '800',
		letterSpacing: 1,
		color: trainingTheme.colors.primary,
	},
	heroTitle: {
		fontSize: 26,
		lineHeight: 32,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		marginTop: trainingTheme.spacing.sm,
	},
	heroBody: {
		fontSize: 15,
		lineHeight: 22,
		color: trainingTheme.colors.textMuted,
		marginTop: trainingTheme.spacing.sm,
	},
	privacyCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.successSoft,
	},
	privacyIcon: {
		width: 46,
		height: 46,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
	privacyTitle: {
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	privacyBody: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	sectionHeading: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: trainingTheme.spacing.sm,
	},
	sectionTitle: {
		fontSize: 20,
		lineHeight: 26,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	sectionHint: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
	},
	provider: {
		minHeight: 86,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surface,
	},
	providerGroup: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		...trainingTheme.shadow,
	},
	providerDivider: {
		height: 1,
		backgroundColor: trainingTheme.colors.border,
		marginHorizontal: trainingTheme.spacing.lg,
	},
	providerIcon: {
		width: 48,
		height: 48,
		borderRadius: trainingTheme.radius.md,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.surfaceMuted,
	},
	providerIconAvailable: {
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	providerCopy: { flex: 1 },
	providerName: {
		fontSize: 16,
		lineHeight: 21,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	providerDescription: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 3,
	},
	statusPill: {
		borderRadius: trainingTheme.radius.pill,
		paddingHorizontal: trainingTheme.spacing.sm,
		paddingVertical: 6,
		backgroundColor: trainingTheme.colors.surfaceMuted,
	},
	statusAvailable: { backgroundColor: trainingTheme.colors.primarySoft },
	statusActive: { backgroundColor: trainingTheme.colors.successSoft },
	statusText: {
		fontSize: 10,
		fontWeight: '800',
		color: trainingTheme.colors.textMuted,
	},
	statusTextAvailable: { color: trainingTheme.colors.primary },
	statusTextActive: { color: trainingTheme.colors.success },
	webNote: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: trainingTheme.spacing.sm,
		paddingHorizontal: trainingTheme.spacing.sm,
	},
	webNoteText: {
		flex: 1,
		fontSize: 12,
		lineHeight: 18,
		color: trainingTheme.colors.textMuted,
	},
	readinessCard: {
		minHeight: 104,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surface,
		...trainingTheme.shadow,
	},
	readinessIcon: {
		width: 54,
		height: 54,
		borderRadius: trainingTheme.radius.md,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
});

export default Wearables;
