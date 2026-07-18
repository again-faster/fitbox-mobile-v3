import { useState } from 'react';
import {
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { StackScreenProps } from '@react-navigation/stack';
import { clearWSSession } from '@/services/workoutStudio/auth';
import { mmkvStorage } from '@/storage';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingSettings'>;
const wellnessPromptsEnabledKey = 'training.wellnessPromptsEnabled';
const wellnessPromptDismissedDateKey = 'training.wellnessPromptDismissedDate';

const TrainingSettings = ({ navigation }: Props) => {
	const [unitKg, setUnitKg] = useState(true);
	const [restSound, setRestSound] = useState<'off' | 'chime' | 'vibrate'>(
		'off',
	);
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
	const chevron = (
		<Ionicons
			name="chevron-right"
			size={20}
			color={trainingTheme.colors.textMuted}
		/>
	);

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
		>
			<View style={styles.header}>
				<Text style={styles.title}>Training settings</Text>
				<Text style={styles.subtitle}>
					Personalise your workout experience.
				</Text>
			</View>
			<TouchableOpacity
				style={styles.row}
				onPress={() => navigation.navigate('TrainingProfile')}
			>
				<View>
					<Text style={styles.label}>Training profile</Text>
					<Text style={styles.description}>
						Scaling level and rep maxes
					</Text>
				</View>
				{chevron}
			</TouchableOpacity>
			<View style={styles.row}>
				<Text style={styles.label}>Weight unit</Text>
				<View style={styles.inline}>
					<Text style={[styles.unit, unitKg && styles.active]}>
						kg
					</Text>
					<Switch
						value={!unitKg}
						onValueChange={value => setUnitKg(!value)}
						trackColor={{
							true: trainingTheme.colors.primary,
							false: trainingTheme.colors.border,
						}}
					/>
					<Text style={[styles.unit, !unitKg && styles.active]}>
						lb
					</Text>
				</View>
			</View>
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>REST TIMER SOUND</Text>
				{(['off', 'chime', 'vibrate'] as const).map(option => (
					<TouchableOpacity
						key={option}
						style={styles.option}
						onPress={() => setRestSound(option)}
					>
						<Ionicons
							name={
								restSound === option
									? 'radiobox-marked'
									: 'radiobox-blank'
							}
							size={21}
							color={
								restSound === option
									? trainingTheme.colors.primary
									: trainingTheme.colors.textMuted
							}
						/>
						<Text style={styles.optionLabel}>
							{option.charAt(0).toUpperCase() + option.slice(1)}
						</Text>
					</TouchableOpacity>
				))}
			</View>
			<View style={styles.row}>
				<View style={styles.rowCopy}>
					<Text style={styles.label}>Daily wellness prompt</Text>
					<Text style={styles.description}>
						Show a check-in reminder each day
					</Text>
				</View>
				<Switch
					value={wellnessPromptsEnabled}
					onValueChange={updateWellnessPrompts}
					trackColor={{
						true: trainingTheme.colors.primary,
						false: trainingTheme.colors.border,
					}}
				/>
			</View>
			<TouchableOpacity
				style={styles.row}
				onPress={() => navigation.navigate('TrainingWellness')}
			>
				<Text style={styles.label}>Wellness consent</Text>
				{chevron}
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.row}
				onPress={() => navigation.navigate('TrainingWearables')}
			>
				<View>
					<Text style={styles.label}>Wearables</Text>
					<Text style={styles.description}>
						Connections, sync and readiness
					</Text>
				</View>
				{chevron}
			</TouchableOpacity>
			<TouchableOpacity
				style={[styles.row, styles.disconnect]}
				onPress={disconnect}
			>
				<Text style={[styles.label, styles.danger]}>
					Disconnect Training account
				</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	container: { padding: 16, paddingBottom: 48, gap: 12 },
	header: { marginBottom: 4 },
	title: {
		color: trainingTheme.colors.text,
		fontSize: 26,
		fontWeight: '700',
	},
	subtitle: {
		color: trainingTheme.colors.textMuted,
		fontSize: 14,
		marginTop: 4,
	},
	row: {
		minHeight: 72,
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: 18,
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	section: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: 18,
		padding: 16,
		gap: 14,
	},
	label: {
		color: trainingTheme.colors.text,
		fontSize: 16,
		fontWeight: '600',
	},
	description: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 3,
	},
	rowCopy: { flex: 1, paddingRight: 12 },
	inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	unit: {
		color: trainingTheme.colors.textMuted,
		fontSize: 15,
		fontWeight: '600',
	},
	active: { color: trainingTheme.colors.primary },
	sectionTitle: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 0.8,
	},
	option: {
		minHeight: 44,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 11,
	},
	optionLabel: { color: trainingTheme.colors.text, fontSize: 15 },
	disconnect: { marginTop: 6, justifyContent: 'center' },
	danger: { color: trainingTheme.colors.danger },
});

export default TrainingSettings;
