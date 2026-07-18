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
import { trainingTheme } from '@/theme/training';
import { mmkvStorage } from '@/storage';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingRunWorkout'>;

type SetState = {
	reps: string;
	weight: string;
	rpe: number | null;
	notes: string;
	completed: boolean;
	idempotency_key: string;
	syncStatus: 'idle' | 'pending' | 'synced' | 'failed';
};

type WorkoutState = Record<string, SetState[]>;

type WorkoutDraft = {
	version: 1;
	userId: string;
	workoutId: string;
	workoutName: string;
	assignmentId: string | null;
	workoutResultId: string | null;
	startedAt: number;
	setStates: WorkoutState;
};

const DEFAULT_REST = 90;

const makeId = () =>
	Math.random().toString(36).slice(2) + Date.now().toString(36);

const syncColor = (set: SetState) => {
	if (set.syncStatus === 'failed') return trainingTheme.colors.danger;
	if (set.syncStatus === 'pending') return trainingTheme.colors.warning;
	if (set.syncStatus === 'synced') return trainingTheme.colors.success;
	return trainingTheme.colors.surfaceMuted;
};

const syncIcon = (set: SetState) => {
	if (set.syncStatus === 'failed') return 'alert-circle-outline';
	if (set.syncStatus === 'pending') return 'cloud-upload-outline';
	if (set.syncStatus === 'synced') return 'check';
	return 'circle-outline';
};

const draftKey = (userId: string, workoutId: string, assignmentId?: string) =>
	`ws:active-workout:${userId}:${workoutId}:${assignmentId ?? 'personal'}`;

const loadDraft = (
	userId: string | undefined,
	workoutId: string,
	assignmentId?: string,
): WorkoutDraft | null => {
	if (!userId) return null;
	const key = draftKey(userId, workoutId, assignmentId);
	const raw = mmkvStorage.getString(key);
	if (!raw) return null;
	try {
		const value = JSON.parse(raw) as Partial<WorkoutDraft>;
		if (
			value.version !== 1 ||
			value.userId !== userId ||
			value.workoutId !== workoutId ||
			typeof value.startedAt !== 'number' ||
			!value.setStates
		) {
			return null;
		}
		const draft = value as WorkoutDraft;
		draft.setStates = Object.fromEntries(
			Object.entries(draft.setStates).map(([movementId, sets]) => [
				movementId,
				sets.map(set => ({
					...set,
					syncStatus:
						set.syncStatus ?? (set.completed ? 'failed' : 'idle'),
				})),
			]),
		);
		return draft;
	} catch {
		mmkvStorage.delete(key);
		return null;
	}
};

const RunWorkout = ({ route, navigation }: Props) => {
	const { colors } = useTheme();
	const { workoutId, assignmentId } = route.params;
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const restoredDraft = useRef(
		loadDraft(uid, workoutId, assignmentId),
	).current;

	const [workoutResultId, setWorkoutResultId] = useState<string | null>(
		restoredDraft?.workoutResultId ?? null,
	);
	const [setStates, setSetStates] = useState<WorkoutState>(
		restoredDraft?.setStates ?? {},
	);
	const [restTimer, setRestTimer] = useState<number | null>(null);
	const [isFinishing, setIsFinishing] = useState(false);
	const restInterval = useRef<ReturnType<typeof setInterval> | null>(null);
	const allowExitRef = useRef(false);
	const startedAt = useRef(restoredDraft?.startedAt ?? Date.now());

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
		if (!uid) return;
		const draft: WorkoutDraft = {
			version: 1,
			userId: uid,
			workoutId,
			workoutName: route.params.workoutName,
			assignmentId: assignmentId ?? null,
			workoutResultId,
			startedAt: startedAt.current,
			setStates,
		};
		mmkvStorage.set(
			draftKey(uid, workoutId, assignmentId),
			JSON.stringify(draft),
		);
	}, [
		uid,
		workoutId,
		assignmentId,
		workoutResultId,
		setStates,
		route.params.workoutName,
	]);

	useEffect(() => {
		const unsubscribe = navigation.addListener('beforeRemove', event => {
			if (allowExitRef.current || isFinishing) return;
			event.preventDefault();
			Alert.alert(
				'Leave this workout?',
				'Your progress can be saved so you can continue later.',
				[
					{ text: 'Keep training', style: 'cancel' },
					{
						text: 'Save and exit',
						onPress: () => {
							allowExitRef.current = true;
							navigation.dispatch(event.data.action);
						},
					},
					{
						text: 'Discard workout',
						style: 'destructive',
						onPress: () => {
							void (async () => {
								try {
									if (workoutResultId) {
										await wsApi().delete(
											`workout_results?id=eq.${workoutResultId}`,
										);
									}
									if (uid) {
										mmkvStorage.delete(
											draftKey(
												uid,
												workoutId,
												assignmentId,
											),
										);
									}
									allowExitRef.current = true;
									navigation.dispatch(event.data.action);
								} catch {
									Alert.alert(
										'Could not discard workout',
										'Check your connection and try again.',
									);
								}
							})();
						},
					},
				],
			);
		});
		return unsubscribe;
	}, [
		navigation,
		isFinishing,
		workoutResultId,
		uid,
		workoutId,
		assignmentId,
	]);

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
			syncStatus: 'idle',
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

	const markDone = async (bm: BlockMovement, setIdx: number) => {
		const s = getSetStates(bm)[setIdx];
		if (!s) return;

		updateSet(bm.id, setIdx, 'completed', true);
		updateSet(bm.id, setIdx, 'syncStatus', 'pending');
		if (!workoutResultId) {
			updateSet(bm.id, setIdx, 'syncStatus', 'failed');
			return;
		}
		try {
			await wsApi().post('set_results', {
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
				headers: {
					Prefer: 'resolution=ignore-duplicates,return=minimal',
				},
			});
			updateSet(bm.id, setIdx, 'syncStatus', 'synced');
		} catch {
			updateSet(bm.id, setIdx, 'syncStatus', 'failed');
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

	const completedSetCount = () =>
		Object.values(setStates).reduce(
			(total, sets) => total + sets.filter(set => set.completed).length,
			0,
		);

	const hasUnsyncedSets = () =>
		Object.values(setStates).some(sets =>
			sets.some(
				set =>
					set.completed &&
					(set.syncStatus === 'pending' ||
						set.syncStatus === 'failed'),
			),
		);

	const finish = () => {
		if (isFinishing) return;
		if (hasUnsyncedSets()) {
			Alert.alert(
				'Some sets are not saved yet',
				'Tap any amber or red set icon to retry before finishing.',
			);
			return;
		}
		Alert.alert('Finish workout?', 'This will save your session.', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Finish',
				onPress: () => {
					void (async () => {
						if (!workoutResultId) {
							Alert.alert(
								'Still preparing your workout',
								'Wait a moment, then try finishing again.',
							);
							return;
						}
						setIsFinishing(true);
						const durationSeconds = Math.max(
							1,
							Math.round((Date.now() - startedAt.current) / 1000),
						);
						try {
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
								.json();
							allowExitRef.current = true;
							navigation.replace('TrainingWorkoutComplete', {
								workoutResultId,
								workoutName: route.params.workoutName,
								durationSeconds,
								completedSets: completedSetCount(),
							});
							if (uid) {
								mmkvStorage.delete(
									draftKey(uid, workoutId, assignmentId),
								);
							}
						} catch {
							Alert.alert(
								'Workout not saved yet',
								'Your workout is still open. Check your connection and try again.',
							);
						} finally {
							setIsFinishing(false);
						}
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

	const failedSetCount = Object.values(setStates).reduce(
		(total, sets) =>
			total + sets.filter(set => set.syncStatus === 'failed').length,
		0,
	);
	const pendingSetCount = Object.values(setStates).reduce(
		(total, sets) =>
			total + sets.filter(set => set.syncStatus === 'pending').length,
		0,
	);

	return (
		<View style={styles.screen}>
			{restoredDraft ? (
				<View style={styles.recoveredBanner} accessibilityRole="alert">
					<Ionicons
						name="history"
						size={18}
						color={trainingTheme.colors.primary}
					/>
					<Text style={styles.recoveredText}>
						Your in-progress workout was restored.
					</Text>
				</View>
			) : null}
			{restTimer !== null && (
				<View style={styles.restBanner} accessibilityRole="timer">
					<Text style={styles.restText}>Rest — {restTimer}s</Text>
				</View>
			)}
			{/* eslint-disable-next-line no-nested-ternary */}
			{failedSetCount > 0 ? (
				<View style={styles.syncErrorBanner} accessibilityRole="alert">
					<Ionicons
						name="cloud-alert-outline"
						size={18}
						color={trainingTheme.colors.danger}
					/>
					<Text style={styles.syncErrorText}>
						{failedSetCount} set{failedSetCount === 1 ? '' : 's'}{' '}
						not saved. Tap the red icon to retry.
					</Text>
				</View>
			) : pendingSetCount > 0 ? (
				<View style={styles.syncPendingBanner}>
					<Ionicons
						name="cloud-upload-outline"
						size={17}
						color={trainingTheme.colors.warning}
					/>
					<Text style={styles.syncPendingText}>Saving set…</Text>
				</View>
			) : null}

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
																					syncColor(
																						s,
																					),
																				borderColor:
																					syncColor(
																						s,
																					),
																			},
																		]}
																		accessibilityRole="button"
																		accessibilityLabel={
																			s.syncStatus ===
																			'failed'
																				? `Retry saving set ${idx + 1}`
																				: `Complete set ${idx + 1}`
																		}
																		disabled={
																			s.syncStatus ===
																				'pending' ||
																			s.syncStatus ===
																				'synced'
																		}
																		onPress={() =>
																			void markDone(
																				bm,
																				idx,
																			)
																		}
																	>
																		<Ionicons
																			name={syncIcon(
																				s,
																			)}
																			size={
																				22
																			}
																			color={
																				s.syncStatus ===
																				'idle'
																					? trainingTheme
																							.colors
																							.textMuted
																					: '#FFFFFF'
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

			<View style={styles.footer}>
				<TouchableOpacity
					style={styles.finishBtn}
					accessibilityRole="button"
					accessibilityState={{ disabled: isFinishing }}
					disabled={isFinishing}
					onPress={finish}
				>
					{isFinishing ? (
						<ActivityIndicator color="#FFFFFF" />
					) : (
						<Text style={styles.finishBtnText}>Finish workout</Text>
					)}
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
	restBanner: {
		minHeight: 52,
		padding: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primary,
	},
	restText: { color: '#fff', fontSize: 16, fontWeight: '700' },
	recoveredBanner: {
		minHeight: 44,
		backgroundColor: trainingTheme.colors.primarySoft,
		paddingHorizontal: trainingTheme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: trainingTheme.spacing.sm,
	},
	recoveredText: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 13,
		fontWeight: '600',
	},
	syncErrorBanner: {
		minHeight: 44,
		backgroundColor: '#FDEDEC',
		paddingHorizontal: trainingTheme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: trainingTheme.spacing.sm,
	},
	syncErrorText: {
		color: trainingTheme.colors.danger,
		fontFamily: 'Inter-Variable',
		fontSize: 12,
		fontWeight: '600',
	},
	syncPendingBanner: {
		minHeight: 36,
		backgroundColor: trainingTheme.colors.warningSoft,
		paddingHorizontal: trainingTheme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: trainingTheme.spacing.sm,
	},
	syncPendingText: {
		color: trainingTheme.colors.warning,
		fontFamily: 'Inter-Variable',
		fontSize: 12,
		fontWeight: '600',
	},
	container: { padding: 16, paddingBottom: 100 },
	section: { marginBottom: 20 },
	sectionName: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 17,
		fontWeight: '700',
		marginBottom: 8,
	},
	block: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: trainingTheme.radius.md,
		padding: trainingTheme.spacing.lg,
		marginBottom: 10,
	},
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
		borderRadius: trainingTheme.radius.sm,
		minWidth: 68,
		minHeight: trainingTheme.touchTarget,
		paddingHorizontal: 8,
		paddingVertical: 6,
		fontSize: 15,
		textAlign: 'center',
	},
	doneBtn: {
		borderWidth: 1,
		borderRadius: trainingTheme.radius.pill,
		width: trainingTheme.touchTarget,
		height: trainingTheme.touchTarget,
		justifyContent: 'center',
		alignItems: 'center',
	},
	footer: {
		padding: 16,
		paddingBottom: 32,
		backgroundColor: trainingTheme.colors.background,
		borderTopColor: trainingTheme.colors.border,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	finishBtn: {
		minHeight: 52,
		padding: 16,
		borderRadius: trainingTheme.radius.sm,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primary,
	},
	finishBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default RunWorkout;
