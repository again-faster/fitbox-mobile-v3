/* eslint-disable no-nested-ternary */
import { useMemo, useState } from 'react';
import {
	FlatList,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import { wsApi } from '@/services/workoutStudio/api';
import type { ScalingLevel } from '@/services/workoutStudio/types';
import { useScalingPreference } from '@/screens/Training/hooks/useScalingPreference';
import { MovementSheet } from '@/screens/Training/components/MovementSheet';
import TrainingCard from '@/screens/Training/components/TrainingCard';
import SkeletonCard from '@/screens/Training/components/SkeletonCard';
import TrainingState from '@/screens/Training/components/TrainingState';
import { trainingTheme } from '@/theme/training';
import type { StackScreenProps } from '@react-navigation/stack';
import type { TrainingStackParamList } from '@/types/navigation';

type Movement = { id: string; name: string };
const LEVELS: Array<{ key: ScalingLevel; label: string; description: string }> =
	[
		{
			key: 'rx',
			label: 'Rx',
			description: 'Use the prescribed workout as written.',
		},
		{
			key: 'scaled',
			label: 'Scaled',
			description: 'Adjust load or volume while keeping the intent.',
		},
		{
			key: 'foundations',
			label: 'Foundations',
			description: 'Prioritise technique and accessible progressions.',
		},
	];

type Props = StackScreenProps<TrainingStackParamList, 'TrainingProfile'>;

const TrainingProfile = ({ navigation }: Props) => {
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const scaling = useScalingPreference(uid, tenantId);
	const [pickerOpen, setPickerOpen] = useState(false);
	const [search, setSearch] = useState('');
	const [movement, setMovement] = useState<Movement | null>(null);
	const movements = useQuery({
		queryKey: ['ws-profile-movements', tenantId],
		enabled: !!tenantId,
		staleTime: 600_000,
		queryFn: () =>
			wsApi()
				.get('movements', {
					searchParams: {
						select: 'id,name',
						order: 'name.asc',
						limit: '250',
					},
				})
				.json<Movement[]>(),
	});
	const filtered = useMemo(() => {
		const needle = search.trim().toLowerCase();
		return needle
			? (movements.data ?? []).filter(item =>
					item.name.toLowerCase().includes(needle),
				)
			: (movements.data ?? []);
	}, [movements.data, search]);

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
		>
			<View>
				<Text style={styles.title}>My Training Profile</Text>
				<Text style={styles.subtitle}>
					Your scaling level and rep maxes help Workout Studio suggest
					more useful prescriptions.
				</Text>
			</View>
			<Text style={styles.sectionTitle}>Scaling level</Text>
			{scaling.isLoading ? (
				<SkeletonCard />
			) : scaling.isError ? (
				<TrainingCard>
					<TrainingState
						kind="error"
						title="Scaling level couldn't load"
						message="Check your connection and try again."
						actionLabel="Try again"
						onAction={() => void scaling.refetch()}
					/>
				</TrainingCard>
			) : (
				<View style={styles.levelList}>
					{LEVELS.map(level => {
						const selected = scaling.preferredLevel === level.key;
						return (
							<TouchableOpacity
								key={level.key}
								accessibilityRole="radio"
								accessibilityState={{ selected }}
								disabled={scaling.isSavingPreference}
								onPress={() =>
									void scaling.savePreference(level.key)
								}
								style={[
									styles.levelCard,
									selected && styles.levelCardSelected,
								]}
							>
								<Ionicons
									name={
										selected
											? 'radiobox-marked'
											: 'radiobox-blank'
									}
									size={22}
									color={
										selected
											? trainingTheme.colors.primary
											: trainingTheme.colors.textMuted
									}
								/>
								<View style={styles.levelCopy}>
									<Text style={styles.levelTitle}>
										{level.label}
									</Text>
									<Text style={styles.levelDescription}>
										{level.description}
									</Text>
								</View>
							</TouchableOpacity>
						);
					})}
				</View>
			)}
			<Text style={styles.sectionTitle}>Rep max ladder</Text>
			<TrainingCard>
				<Text style={styles.cardTitle}>Log a max</Text>
				<Text style={styles.cardDescription}>
					Choose a movement and record a 1RM, 3RM or 5RM. Your best
					values are used for suggested weights.
				</Text>
				<TouchableOpacity
					accessibilityRole="button"
					style={styles.movementButton}
					onPress={() => setPickerOpen(true)}
				>
					<Ionicons
						name="magnify"
						size={19}
						color={trainingTheme.colors.primary}
					/>
					<Text style={styles.movementButtonLabel}>
						Choose movement
					</Text>
					<Ionicons
						name="chevron-right"
						size={20}
						color={trainingTheme.colors.textMuted}
					/>
				</TouchableOpacity>
				<TouchableOpacity
					accessibilityRole="button"
					style={styles.movementButton}
					onPress={() => navigation.navigate('TrainingMaxes')}
				>
					<Ionicons
						name="chart-line"
						size={19}
						color={trainingTheme.colors.primary}
					/>
					<Text style={styles.movementButtonLabel}>
						View and manage maxes
					</Text>
					<Ionicons
						name="chevron-right"
						size={20}
						color={trainingTheme.colors.textMuted}
					/>
				</TouchableOpacity>
			</TrainingCard>
			<Modal
				visible={pickerOpen}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => setPickerOpen(false)}
			>
				<View style={styles.pickerScreen}>
					<View style={styles.pickerHeader}>
						<Text style={styles.pickerTitle}>Choose movement</Text>
						<TouchableOpacity
							accessibilityRole="button"
							onPress={() => setPickerOpen(false)}
							style={styles.closeButton}
						>
							<Text style={styles.closeLabel}>Close</Text>
						</TouchableOpacity>
					</View>
					<TextInput
						style={styles.searchInput}
						value={search}
						onChangeText={setSearch}
						placeholder="Search movements"
						placeholderTextColor={trainingTheme.colors.textMuted}
					/>
					<FlatList
						data={filtered}
						keyExtractor={item => item.id}
						keyboardShouldPersistTaps="handled"
						renderItem={({ item }) => (
							<TouchableOpacity
								accessibilityRole="button"
								style={styles.movementRow}
								onPress={() => {
									setMovement(item);
									setPickerOpen(false);
								}}
							>
								<Text style={styles.movementName}>
									{item.name}
								</Text>
								<Ionicons
									name="chevron-right"
									size={19}
									color={trainingTheme.colors.textMuted}
								/>
							</TouchableOpacity>
						)}
					/>
				</View>
			</Modal>
			<MovementSheet
				movementId={movement?.id ?? null}
				movementName={movement?.name ?? ''}
				uid={uid ?? null}
				onClose={() => setMovement(null)}
			/>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	container: { padding: 16, paddingBottom: 48, gap: 16 },
	title: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 26,
		fontWeight: '700',
	},
	subtitle: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		lineHeight: 21,
		marginTop: 5,
	},
	sectionTitle: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 17,
		fontWeight: '700',
		marginBottom: -6,
	},
	levelList: { gap: 8 },
	levelCard: {
		minHeight: 72,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 14,
		borderRadius: 16,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		backgroundColor: trainingTheme.colors.surface,
	},
	levelCardSelected: {
		borderColor: trainingTheme.colors.primary,
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	levelCopy: { flex: 1 },
	levelTitle: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 15,
		fontWeight: '700',
	},
	levelDescription: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 12,
		lineHeight: 17,
		marginTop: 2,
	},
	cardTitle: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 16,
		fontWeight: '700',
	},
	cardDescription: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 13,
		lineHeight: 19,
		marginTop: 4,
	},
	movementButton: {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 9,
		marginTop: 14,
	},
	movementButtonLabel: {
		flex: 1,
		color: trainingTheme.colors.primary,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		fontWeight: '700',
	},
	pickerScreen: {
		flex: 1,
		backgroundColor: trainingTheme.colors.background,
		padding: 16,
	},
	pickerHeader: {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	pickerTitle: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 20,
		fontWeight: '700',
	},
	closeButton: { minHeight: 44, justifyContent: 'center' },
	closeLabel: {
		color: trainingTheme.colors.primary,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		fontWeight: '700',
	},
	searchInput: {
		minHeight: 48,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: 10,
		backgroundColor: trainingTheme.colors.surface,
		color: trainingTheme.colors.text,
		paddingHorizontal: 13,
		fontSize: 15,
		marginVertical: 12,
	},
	movementRow: {
		minHeight: 52,
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomColor: trainingTheme.colors.border,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	movementName: {
		flex: 1,
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 15,
	},
});
export default TrainingProfile;
