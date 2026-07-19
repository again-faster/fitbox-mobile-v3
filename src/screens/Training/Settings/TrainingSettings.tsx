import { clearWSSession } from '@/services/workoutStudio/auth';
import { mmkvStorage } from '@/storage';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import { useState } from 'react';
import {
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingSettings'>;
type RestSound = 'off' | 'chime' | 'vibrate';

const wellnessPromptsEnabledKey = 'training.wellnessPromptsEnabled';
const wellnessPromptDismissedDateKey = 'training.wellnessPromptDismissedDate';

const restSoundOptions: Array<{
	value: RestSound;
	label: string;
	icon: string;
}> = [
	{ value: 'off', label: 'Off', icon: 'volume-off' },
	{ value: 'chime', label: 'Chime', icon: 'bell-outline' },
	{ value: 'vibrate', label: 'Vibrate', icon: 'vibrate' },
];

const TrainingSettings = ({ navigation }: Props) => {
	const [unitKg, setUnitKg] = useState(true);
	const [restSound, setRestSound] = useState<RestSound>('off');
	const [wellnessPromptsEnabled, setWellnessPromptsEnabled] = useState(
		() => mmkvStorage.getString(wellnessPromptsEnabledKey) !== 'false',
	);

	const updateWellnessPrompts = (enabled: boolean) => {
		mmkvStorage.set(wellnessPromptsEnabledKey, String(enabled));
		if (enabled) mmkvStorage.delete(wellnessPromptDismissedDateKey);
		setWellnessPromptsEnabled(enabled);
	};

	const disconnect = () => {
		void clearWSSession();
		navigation.replace('TrainingRoot');
	};

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
					<Text style={styles.headerTitle}>Training settings</Text>
					<Text style={styles.headerSubtitle}>
						Your workout experience, your way.
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
							name="tune-variant"
							size={34}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<View style={styles.heroCopy}>
						<Text style={styles.heroEyebrow}>
							PERSONALISED TRAINING
						</Text>
						<Text style={styles.heroTitle}>
							Make training feel like yours
						</Text>
						<Text style={styles.heroBody}>
							Choose the cues, units and reminders that help you
							stay consistent.
						</Text>
					</View>
				</View>

				<Text style={styles.sectionTitle}>Personalisation</Text>
				<View style={styles.groupCard}>
					<TouchableOpacity
						accessibilityRole="button"
						accessibilityLabel="Open training profile"
						style={styles.linkRow}
						onPress={() => navigation.navigate('TrainingProfile')}
					>
						<View style={styles.rowIcon}>
							<Ionicons
								name="account-outline"
								size={23}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<View style={styles.flexCopy}>
							<Text style={styles.label}>Training profile</Text>
							<Text style={styles.description}>
								Scaling level and rep maxes
							</Text>
						</View>
						<Ionicons
							name="chevron-right"
							size={21}
							color={trainingTheme.colors.textMuted}
						/>
					</TouchableOpacity>
					<View style={styles.divider} />
					<View style={styles.settingBlock}>
						<View style={styles.settingHeading}>
							<View style={styles.rowIcon}>
								<Ionicons
									name="weight-kilogram"
									size={23}
									color={trainingTheme.colors.primary}
								/>
							</View>
							<View style={styles.flexCopy}>
								<Text style={styles.label}>Weight unit</Text>
								<Text style={styles.description}>
									Used across workouts and results
								</Text>
							</View>
						</View>
						<View
							accessibilityRole="radiogroup"
							style={styles.unitSelector}
						>
							{[
								{
									label: 'Kilograms',
									value: true,
									short: 'kg',
								},
								{ label: 'Pounds', value: false, short: 'lb' },
							].map(unit => (
								<TouchableOpacity
									key={unit.short}
									accessibilityRole="radio"
									accessibilityLabel={unit.label}
									accessibilityState={{
										selected: unitKg === unit.value,
									}}
									style={[
										styles.unitOption,
										unitKg === unit.value &&
											styles.optionSelected,
									]}
									onPress={() => setUnitKg(unit.value)}
								>
									<Text
										style={[
											styles.unitOptionText,
											unitKg === unit.value &&
												styles.optionSelectedText,
										]}
									>
										{unit.label}
									</Text>
									<Text
										style={[
											styles.unitShort,
											unitKg === unit.value &&
												styles.optionSelectedText,
										]}
									>
										{unit.short}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
				</View>

				<Text style={styles.sectionTitle}>Workout experience</Text>
				<View style={styles.groupCard}>
					<View style={styles.settingBlock}>
						<Text style={styles.label}>Rest timer cue</Text>
						<Text style={styles.description}>
							Choose how you know your rest has finished
						</Text>
						<View
							accessibilityRole="radiogroup"
							style={styles.soundSelector}
						>
							{restSoundOptions.map(option => {
								const selected = restSound === option.value;
								return (
									<TouchableOpacity
										key={option.value}
										accessibilityRole="radio"
										accessibilityState={{ selected }}
										style={[
											styles.soundOption,
											selected && styles.optionSelected,
										]}
										onPress={() =>
											setRestSound(option.value)
										}
									>
										<Ionicons
											name={option.icon}
											size={22}
											color={
												selected
													? trainingTheme.colors
															.primary
													: trainingTheme.colors
															.textMuted
											}
										/>
										<Text
											style={[
												styles.soundLabel,
												selected &&
													styles.optionSelectedText,
											]}
										>
											{option.label}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>
					<View style={styles.divider} />
					<View style={styles.switchRow}>
						<View style={styles.rowIcon}>
							<Ionicons
								name="heart-pulse"
								size={23}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<View style={styles.flexCopy}>
							<Text style={styles.label}>
								Daily wellness prompt
							</Text>
							<Text style={styles.description}>
								Show one check-in reminder each day
							</Text>
						</View>
						<Switch
							accessibilityLabel="Daily wellness prompt"
							value={wellnessPromptsEnabled}
							onValueChange={updateWellnessPrompts}
							trackColor={{
								true: trainingTheme.colors.primary,
								false: trainingTheme.colors.border,
							}}
							thumbColor={trainingTheme.colors.surface}
						/>
					</View>
				</View>

				<Text style={styles.sectionTitle}>Connections & privacy</Text>
				<View style={styles.groupCard}>
					<TouchableOpacity
						accessibilityRole="button"
						style={styles.linkRow}
						onPress={() => navigation.navigate('TrainingWellness')}
					>
						<View style={styles.rowIcon}>
							<Ionicons
								name="shield-check-outline"
								size={23}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<View style={styles.flexCopy}>
							<Text style={styles.label}>Wellness consent</Text>
							<Text style={styles.description}>
								Review how your check-in data is used
							</Text>
						</View>
						<Ionicons
							name="chevron-right"
							size={21}
							color={trainingTheme.colors.textMuted}
						/>
					</TouchableOpacity>
					<View style={styles.divider} />
					<TouchableOpacity
						accessibilityRole="button"
						style={styles.linkRow}
						onPress={() => navigation.navigate('TrainingWearables')}
					>
						<View style={styles.rowIcon}>
							<Ionicons
								name="watch-variant"
								size={23}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<View style={styles.flexCopy}>
							<Text style={styles.label}>Wearables</Text>
							<Text style={styles.description}>
								Connections, sync and readiness
							</Text>
						</View>
						<Ionicons
							name="chevron-right"
							size={21}
							color={trainingTheme.colors.textMuted}
						/>
					</TouchableOpacity>
				</View>

				<Text style={styles.sectionTitle}>Account</Text>
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityLabel="Disconnect Training account"
					style={styles.disconnectButton}
					onPress={disconnect}
				>
					<Ionicons
						name="link-variant-off"
						size={21}
						color={trainingTheme.colors.danger}
					/>
					<Text style={styles.disconnectText}>
						Disconnect Training account
					</Text>
				</TouchableOpacity>
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
		fontSize: 27,
		lineHeight: 33,
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
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.lg,
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
	},
	heroIcon: {
		width: 62,
		height: 62,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
	heroCopy: { flex: 1 },
	heroEyebrow: {
		fontSize: 10,
		lineHeight: 14,
		fontWeight: '800',
		letterSpacing: 0.8,
		color: trainingTheme.colors.primary,
	},
	heroTitle: {
		fontSize: 19,
		lineHeight: 24,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		marginTop: 4,
	},
	heroBody: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 4,
	},
	sectionTitle: {
		fontSize: 19,
		lineHeight: 24,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		marginTop: trainingTheme.spacing.sm,
	},
	groupCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		...trainingTheme.shadow,
	},
	linkRow: {
		minHeight: 82,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		padding: trainingTheme.spacing.lg,
	},
	settingBlock: { padding: trainingTheme.spacing.lg },
	settingHeading: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
	},
	switchRow: {
		minHeight: 86,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		padding: trainingTheme.spacing.lg,
	},
	rowIcon: {
		width: 46,
		height: 46,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	flexCopy: { flex: 1 },
	label: {
		fontSize: 16,
		lineHeight: 21,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	description: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 3,
	},
	divider: {
		height: 1,
		backgroundColor: trainingTheme.colors.border,
		marginHorizontal: trainingTheme.spacing.lg,
	},
	unitSelector: {
		flexDirection: 'row',
		gap: trainingTheme.spacing.sm,
		marginTop: trainingTheme.spacing.md,
	},
	unitOption: {
		flex: 1,
		minHeight: 54,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surfaceMuted,
		paddingHorizontal: trainingTheme.spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderColor: 'transparent',
	},
	unitOptionText: {
		fontSize: 13,
		fontWeight: '700',
		color: trainingTheme.colors.textMuted,
	},
	unitShort: {
		fontSize: 12,
		fontWeight: '800',
		color: trainingTheme.colors.textMuted,
	},
	optionSelected: {
		backgroundColor: trainingTheme.colors.primarySoft,
		borderColor: trainingTheme.colors.primary,
	},
	optionSelectedText: { color: trainingTheme.colors.primary },
	soundSelector: {
		flexDirection: 'row',
		gap: trainingTheme.spacing.sm,
		marginTop: trainingTheme.spacing.md,
	},
	soundOption: {
		flex: 1,
		minHeight: 76,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surfaceMuted,
		borderWidth: 1,
		borderColor: 'transparent',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 5,
	},
	soundLabel: {
		fontSize: 12,
		fontWeight: '700',
		color: trainingTheme.colors.textMuted,
	},
	disconnectButton: {
		minHeight: 58,
		borderRadius: trainingTheme.radius.lg,
		borderWidth: 1,
		borderColor: trainingTheme.colors.danger,
		backgroundColor: trainingTheme.colors.surface,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: trainingTheme.spacing.sm,
	},
	disconnectText: {
		fontSize: 14,
		fontWeight: '800',
		color: trainingTheme.colors.danger,
	},
});

export default TrainingSettings;
