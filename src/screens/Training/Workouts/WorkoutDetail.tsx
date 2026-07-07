import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import { useWorkoutDetail } from '@/screens/Training/hooks/useWorkoutDetail';
import type { ScalingLevel } from '@/services/workoutStudio/types';
import { mmkvStorage } from '@/storage';
import { useTheme } from '@/theme';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

const SCALING_LEVEL_KEY = 'ws:last-scaling-level';

const LEVELS: { key: ScalingLevel; label: string }[] = [
	{ key: 'rx', label: 'Rx' },
	{ key: 'scaled', label: 'Scaled' },
	{ key: 'foundations', label: 'Foundations' },
];

type Props = StackScreenProps<TrainingStackParamList, 'TrainingWorkoutDetail'>;

type WorkoutShell = {
	id: string;
	name: string;
	type: string | null;
	estimated_duration_minutes: number | null;
};

const WorkoutDetailScreen = ({ route, navigation }: Props) => {
	const { colors } = useTheme();
	const { workoutId, assignmentId, programContext } = route.params;
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;

	const [scalingLevel, setScalingLevel] = useState<ScalingLevel>(() => {
		const stored = mmkvStorage.getString(SCALING_LEVEL_KEY);
		return stored === 'scaled' || stored === 'foundations' ? stored : 'rx';
	});
	const [notes, setNotes] = useState('');
	const [timeMin, setTimeMin] = useState('');
	const [timeSec, setTimeSec] = useState('');
	const [rounds, setRounds] = useState('');
	const [partialReps, setPartialReps] = useState('');
	const [weightKg, setWeightKg] = useState('');
	const [reps, setReps] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const { data: workout, isLoading } = useQuery({
		queryKey: ['ws-workout-shell', workoutId],
		queryFn: () =>
			wsApi()
				.get('workouts', {
					searchParams: {
						select: 'id,name,type,estimated_duration_minutes',
						id: `eq.${workoutId}`,
					},
				})
				.json<WorkoutShell[]>()
				.then(r => r[0]),
		staleTime: 300_000,
	});

	const { data: detail } = useWorkoutDetail(workoutId);

	const selectScalingLevel = (level: ScalingLevel) => {
		setScalingLevel(level);
		mmkvStorage.set(SCALING_LEVEL_KEY, level);
	};

	const scalingNotes = useMemo(() => {
		if (scalingLevel === 'rx' || !detail) return [];
		const result: { id: string; label: string | null; note: string }[] = [];
		detail.workout_sections.forEach(s => {
			s.section_blocks.forEach(b => {
				const note =
					scalingLevel === 'scaled'
						? b.scaled_notes
						: b.foundations_notes;
				if (note) {
					result.push({ id: b.id, label: b.label, note });
				}
			});
		});
		return result;
	}, [detail, scalingLevel]);

	const wType = workout?.type ?? 'custom';
	const isForTime = ['for_time', 'chipper', 'emom'].includes(wType);
	const isAmrap = wType === 'amrap';
	const isStrength = wType === 'strength';
	const isCustom = wType === 'custom';

	const submit = async () => {
		if (!uid || !tenantId || !workout) return;
		setSubmitting(true);
		try {
			const scoreTimeSeconds =
				(isForTime || isCustom) && (timeMin || timeSec)
					? parseInt(timeMin || '0', 10) * 60 +
						parseInt(timeSec || '0', 10)
					: null;

			await wsApi().post('workout_results', {
				json: {
					workout_id: workoutId,
					assignment_id: assignmentId ?? null,
					athlete_id: uid,
					tenant_id: tenantId,
					completed_at: new Date().toISOString(),
					is_rx: scalingLevel === 'rx',
					scaling_level: scalingLevel,
					notes: notes.trim() || null,
					score_time_seconds: scoreTimeSeconds,
					score_rounds:
						(isAmrap || isCustom) && rounds
							? parseInt(rounds, 10)
							: null,
					score_partial_reps:
						(isAmrap || isCustom) && partialReps
							? parseInt(partialReps, 10)
							: null,
					score_weight_kg:
						(isStrength || isCustom) && weightKg
							? parseFloat(weightKg)
							: null,
					score_reps:
						(isStrength || isCustom) && reps
							? parseInt(reps, 10)
							: null,
				},
				headers: { Prefer: 'return=minimal' },
			});

			Alert.alert('Result logged.', '', [
				{
					text: 'OK',
					onPress: () => navigation.navigate('TrainingToday'),
				},
			]);
		} catch {
			Alert.alert('Error', 'Could not save result. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<View style={[styles.center, { backgroundColor: '#F9FAFB' }]}>
				<ActivityIndicator color={colors.brand} />
			</View>
		);
	}

	if (!workout) {
		return (
			<View style={[styles.center, { backgroundColor: '#F9FAFB' }]}>
				<Text style={{ color: '#6B7280' }}>Workout not found</Text>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={[styles.title, { color: '#111827' }]}>
					{workout.name}
				</Text>
				{workout.estimated_duration_minutes && (
					<Text style={[styles.meta, { color: '#6B7280' }]}>
						~{workout.estimated_duration_minutes} min
					</Text>
				)}
				{programContext ? (
					<View style={styles.programStrip}>
						<Text
							style={[
								styles.programStripText,
								{ color: '#6B7280' },
							]}
						>
							{programContext.programName} &middot; Day{' '}
							{programContext.dayNumber}
							{programContext.totalDays
								? ` of ${programContext.totalDays}`
								: ''}
						</Text>
						{programContext.totalDays ? (
							<View
								style={[
									styles.progressTrack,
									{ backgroundColor: '#E5E7EB' },
								]}
							>
								<View
									style={[
										styles.progressFill,
										{
											backgroundColor: '#3B82F6',
											width: `${Math.min((programContext.dayNumber / programContext.totalDays) * 100, 100)}%`,
										},
									]}
								/>
							</View>
						) : null}
					</View>
				) : null}

				{detail?.workout_sections &&
					detail.workout_sections.length > 0 && (
						<View style={styles.sectionsCard}>
							{detail.workout_sections.map(s => (
								<View key={s.id} style={styles.sectionRow}>
									<Text
										style={[
											styles.sectionName,
											{ color: '#374151' },
										]}
									>
										{s.name}
									</Text>
									{s.section_blocks?.map(b => (
										<View
											key={b.id}
											style={styles.blockRow}
										>
											{b.label ? (
												<Text
													style={[
														styles.blockLabel,
														{ color: '#6B7280' },
													]}
												>
													{b.label}
												</Text>
											) : null}
											{b.block_movements?.map(bm => {
												const parts: string[] = [];
												if (bm.sets)
													parts.push(
														`${bm.sets} sets`,
													);
												if (bm.reps_scheme)
													parts.push(bm.reps_scheme);
												if (bm.weight_kg)
													parts.push(
														`@ ${bm.weight_kg}kg`,
													);
												return (
													<Text
														key={bm.id}
														style={[
															styles.movementText,
															{
																color: '#111827',
															},
														]}
													>
														{bm.movements.name}
														{parts.length > 0
															? `  ${parts.join(' · ')}`
															: ''}
													</Text>
												);
											})}
										</View>
									))}
								</View>
							))}
						</View>
					)}

				<View style={[styles.formCard, { backgroundColor: '#FFFFFF' }]}>
					<Text style={[styles.formTitle, { color: '#111827' }]}>
						Log result
					</Text>

					{(isForTime || isCustom) && (
						<View style={styles.fieldGroup}>
							<Text style={[styles.label, { color: '#6B7280' }]}>
								Time
							</Text>
							<View style={styles.timeRow}>
								<TextInput
									style={[
										styles.timeInput,
										{
											borderColor: '#D1D5DB',
											color: '#111827',
										},
									]}
									keyboardType="number-pad"
									placeholder="mm"
									placeholderTextColor="#9CA3AF"
									value={timeMin}
									onChangeText={setTimeMin}
									maxLength={2}
								/>
								<Text
									style={[
										styles.timeSep,
										{ color: '#6B7280' },
									]}
								>
									:
								</Text>
								<TextInput
									style={[
										styles.timeInput,
										{
											borderColor: '#D1D5DB',
											color: '#111827',
										},
									]}
									keyboardType="number-pad"
									placeholder="ss"
									placeholderTextColor="#9CA3AF"
									value={timeSec}
									onChangeText={setTimeSec}
									maxLength={2}
								/>
							</View>
						</View>
					)}

					{(isAmrap || isCustom) && (
						<View style={styles.fieldGroup}>
							<Text style={[styles.label, { color: '#6B7280' }]}>
								Rounds
							</Text>
							<TextInput
								style={[
									styles.input,
									{
										borderColor: '#D1D5DB',
										color: '#111827',
									},
								]}
								keyboardType="number-pad"
								placeholder="0"
								placeholderTextColor="#9CA3AF"
								value={rounds}
								onChangeText={setRounds}
							/>
							<Text
								style={[
									styles.label,
									{ color: '#6B7280', marginTop: 12 },
								]}
							>
								Partial reps
							</Text>
							<TextInput
								style={[
									styles.input,
									{
										borderColor: '#D1D5DB',
										color: '#111827',
									},
								]}
								keyboardType="number-pad"
								placeholder="0"
								placeholderTextColor="#9CA3AF"
								value={partialReps}
								onChangeText={setPartialReps}
							/>
						</View>
					)}

					{(isStrength || isCustom) && (
						<View style={styles.fieldGroup}>
							<Text style={[styles.label, { color: '#6B7280' }]}>
								Weight (kg)
							</Text>
							<TextInput
								style={[
									styles.input,
									{
										borderColor: '#D1D5DB',
										color: '#111827',
									},
								]}
								keyboardType="decimal-pad"
								placeholder="0"
								placeholderTextColor="#9CA3AF"
								value={weightKg}
								onChangeText={setWeightKg}
							/>
							<Text
								style={[
									styles.label,
									{ color: '#6B7280', marginTop: 12 },
								]}
							>
								Reps
							</Text>
							<TextInput
								style={[
									styles.input,
									{
										borderColor: '#D1D5DB',
										color: '#111827',
									},
								]}
								keyboardType="number-pad"
								placeholder="0"
								placeholderTextColor="#9CA3AF"
								value={reps}
								onChangeText={setReps}
							/>
						</View>
					)}

					<View style={styles.fieldGroup}>
						<Text style={[styles.label, { color: '#6B7280' }]}>
							Scaling
						</Text>
						<View style={styles.segmentRow}>
							{LEVELS.map(({ key, label }) => (
								<TouchableOpacity
									key={key}
									style={[
										styles.segmentBtn,
										scalingLevel === key &&
											styles.segmentBtnActive,
									]}
									onPress={() => selectScalingLevel(key)}
								>
									<Text
										style={[
											styles.segmentText,
											scalingLevel === key &&
												styles.segmentTextActive,
										]}
									>
										{label}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
					{scalingNotes.length > 0 && (
						<View style={styles.fieldGroup}>
							{scalingNotes.map(({ id, label, note }) => (
								<View key={id} style={styles.scalingNoteCard}>
									{label ? (
										<Text
											style={[
												styles.blockLabel,
												{ color: '#6B7280' },
											]}
										>
											{label}
										</Text>
									) : null}
									<Text
										style={[
											styles.scalingNoteText,
											{ color: '#374151' },
										]}
									>
										{note}
									</Text>
								</View>
							))}
						</View>
					)}

					<View style={styles.fieldGroup}>
						<Text style={[styles.label, { color: '#6B7280' }]}>
							Notes
						</Text>
						<TextInput
							style={[
								styles.notesInput,
								{ borderColor: '#D1D5DB', color: '#111827' },
							]}
							placeholder="How did it feel?"
							placeholderTextColor="#9CA3AF"
							multiline
							numberOfLines={3}
							value={notes}
							onChangeText={setNotes}
						/>
					</View>
				</View>
			</ScrollView>

			<View style={[styles.footer, { backgroundColor: '#F9FAFB' }]}>
				<TouchableOpacity
					style={[
						styles.submitBtn,
						{ backgroundColor: '#3B82F6' },
						submitting && { opacity: 0.6 },
					]}
					onPress={() => void submit()}
					disabled={submitting}
				>
					{submitting ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.submitBtnText}>Log result</Text>
					)}
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	container: { padding: 16, paddingBottom: 100 },
	title: { fontSize: 22, fontWeight: '700' },
	meta: { fontSize: 13, marginTop: 4, marginBottom: 8 },
	programStrip: { marginBottom: 12 },
	programStripText: { fontSize: 12, marginBottom: 6 },
	progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
	progressFill: { height: 4, borderRadius: 2 },
	sectionsCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 14,
		marginBottom: 16,
	},
	sectionRow: { marginBottom: 12 },
	sectionName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
	sectionMeta: { fontSize: 12, marginTop: 2 },
	blockRow: { marginTop: 4, paddingLeft: 8 },
	blockLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
	movementText: { fontSize: 13, paddingVertical: 1 },
	formCard: {
		borderRadius: 12,
		padding: 16,
	},
	formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
	fieldGroup: { marginBottom: 8 },
	label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
	input: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
	},
	timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	timeInput: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 20,
		fontWeight: '600',
		width: 72,
		textAlign: 'center',
	},
	timeSep: { fontSize: 24, fontWeight: '700' },
	segmentRow: {
		flexDirection: 'row',
		gap: 8,
	},
	segmentBtn: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#D1D5DB',
		borderRadius: 8,
		paddingVertical: 10,
		alignItems: 'center',
	},
	segmentBtnActive: {
		backgroundColor: '#3B82F6',
		borderColor: '#3B82F6',
	},
	segmentText: {
		fontSize: 14,
		fontWeight: '500',
		color: '#374151',
	},
	segmentTextActive: {
		color: '#FFFFFF',
	},
	scalingNoteCard: {
		backgroundColor: '#F3F4F6',
		borderRadius: 8,
		padding: 10,
		marginBottom: 6,
	},
	scalingNoteText: {
		fontSize: 13,
	},
	notesInput: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 15,
		minHeight: 80,
		textAlignVertical: 'top',
	},
	footer: { padding: 16, paddingBottom: 32 },
	submitBtn: {
		padding: 16,
		borderRadius: 12,
		alignItems: 'center',
	},
	submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default WorkoutDetailScreen;
