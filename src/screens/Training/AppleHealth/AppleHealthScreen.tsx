import { authorize, syncNow } from '@/services/healthKit';
import {
	configureBgSync,
	stopBgSync,
} from '@/services/healthKit/backgroundSync';
import { mmkvStorage } from '@/storage';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import { useCallback, useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Platform,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingAppleHealth'>;

const formatLastSynced = (iso: string | null): string => {
	if (!iso) return 'Not synced yet';
	const date = new Date(iso);
	return `Last synced ${date.toLocaleDateString(undefined, {
		day: 'numeric',
		month: 'short',
	})} at ${date.toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit',
	})}`;
};

const dataGroups = [
	{
		icon: 'dumbbell',
		title: 'Workouts',
		description: 'Session type, duration, energy and distance',
	},
	{
		icon: 'weather-night',
		title: 'Recovery',
		description: 'Sleep, HRV and resting heart rate',
	},
	{
		icon: 'walk',
		title: 'Activity',
		description: 'Steps, active energy and VO₂ max',
	},
	{
		icon: 'scale-bathroom',
		title: 'Body metrics',
		description: 'Body weight when you choose to share it',
	},
] as const;

const AppleHealthHeader = ({ onBack }: { onBack: () => void }) => (
	<View style={styles.header}>
		<TouchableOpacity
			accessibilityRole="button"
			accessibilityLabel="Go back"
			style={styles.backButton}
			onPress={onBack}
		>
			<Ionicons
				name="arrow-left"
				size={24}
				color={trainingTheme.colors.text}
			/>
		</TouchableOpacity>
		<View style={styles.headerCopy}>
			<Text style={styles.headerTitle}>Apple Health</Text>
			<Text style={styles.headerSubtitle}>
				Recovery and activity, together.
			</Text>
		</View>
	</View>
);

const AppleHealthScreen = ({ navigation }: Props) => {
	const [isAuthorized, setIsAuthorized] = useState(
		Platform.OS === 'ios' &&
			mmkvStorage.getString('healthkit.authorized') === 'true',
	);
	const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
		mmkvStorage.getString('healthkit.lastSyncedAt') ?? null,
	);
	const [isSyncing, setIsSyncing] = useState(false);

	useEffect(() => {
		if (Platform.OS !== 'ios') return;
		if (mmkvStorage.getString('healthkit.authorized') === 'true') {
			void configureBgSync();
		}
	}, []);

	const handleToggle = useCallback(async (value: boolean) => {
		if (value) {
			const granted = await authorize();
			if (granted) {
				mmkvStorage.set('healthkit.authorized', 'true');
				await configureBgSync();
				setIsAuthorized(true);
			} else {
				Alert.alert(
					'Apple Health not connected',
					'Review Health permissions and try again.',
				);
			}
		} else {
			stopBgSync();
			mmkvStorage.set('healthkit.authorized', 'false');
			setIsAuthorized(false);
		}
	}, []);

	const handleSyncNow = useCallback(async () => {
		setIsSyncing(true);
		try {
			await syncNow();
			setLastSyncedAt(
				mmkvStorage.getString('healthkit.lastSyncedAt') ?? null,
			);
			Alert.alert(
				'Sync complete',
				'Your latest Apple Health data has been sent to Workout Studio.',
			);
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('[AppleHealth] manual sync error', error);
			Alert.alert(
				"Apple Health couldn't sync",
				'Check your connection and Health permissions, then try again.',
			);
		} finally {
			setIsSyncing(false);
		}
	}, []);

	if (Platform.OS !== 'ios') {
		return (
			<SafeAreaView style={styles.screen} edges={['top']}>
				<AppleHealthHeader onBack={() => navigation.goBack()} />
				<View style={styles.unavailableContent}>
					<View style={styles.unavailableCard}>
						<View style={styles.appleIcon}>
							<Ionicons
								name="apple"
								size={40}
								color={trainingTheme.colors.text}
							/>
						</View>
						<Text style={styles.heroEyebrow}>APPLE HEALTH</Text>
						<Text style={styles.unavailableTitle}>
							Available on iPhone
						</Text>
						<Text style={styles.unavailableBody}>
							Apple Health is built into iOS. On Android, Fitbox
							will support Health Connect in a future release.
						</Text>
					</View>
					<View style={styles.infoCard}>
						<Ionicons
							name="shield-check-outline"
							size={24}
							color={trainingTheme.colors.success}
						/>
						<View style={styles.flexCopy}>
							<Text style={styles.infoTitle}>
								Your data stays private
							</Text>
							<Text style={styles.infoBody}>
								Fitbox only reads categories you approve and
								never writes to Apple Health.
							</Text>
						</View>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.screen} edges={['top']}>
			<AppleHealthHeader onBack={() => navigation.goBack()} />
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.heroCard}>
					<View style={styles.appleIcon}>
						<Ionicons
							name="apple"
							size={40}
							color={trainingTheme.colors.text}
						/>
					</View>
					<Text style={styles.heroEyebrow}>APPLE HEALTH</Text>
					<Text style={styles.heroTitle}>See the whole picture</Text>
					<Text style={styles.heroBody}>
						Bring approved recovery, activity and workout data into
						Fitbox for richer training context.
					</Text>
				</View>

				<View style={styles.connectionCard}>
					<View style={styles.connectionTopRow}>
						<View
							style={[
								styles.statusIcon,
								isAuthorized && styles.statusIconConnected,
							]}
						>
							<Ionicons
								name={isAuthorized ? 'check' : 'link-variant'}
								size={22}
								color={
									isAuthorized
										? trainingTheme.colors.success
										: trainingTheme.colors.primary
								}
							/>
						</View>
						<View style={styles.flexCopy}>
							<Text style={styles.connectionTitle}>
								{isAuthorized
									? 'Sync is on'
									: 'Connect Apple Health'}
							</Text>
							<Text style={styles.connectionStatus}>
								{isAuthorized
									? formatLastSynced(lastSyncedAt)
									: 'Choose the data you want to share'}
							</Text>
						</View>
						<Switch
							accessibilityLabel="Sync Apple Health with Fitbox"
							value={isAuthorized}
							onValueChange={value => {
								void handleToggle(value);
							}}
							trackColor={{
								false: trainingTheme.colors.border,
								true: trainingTheme.colors.primary,
							}}
							thumbColor={trainingTheme.colors.surface}
						/>
					</View>
					{isAuthorized && (
						<TouchableOpacity
							accessibilityRole="button"
							accessibilityLabel="Sync Apple Health now"
							disabled={isSyncing}
							style={[
								styles.syncButton,
								isSyncing && styles.syncButtonDisabled,
							]}
							onPress={() => {
								void handleSyncNow();
							}}
						>
							{isSyncing ? (
								<ActivityIndicator
									size="small"
									color="#FFFFFF"
								/>
							) : (
								<>
									<Ionicons
										name="sync"
										size={18}
										color="#FFFFFF"
									/>
									<Text style={styles.syncButtonText}>
										Sync now
									</Text>
								</>
							)}
						</TouchableOpacity>
					)}
				</View>

				<Text style={styles.sectionTitle}>Data you can share</Text>
				<View style={styles.dataCard}>
					{dataGroups.map((group, index) => (
						<View key={group.title}>
							<View style={styles.dataRow}>
								<View style={styles.dataIcon}>
									<Ionicons
										name={group.icon}
										size={22}
										color={trainingTheme.colors.primary}
									/>
								</View>
								<View style={styles.flexCopy}>
									<Text style={styles.dataTitle}>
										{group.title}
									</Text>
									<Text style={styles.dataDescription}>
										{group.description}
									</Text>
								</View>
							</View>
							{index < dataGroups.length - 1 && (
								<View style={styles.divider} />
							)}
						</View>
					))}
				</View>

				<View style={styles.infoCard}>
					<Ionicons
						name="shield-check-outline"
						size={24}
						color={trainingTheme.colors.success}
					/>
					<View style={styles.flexCopy}>
						<Text style={styles.infoTitle}>
							Read only and in your control
						</Text>
						<Text style={styles.infoBody}>
							Fitbox never writes to Apple Health. You can change
							permissions at any time in the Health app.
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
	unavailableContent: {
		paddingHorizontal: trainingTheme.spacing.lg,
		gap: trainingTheme.spacing.lg,
	},
	heroCard: {
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.xl,
	},
	unavailableCard: {
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.xl,
		alignItems: 'center',
	},
	appleIcon: {
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
	unavailableTitle: {
		fontSize: 25,
		lineHeight: 31,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		textAlign: 'center',
		marginTop: trainingTheme.spacing.sm,
	},
	unavailableBody: {
		fontSize: 15,
		lineHeight: 22,
		color: trainingTheme.colors.textMuted,
		textAlign: 'center',
		marginTop: trainingTheme.spacing.sm,
	},
	connectionCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		...trainingTheme.shadow,
	},
	connectionTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
	},
	statusIcon: {
		width: 48,
		height: 48,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	statusIconConnected: { backgroundColor: trainingTheme.colors.successSoft },
	flexCopy: { flex: 1 },
	connectionTitle: {
		fontSize: 16,
		lineHeight: 21,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	connectionStatus: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 3,
	},
	syncButton: {
		minHeight: trainingTheme.touchTarget,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primary,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: trainingTheme.spacing.sm,
		marginTop: trainingTheme.spacing.lg,
	},
	syncButtonDisabled: { opacity: 0.65 },
	syncButtonText: {
		fontSize: 14,
		fontWeight: '800',
		color: '#FFFFFF',
	},
	sectionTitle: {
		fontSize: 20,
		lineHeight: 26,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		marginTop: trainingTheme.spacing.sm,
	},
	dataCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		paddingHorizontal: trainingTheme.spacing.lg,
		...trainingTheme.shadow,
	},
	dataRow: {
		minHeight: 82,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		paddingVertical: trainingTheme.spacing.md,
	},
	dataIcon: {
		width: 44,
		height: 44,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	dataTitle: {
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	dataDescription: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	divider: { height: 1, backgroundColor: trainingTheme.colors.border },
	infoCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: trainingTheme.spacing.md,
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.successSoft,
	},
	infoTitle: {
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	infoBody: {
		fontSize: 12,
		lineHeight: 18,
		color: trainingTheme.colors.textMuted,
		marginTop: 3,
	},
});

export default AppleHealthScreen;
