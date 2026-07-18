import {
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { StackScreenProps } from '@react-navigation/stack';
import moment from 'moment';
import { mmkvStorage } from '@/storage';
import type { TrainingStackParamList } from '@/types/navigation';
import { trainingTheme } from '@/theme/training';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingWearables'>;
type ProviderProps = {
	name: string;
	description: string;
	icon: string;
	status: string;
	active?: boolean;
	onPress?: () => void;
};

const Provider = ({
	name,
	description,
	icon,
	status,
	active,
	onPress,
}: ProviderProps) => (
	<TouchableOpacity
		accessibilityRole={onPress ? 'button' : undefined}
		disabled={!onPress}
		onPress={onPress}
		style={styles.provider}
	>
		<View
			style={[styles.providerIcon, active && styles.providerIconActive]}
		>
			<Ionicons
				name={icon}
				size={23}
				color={
					active
						? trainingTheme.colors.primary
						: trainingTheme.colors.textMuted
				}
			/>
		</View>
		<View style={styles.providerCopy}>
			<Text style={styles.providerName}>{name}</Text>
			<Text style={styles.providerDescription}>{description}</Text>
		</View>
		<View style={[styles.statusPill, active && styles.statusActive]}>
			<Text
				style={[styles.statusText, active && styles.statusTextActive]}
			>
				{status}
			</Text>
		</View>
		{onPress ? (
			<Ionicons
				name="chevron-right"
				size={20}
				color={trainingTheme.colors.textMuted}
			/>
		) : null}
	</TouchableOpacity>
);

const Wearables = ({ navigation }: Props) => {
	const appleConnected =
		Platform.OS === 'ios' &&
		mmkvStorage.getString('healthkit.authorized') === 'true';
	const lastSync = mmkvStorage.getString('healthkit.lastSyncedAt');
	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
		>
			<Text style={styles.title}>Wearables</Text>
			<Text style={styles.subtitle}>
				Connect health data to support recovery context and attach
				recorded sessions to your training history.
			</Text>
			<View style={styles.privacyCard}>
				<Ionicons
					name="shield-check-outline"
					size={22}
					color={trainingTheme.colors.success}
				/>
				<View style={styles.providerCopy}>
					<Text style={styles.privacyTitle}>You stay in control</Text>
					<Text style={styles.privacyCopy}>
						Workout Studio only reads the categories you approve.
						Disconnecting stops future syncs.
					</Text>
				</View>
			</View>
			<Text style={styles.sectionTitle}>On this phone</Text>
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
					onPress={() => navigation.navigate('TrainingAppleHealth')}
				/>
			) : (
				<Provider
					name="Health Connect"
					description="Android health and fitness data"
					icon="heart-pulse"
					status="Not set up"
				/>
			)}
			<Text style={styles.sectionTitle}>Other providers</Text>
			<Provider
				name="WHOOP"
				description="Recovery, strain and sleep"
				icon="watch-variant"
				status="Web only"
			/>
			<Provider
				name="Fitbit"
				description="Activity, sleep and heart metrics"
				icon="watch"
				status="Web only"
			/>
			<Text style={styles.availability}>
				WHOOP and Fitbit connections are currently managed in Workout
				Studio on the web. Native mobile connection management will be
				added once their OAuth callback flow is available in this app.
			</Text>
			<Text style={styles.sectionTitle}>Readiness</Text>
			<View style={styles.readinessCard}>
				<View style={styles.readinessIcon}>
					<Ionicons
						name="weather-sunset-up"
						size={24}
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
							? 'Your synced metrics can contribute to readiness once Workout Studio has enough recent data.'
							: 'Readiness will use available recovery signals without changing your prescribed workout automatically.'}
					</Text>
				</View>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	container: { padding: 16, paddingBottom: 48, gap: 14 },
	title: {
		color: trainingTheme.colors.text,
		fontSize: 26,
		fontWeight: '700',
	},
	subtitle: {
		color: trainingTheme.colors.textMuted,
		fontSize: 14,
		lineHeight: 20,
		marginTop: -8,
	},
	sectionTitle: {
		color: trainingTheme.colors.text,
		fontSize: 17,
		fontWeight: '700',
		marginTop: 6,
	},
	privacyCard: {
		flexDirection: 'row',
		gap: 12,
		padding: 14,
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.successSoft,
	},
	privacyTitle: {
		color: trainingTheme.colors.text,
		fontSize: 14,
		fontWeight: '700',
	},
	privacyCopy: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 18,
		marginTop: 3,
	},
	provider: {
		minHeight: 82,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 11,
		padding: 13,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		backgroundColor: trainingTheme.colors.surface,
	},
	providerIcon: {
		width: 43,
		height: 43,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.surfaceMuted,
	},
	providerIconActive: { backgroundColor: trainingTheme.colors.primarySoft },
	providerCopy: { flex: 1 },
	providerName: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '700',
	},
	providerDescription: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 17,
		marginTop: 3,
	},
	statusPill: {
		borderRadius: 999,
		paddingHorizontal: 9,
		paddingVertical: 5,
		backgroundColor: trainingTheme.colors.surfaceMuted,
	},
	statusActive: { backgroundColor: trainingTheme.colors.successSoft },
	statusText: {
		color: trainingTheme.colors.textMuted,
		fontSize: 10,
		fontWeight: '700',
	},
	statusTextActive: { color: trainingTheme.colors.success },
	availability: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 18,
	},
	readinessCard: {
		minHeight: 100,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 13,
		padding: 15,
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	readinessIcon: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
});
export default Wearables;
