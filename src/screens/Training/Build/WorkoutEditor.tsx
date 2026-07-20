import { wsApi } from '@/services/workoutStudio/api';
/* eslint-disable no-await-in-loop, no-continue, no-restricted-syntax */
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingBuildEditor'>;

const makeId = () =>
	Math.random().toString(36).slice(2) + Date.now().toString(36);

type ExerciseRow = {
	tempId: string;
	movementId: string;
	movementName: string;
	sets: string;
	reps: string;
	weight: string;
	rest: string;
};

type SectionRow = {
	tempId: string;
	name: string;
	exercises: ExerciseRow[];
};

const WorkoutEditor = ({ navigation }: Props) => {
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;

	const [workoutName, setWorkoutName] = useState('');
	const [duration, setDuration] = useState('');
	const [sections, setSections] = useState<SectionRow[]>([
		{ tempId: makeId(), name: 'Main', exercises: [] },
	]);
	const [searchTarget, setSearchTarget] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<
		{ id: string; name: string }[]
	>([]);
	const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const onSearchChange = (q: string) => {
		setSearchQuery(q);
		if (searchTimer.current) clearTimeout(searchTimer.current);
		if (q.length < 2) {
			setSearchResults([]);
			return;
		}
		searchTimer.current = setTimeout(() => {
			void wsApi()
				.get('movements', {
					searchParams: {
						select: 'id,name',
						name: `ilike.*${q}*`,
						limit: '12',
					},
				})
				.json<{ id: string; name: string }[]>()
				.then(setSearchResults)
				.catch(() => {});
		}, 300);
	};

	const addSection = () =>
		setSections(prev => [
			...prev,
			{
				tempId: makeId(),
				name: `Section ${prev.length + 1}`,
				exercises: [],
			},
		]);

	const removeSection = (id: string) =>
		setSections(prev => prev.filter(s => s.tempId !== id));

	const updateSectionName = (id: string, name: string) =>
		setSections(prev =>
			prev.map(s => (s.tempId === id ? { ...s, name } : s)),
		);

	const pickMovement = (m: { id: string; name: string }) => {
		if (!searchTarget) return;
		setSections(prev =>
			prev.map(s =>
				s.tempId === searchTarget
					? {
							...s,
							exercises: [
								...s.exercises,
								{
									tempId: makeId(),
									movementId: m.id,
									movementName: m.name,
									sets: '3',
									reps: '10',
									weight: '',
									rest: '90',
								},
							],
						}
					: s,
			),
		);
		setSearchTarget(null);
		setSearchQuery('');
		setSearchResults([]);
	};

	const removeExercise = (secId: string, exId: string) =>
		setSections(prev =>
			prev.map(s =>
				s.tempId === secId
					? {
							...s,
							exercises: s.exercises.filter(
								e => e.tempId !== exId,
							),
						}
					: s,
			),
		);

	const updateExercise = (
		secId: string,
		exId: string,
		field: 'sets' | 'reps' | 'weight' | 'rest',
		value: string,
	) =>
		setSections(prev =>
			prev.map(s =>
				s.tempId === secId
					? {
							...s,
							exercises: s.exercises.map(e =>
								e.tempId === exId
									? { ...e, [field]: value }
									: e,
							),
						}
					: s,
			),
		);

	const save = useMutation({
		mutationFn: async () => {
			if (!workoutName.trim()) throw new Error('Enter a workout name.');
			const durationNumber = duration ? Number(duration) : null;
			if (
				durationNumber != null &&
				(!Number.isInteger(durationNumber) ||
					durationNumber < 1 ||
					durationNumber > 600)
			)
				throw new Error('Duration must be between 1 and 600 minutes.');
			if (!sections.some(section => section.exercises.length > 0))
				throw new Error('Add at least one exercise.');
			for (const section of sections) {
				if (!section.name.trim())
					throw new Error('Every section needs a name.');
				for (const exercise of section.exercises) {
					const sets = Number(exercise.sets);
					const reps = Number(exercise.reps);
					const weight = exercise.weight
						? Number(exercise.weight)
						: null;
					const rest = exercise.rest ? Number(exercise.rest) : null;
					if (!Number.isInteger(sets) || sets < 1 || sets > 100)
						throw new Error(
							`${exercise.movementName}: sets must be between 1 and 100.`,
						);
					if (!Number.isInteger(reps) || reps < 1 || reps > 1000)
						throw new Error(
							`${exercise.movementName}: reps must be between 1 and 1000.`,
						);
					if (
						weight != null &&
						(!Number.isFinite(weight) || weight < 0)
					)
						throw new Error(
							`${exercise.movementName}: enter a valid weight.`,
						);
					if (
						rest != null &&
						(!Number.isInteger(rest) || rest < 0 || rest > 3600)
					)
						throw new Error(
							`${exercise.movementName}: rest must be between 0 and 3600 seconds.`,
						);
				}
			}

			const [workout] = await wsApi()
				.post('workouts', {
					json: {
						name: workoutName.trim(),
						est_duration_min: durationNumber,
						estimated_duration_minutes: durationNumber,
						type: 'custom',
						created_by: uid,
						tenant_id: tenantId,
						visibility: 'personal',
					},
					headers: { Prefer: 'return=representation' },
				})
				.json<{ id: string }[]>();

			if (!workout) throw new Error('Failed to create workout');

			for (let i = 0; i < sections.length; i++) {
				const sec = sections[i];
				if (!sec) continue;

				const [wsec] = await wsApi()
					.post('workout_sections', {
						json: {
							workout_id: workout.id,
							name: sec.name,
							order_index: i,
						},
						headers: { Prefer: 'return=representation' },
					})
					.json<{ id: string }[]>();

				if (!wsec || sec.exercises.length === 0) continue;

				const [block] = await wsApi()
					.post('section_blocks', {
						json: {
							section_id: wsec.id,
							block_type: 'straight_sets',
							order_index: 0,
						},
						headers: { Prefer: 'return=representation' },
					})
					.json<{ id: string }[]>();

				if (!block) continue;

				for (let j = 0; j < sec.exercises.length; j++) {
					const ex = sec.exercises[j];
					if (!ex) continue;
					await wsApi().post('block_movements', {
						json: {
							block_id: block.id,
							movement_id: ex.movementId,
							order_index: j,
							prescribed_sets: ex.sets
								? parseInt(ex.sets, 10)
								: null,
							prescribed_reps: ex.reps
								? parseInt(ex.reps, 10)
								: null,
							prescribed_weight: ex.weight
								? parseFloat(ex.weight)
								: null,
							rest_seconds: ex.rest
								? parseInt(ex.rest, 10)
								: null,
						},
						headers: { Prefer: 'return=minimal' },
					});
				}
			}

			return { id: workout.id, name: workoutName.trim() };
		},
		onSuccess: ({ id, name }) => {
			Alert.alert('Saved!', `"${name}" is ready.`, [
				{
					text: 'Run it now',
					onPress: () =>
						navigation.replace('TrainingRunWorkout', {
							workoutId: id,
							workoutName: name,
						}),
				},
				{ text: 'Back to library', onPress: () => navigation.goBack() },
			]);
		},
		onError: (err: unknown) => {
			Alert.alert(
				'Workout not saved',
				err instanceof Error
					? err.message
					: 'Check your connection and try again.',
			);
		},
	});

	return (
		<SafeAreaView style={styles.screen} edges={['top']}>
			<View style={styles.pageHeader}>
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
				<View style={styles.pageHeaderCopy}>
					<Text style={styles.pageTitle}>Build workout</Text>
					<Text style={styles.pageSubtitle}>
						Create a session you can repeat anytime.
					</Text>
				</View>
			</View>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.label}>Workout name *</Text>
				<TextInput
					style={styles.input}
					value={workoutName}
					onChangeText={setWorkoutName}
					placeholder="e.g. Morning strength"
					placeholderTextColor={trainingTheme.colors.textMuted}
				/>

				<Text style={styles.label}>Est. duration (min)</Text>
				<TextInput
					style={[styles.input, { width: 100 }]}
					value={duration}
					onChangeText={setDuration}
					keyboardType="numeric"
					placeholder="45"
					placeholderTextColor={trainingTheme.colors.textMuted}
				/>

				{sections.map((sec, si) => (
					<View key={sec.tempId} style={styles.sectionCard}>
						<View style={styles.sectionHeader}>
							<TextInput
								style={styles.sectionNameInput}
								value={sec.name}
								onChangeText={n =>
									updateSectionName(sec.tempId, n)
								}
								placeholder="Section name"
								placeholderTextColor={
									trainingTheme.colors.textMuted
								}
							/>
							{sections.length > 1 && (
								<TouchableOpacity
									onPress={() => removeSection(sec.tempId)}
								>
									<Ionicons
										name="close-circle"
										size={22}
										color={trainingTheme.colors.danger}
									/>
								</TouchableOpacity>
							)}
						</View>

						{sec.exercises.map(ex => (
							<View key={ex.tempId} style={styles.exRow}>
								<View style={{ flex: 1 }}>
									<Text style={styles.exName}>
										{ex.movementName}
									</Text>
									<View style={styles.exFields}>
										<TextInput
											style={styles.fieldInput}
											value={ex.sets}
											onChangeText={v =>
												updateExercise(
													sec.tempId,
													ex.tempId,
													'sets',
													v,
												)
											}
											keyboardType="numeric"
											placeholder="Sets"
											placeholderTextColor={
												trainingTheme.colors.textMuted
											}
										/>
										<Text style={styles.sep}>×</Text>
										<TextInput
											style={styles.fieldInput}
											value={ex.reps}
											onChangeText={v =>
												updateExercise(
													sec.tempId,
													ex.tempId,
													'reps',
													v,
												)
											}
											keyboardType="numeric"
											placeholder="Reps"
											placeholderTextColor={
												trainingTheme.colors.textMuted
											}
										/>
										<TextInput
											style={[
												styles.fieldInput,
												{ width: 60 },
											]}
											value={ex.weight}
											onChangeText={v =>
												updateExercise(
													sec.tempId,
													ex.tempId,
													'weight',
													v,
												)
											}
											keyboardType="numeric"
											placeholder="kg"
											placeholderTextColor={
												trainingTheme.colors.textMuted
											}
										/>
									</View>
								</View>
								<TouchableOpacity
									onPress={() =>
										removeExercise(sec.tempId, ex.tempId)
									}
								>
									<Ionicons
										name="close"
										size={18}
										color={trainingTheme.colors.danger}
									/>
								</TouchableOpacity>
							</View>
						))}

						{searchTarget === sec.tempId ? (
							<View style={styles.searchBox}>
								<TextInput
									style={styles.searchInput}
									value={searchQuery}
									onChangeText={onSearchChange}
									placeholder="Search movements…"
									placeholderTextColor={
										trainingTheme.colors.textMuted
									}
									autoFocus
								/>
								{searchResults.map(m => (
									<TouchableOpacity
										key={m.id}
										style={styles.searchResult}
										onPress={() => pickMovement(m)}
									>
										<Text style={styles.searchResultText}>
											{m.name}
										</Text>
									</TouchableOpacity>
								))}
								<TouchableOpacity
									onPress={() => {
										setSearchTarget(null);
										setSearchQuery('');
										setSearchResults([]);
									}}
								>
									<Text style={styles.cancelText}>
										Cancel
									</Text>
								</TouchableOpacity>
							</View>
						) : (
							<TouchableOpacity
								style={styles.addExBtn}
								onPress={() => setSearchTarget(sec.tempId)}
							>
								<Ionicons
									name="plus"
									size={16}
									color={trainingTheme.colors.primary}
								/>
								<Text style={styles.addExText}>
									Add exercise
								</Text>
							</TouchableOpacity>
						)}

						<Text style={styles.sectionIndex}>
							Section {si + 1}
						</Text>
					</View>
				))}

				<TouchableOpacity
					style={styles.addSectionBtn}
					onPress={addSection}
				>
					<Ionicons
						name="plus-circle-outline"
						size={18}
						color={trainingTheme.colors.primary}
					/>
					<Text style={styles.addSectionText}>Add section</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.saveBtn}
					onPress={() => save.mutate()}
					disabled={save.isPending}
					accessibilityRole="button"
				>
					<Text style={styles.saveBtnText}>
						{save.isPending ? 'Saving…' : 'Save workout'}
					</Text>
				</TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	scroll: { flex: 1, backgroundColor: trainingTheme.colors.background },
	pageHeader: {
		minHeight: 92,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		gap: 12,
	},
	backButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
	},
	pageHeaderCopy: { flex: 1 },
	pageTitle: {
		color: trainingTheme.colors.text,
		fontSize: 26,
		fontWeight: '700',
	},
	pageSubtitle: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		marginTop: 3,
	},
	container: { padding: 16, paddingBottom: 60, gap: 14 },
	label: {
		fontSize: 13,
		fontWeight: '700',
		color: trainingTheme.colors.textMuted,
		marginBottom: -4,
	},
	input: {
		minHeight: 52,
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: 16,
		paddingHorizontal: 14,
		fontSize: 15,
		color: trainingTheme.colors.text,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	sectionCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: 22,
		padding: 16,
		gap: 12,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		...trainingTheme.shadow,
	},
	sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	sectionNameInput: {
		flex: 1,
		fontSize: 18,
		fontWeight: '700',
		color: trainingTheme.colors.text,
		borderBottomWidth: 1,
		borderBottomColor: trainingTheme.colors.border,
		paddingBottom: 8,
	},
	sectionIndex: {
		fontSize: 11,
		color: trainingTheme.colors.primary,
		fontWeight: '700',
		textAlign: 'right',
	},
	exRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
	exName: {
		fontSize: 14,
		fontWeight: '700',
		color: trainingTheme.colors.text,
		marginBottom: 4,
	},
	exFields: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	fieldInput: {
		width: 52,
		minHeight: 40,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		borderRadius: 12,
		paddingHorizontal: 6,
		paddingVertical: 4,
		fontSize: 14,
		color: trainingTheme.colors.text,
		textAlign: 'center',
	},
	sep: { fontSize: 14, color: trainingTheme.colors.textMuted },
	searchBox: {
		backgroundColor: trainingTheme.colors.background,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		overflow: 'hidden',
	},
	searchInput: {
		padding: 12,
		fontSize: 15,
		color: trainingTheme.colors.text,
		borderBottomWidth: 1,
		borderBottomColor: trainingTheme.colors.border,
	},
	searchResult: {
		padding: 12,
		borderBottomWidth: 1,
		borderBottomColor: trainingTheme.colors.border,
	},
	searchResultText: { fontSize: 15, color: trainingTheme.colors.text },
	cancelText: {
		padding: 10,
		color: trainingTheme.colors.textMuted,
		textAlign: 'center',
		fontSize: 14,
	},
	addExBtn: {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		borderRadius: 14,
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	addExText: {
		color: trainingTheme.colors.primary,
		fontSize: 14,
		fontWeight: '700',
	},
	addSectionBtn: {
		minHeight: 52,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: trainingTheme.colors.primary,
	},
	addSectionText: {
		color: trainingTheme.colors.primary,
		fontSize: 15,
		fontWeight: '700',
	},
	saveBtn: {
		minHeight: 56,
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primary,
		borderRadius: 16,
		alignItems: 'center',
		marginTop: 8,
	},
	saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default WorkoutEditor;
