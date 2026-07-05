import { clearWSSession } from '@/services/workoutStudio/auth';
import { useTheme } from '@/theme';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import {
	Platform,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useState } from 'react';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingSettings'>;

const TrainingSettings = ({ navigation }: Props) => {
	const { colors } = useTheme();
	const [unitKg, setUnitKg] = useState(true);
	const [restSound, setRestSound] = useState<'off' | 'chime' | 'vibrate'>(
		'off',
	);

	const disconnect = () => {
		clearWSSession();
		navigation.replace('TrainingRoot');
	};

	return (
		<View style={[styles.container, { backgroundColor: '#F9FAFB' }]}>
			{/* Unit preference */}
			<View style={[styles.row, { backgroundColor: '#FFFFFF' }]}>
				<Text style={[styles.label, { color: '#111827' }]}>
					Weight unit
				</Text>
				<View style={styles.unitToggle}>
					<Text
						style={[
							styles.unitLabel,
							{ color: unitKg ? '#3B82F6' : '#6B7280' },
						]}
					>
						kg
					</Text>
					<Switch
						value={!unitKg}
						onValueChange={v => setUnitKg(!v)}
						trackColor={{ true: '#3B82F6', false: '#6B7280' }}
					/>
					<Text
						style={[
							styles.unitLabel,
							{ color: !unitKg ? '#3B82F6' : '#6B7280' },
						]}
					>
						lb
					</Text>
				</View>
			</View>

			{/* Rest timer sound */}
			<View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
				<Text style={[styles.sectionTitle, { color: '#6B7280' }]}>
					Rest timer sound
				</Text>
				{(['off', 'chime', 'vibrate'] as const).map(opt => (
					<TouchableOpacity
						key={opt}
						style={styles.optRow}
						onPress={() => setRestSound(opt)}
					>
						<Ionicons
							name={
								restSound === opt
									? 'radiobox-marked'
									: 'radiobox-blank'
							}
							size={20}
							color={restSound === opt ? '#3B82F6' : '#6B7280'}
						/>
						<Text style={[styles.optLabel, { color: '#111827' }]}>
							{opt.charAt(0).toUpperCase() + opt.slice(1)}
						</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* Wellness consent */}
			<TouchableOpacity
				style={[styles.row, { backgroundColor: '#FFFFFF' }]}
				onPress={() => navigation.navigate('TrainingWellness')}
			>
				<Text style={[styles.label, { color: '#111827' }]}>
					Wellness consent
				</Text>
				<Ionicons name="chevron-right" size={20} color="#6B7280" />
			</TouchableOpacity>

			{/* Apple Health — iOS only */}
			{Platform.OS === 'ios' ? (
				<TouchableOpacity
					style={[styles.row, { backgroundColor: '#FFFFFF' }]}
					onPress={() => navigation.navigate('TrainingAppleHealth')}
				>
					<Text style={[styles.label, { color: '#111827' }]}>
						Apple Health
					</Text>
					<Ionicons name="chevron-right" size={20} color="#6B7280" />
				</TouchableOpacity>
			) : null}

			{/* Disconnect */}
			<TouchableOpacity
				style={[styles.row, { backgroundColor: '#FFFFFF' }]}
				onPress={disconnect}
			>
				<Text style={[styles.label, { color: colors.danger }]}>
					Disconnect Training account
				</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, padding: 16, gap: 12 },
	row: {
		borderRadius: 12,
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	label: { fontSize: 16 },
	unitToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	unitLabel: { fontSize: 15, fontWeight: '600' },
	section: { borderRadius: 12, padding: 16, gap: 12 },
	sectionTitle: {
		fontSize: 13,
		textTransform: 'uppercase',
		letterSpacing: 0.5,
	},
	optRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	optLabel: { fontSize: 15 },
});

export default TrainingSettings;
