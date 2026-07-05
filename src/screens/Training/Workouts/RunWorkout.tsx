import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type {
	BlockMovement,
	SectionBlock,
	WorkoutSection,
} from '@/services/workoutStudio/types';
import { useWorkoutDetail } from '@/screens/Training/hooks/useWorkoutDetail';
import { useTheme } from '@/theme';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import { useEffect, useRef, useState } from 'react';
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
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingRunWorkout'>;

type SetState = {
	reps: string;
	weight: string;
	rpe: number | null;
	notes: string;
	completed: boolean;
	idempotency_key: string;
};

type WorkoutState = Record<string, SetState[]>;

const DEFAULT_REST = 90;

const makeId = () =>
	Math.random().toString(36).slice(2) + Date.now().toString(36);

const RunWorkout = ({ route, navigation }: Props) => {
	const { colors } = useTheme();
	const { workoutId, assignmentId } = route.params;
	const session = getStoredWSSession();
	const uid = session?.user.id;

	const [workoutResultId, setWorkoutResultId] = useState<string | null>(null);
	const [setStates, setSetStates] = useState<WorkoutState>({});
	const [restTimer, setRestTimer] = useState<number | null>(null);
	const restInterval = useRef<ReturnType<typeof setInterval> | null>(null);
	const startedAt = useRef(Date.now());

	const { data: workout, isLoading } = useWorkoutDetail(workoutId);

	useEffect(() => {
		if (!uid || !workoutId || workoutResultId) return;
		wsApi()
			.post('workout_results', {
				json: {
					workout_id: workoutId,
					assignment_id: assignmentId ?? null,
					athlete_id: uid,
					started_at: new Date().toISOString(),
				},
				headers: { Prefer: 'return=representation' },
			})
			.json<{ id: string }[]>()
			.then(rows => {
				if (rows[0]) setWorkoutResultId(rows[0].id);
			})
			.catch(() => {});
	}, [uid, workoutId]);

	useEffect(() => {
		return () => {
			if (restInterval.current) clearInterval(restInterval.current);
		};
	}, []);

	const initSetStates = (sets: number): SetState[] =>
		Array.from({ length: sets }, () => ({
			reps: '',
			weight: '',
			rpe: null,
			notes: '',
			completed: false,
			idempotency_key: makeId(),
		}));

	const getSetStates = (bm: BlockMovement): SetState[] =>
		setStates[bm.id] ?? initSetStates(bm.sets ?? 3);

	const updateSet = (
		bmId: string,
		setIdx: number,
		field: keyof SetState,
		value: string | number | boolean | null,
	) => {
		setSetStates(prev => {
			const current = prev[bmId] ?? initSetStates(3);
			const updated = current.map((s, i) =>
				i === setIdx ? { ...s, [field]: value } : s,
			);
			return { ...prev, [bmId]: updated };
		});
	};

	const markDone = (bm: BlockMovement, setIdx: number) => {
		const s = getSetStates(bm)[setIdx];
		if (!s) return;

		updateSet(bm.id, setIdx, 'completed', true);
		if (workoutResultId) {
			void wsApi()
				.post('set_results', {
					json: {
						workout_result_id: workoutResultId,
						block_movement_id: bm.id,
						set_number: setIdx + 1,
						reps: s.reps ? parseInt(s.reps, 10) : null,
						weight: s.weight ? parseFloat(s.weight) : null,
						rpe: s.rpe,
						notes: s.notes || null,
						completed: true,
						idempotency_key: s.idempotency_key,
					},
					headers: { Prefer: 'resolution=ignore-duplicates' },
				})
				.json()
				.catch(() => {});
		}

		const restSecs = DEFAULT_REST;
		setRestTimer(restSecs);
		if (restInterval.current) clearInterval(restInterval.current);
		restInterval.current = setInterval(() => {
			setRestTimer(prev => {
				if (prev === null || prev <= 1) {
					if (restInterval.current)
						clearInterval(restInterval.current);
					return null;
				}
				return prev - 1;
			});
		}, 1000);
	};

	const finish = () => {
		Alert.alert('Finish workout?', 'This will save your session.', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Finish',
				onPress: () => {
					void (async () => {
						if (workoutResultId) {
							const durationSeconds = Math.round(
								(Date.now() - startedAt.current) / 1000,
							);
							await wsApi()
								.patch(
									`workout_results?id=eq.${workoutResultId}`,
									{
										json: {
											completed_at:
												new Date().toISOString(),
											duration_seconds: durationSeconds,
										},
									},
								)
								.json()
								.catch(() => {});
						}
						navigation.replace('TrainingToday');
					})();
				},
			},
		]);
	};

	if (isLoading || !workout) {
		return (
			<View style={[styles.center, { backgroundColor: '#F9FAFB' }]}>
				<ActivityIndicator color={colors.brand} />
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
			{restTimer !== null && (
				<View
					style={[styles.restBanner, { backgroundColor: '#3B82F6' }]}
				>
					<Text style={styles.restText}>Rest — {restTimer}s</Text>
				</View>
			)}

			<ScrollView contentContainerStyle={styles.container}>
				{workout.workout_sections
					?.sort(
						(a: WorkoutSection, b: WorkoutSection) =>
							a.position - b.position,
					)
					.map((section: WorkoutSection) => (
						<View key={section.id} style={styles.section}>
							<Text
								style={[
									styles.sectionName,
									{ color: '#3B82F6' },
								]}
							>
								{section.name}
							</Text>
							{section.section_blocks
								?.sort(
									(a: SectionBlock, b: SectionBlock) =>
										a.position - b.position,
								)
								.map((block: SectionBlock) => (
									<View
										key={block.id}
										style={[
											styles.block,
											{ backgroundColor: '#FFFFFF' },
										]}
									>
										{block.block_movements
											?.sort(
												(
													a: BlockMovement,
													b: BlockMovement,
												) => a.position - b.position,
											)
											.map((bm: BlockMovement) => {
												const states = getSetStates(bm);
												return (
													<View
														key={bm.id}
														style={styles.movement}
													>
														<Text
															style={[
																styles.movementName,
																{
																	color: '#111827',
																},
															]}
														>
															{bm.movements.name}
														</Text>
														{bm.sets && (
															<Text
																style={[
																	styles.prescription,
																	{
																		color: '#6B7280',
																	},
																]}
															>
																{bm.sets} sets
																{bm.reps_scheme
																	? ` × ${bm.reps_scheme}`
																	: ''}
																{bm.weight_kg
																	? ` @ ${bm.weight_kg}kg`
																	: ''}
															</Text>
														)}
														{states.map(
															(s, idx) => (
																<View
																	key={
																		s.idempotency_key
																	}
																	style={[
																		styles.setRow,
																		s.completed && {
																			opacity: 0.5,
																		},
																	]}
																>
																	<Text
																		style={[
																			styles.setLabel,
																			{
																				color: '#6B7280',
																			},
																		]}
																	>
																		{idx +
																			1}
																	</Text>
																	<TextInput
																		style={[
																			styles.input,
																			{
																				borderColor:
																					'#6B7280',
																				color: '#111827',
																			},
																		]}
																		keyboardType="numeric"
																		placeholder="Reps"
																		placeholderTextColor="#6B7280"
																		value={
																			s.reps
																		}
																		editable={
																			!s.completed
																		}
																		onChangeText={v =>
																			updateSet(
																				bm.id,
																				idx,
																				'reps',
																				v,
																			)
																		}
																	/>
																	<TextInput
																		style={[
																			styles.input,
																			{
																				borderColor:
																					'#6B7280',
																				color: '#111827',
																			},
																		]}
																		keyboardType="numeric"
																		placeholder="kg"
																		placeholderTextColor="#6B7280"
																		value={
																			s.weight
																		}
																		editable={
																			!s.completed
																		}
																		onChangeText={v =>
																			updateSet(
																				bm.id,
																				idx,
																				'weight',
																				v,
																			)
																		}
																	/>
																	<TouchableOpacity
																		style={[
																			styles.doneBtn,
																			{
																				backgroundColor:
																					s.completed
																						? '#43A047'
																						: '#F9FAFB',
																				borderColor:
																					s.completed
																						? '#43A047'
																						: '#6B7280',
																			},
																		]}
																		onPress={() =>
																			!s.completed &&
																			markDone(
																				bm,
																				idx,
																			)
																		}
																	>
																		<Ionicons
																			name={
																				s.completed
																					? 'check-circle'
																					: 'circle-outline'
																			}
																			size={
																				22
																			}
																			color={
																				s.completed
																					? '#fff'
																					: '#6B7280'
																			}
																		/>
																	</TouchableOpacity>
																</View>
															),
														)}
													</View>
												);
											})}
									</View>
								))}
						</View>
					))}
			</ScrollView>

			<View style={[styles.footer, { backgroundColor: '#F9FAFB' }]}>
				<TouchableOpacity
					style={[
						styles.finishBtn,
						{ backgroundColor: colors.danger },
					]}
					onPress={finish}
				>
					<Text style={styles.finishBtnText}>Finish workout</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	restBanner: { padding: 12, alignItems: 'center' },
	restText: { color: '#fff', fontSize: 16, fontWeight: '700' },
	container: { padding: 16, paddingBottom: 100 },
	section: { marginBottom: 20 },
	sectionName: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
	block: { borderRadius: 12, padding: 14, marginBottom: 10 },
	movement: { marginBottom: 16 },
	movementName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
	prescription: { fontSize: 12, marginBottom: 8 },
	setRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 6,
	},
	setLabel: { width: 20, fontSize: 13, fontWeight: '600' },
	input: {
		borderWidth: 1,
		borderRadius: 8,
		width: 64,
		paddingHorizontal: 8,
		paddingVertical: 6,
		fontSize: 15,
		textAlign: 'center',
	},
	doneBtn: {
		borderWidth: 1,
		borderRadius: 20,
		width: 36,
		height: 36,
		justifyContent: 'center',
		alignItems: 'center',
	},
	footer: { padding: 16, paddingBottom: 32 },
	finishBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
	finishBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default RunWorkout;
