import {
	ActivityIndicator,
	Alert,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { StackScreenProps } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import type { TrainingStackParamList } from '@/types/navigation';
import type {
	ScalingLevel,
	WorkoutResult,
} from '@/services/workoutStudio/types';
import { wsApi } from '@/services/workoutStudio/api';
import { trainingTheme } from '@/theme/training';
import TrainingCard from '@/screens/Training/components/TrainingCard';
import TrainingState from '@/screens/Training/components/TrainingState';
import SkeletonCard from '@/screens/Training/components/SkeletonCard';
import { useEffect, useState } from 'react';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingResultDetail'>;

type ResultSet = {
	id: string;
	set_number: number;
	reps: number | null;
	weight: number | null;
	rpe: number | null;
	notes: string | null;
	completed: boolean;
};

type CoachFeedback = {
	id: string;
	body: string;
	created_at: string;
};

const formatDuration = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remaining = seconds % 60;
	return minutes > 0 ? `${minutes}m ${remaining}s` : `${remaining}s`;
};

const formatScore = (result: WorkoutResult) => {
	if (result.score_time_seconds != null)
		return formatDuration(result.score_time_seconds);
	if (result.score_rounds != null)
		return `${result.score_rounds} rounds${result.score_partial_reps ? ` + ${result.score_partial_reps}` : ''}`;
	if (result.score_weight_kg != null)
		return `${result.score_weight_kg} kg${result.score_reps ? ` × ${result.score_reps}` : ''}`;
	if (result.score_reps != null) return `${result.score_reps} reps`;
	return null;
};

const ResultDetail = ({ route, navigation }: Props) => {
	const { workoutResultId } = route.params;
	const [isDeleting, setIsDeleting] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [editNotes, setEditNotes] = useState('');
	const [editScaling, setEditScaling] = useState<ScalingLevel>('rx');
	const [editTime, setEditTime] = useState('');
	const [editRounds, setEditRounds] = useState('');
	const [editPartialReps, setEditPartialReps] = useState('');
	const [editWeight, setEditWeight] = useState('');
	const [editReps, setEditReps] = useState('');
	const result = useQuery({
		queryKey: ['ws-result-detail', workoutResultId],
		queryFn: () =>
			wsApi()
				.get('workout_results', {
					searchParams: {
						select: 'id,workout_id,completed_at,duration_seconds,total_volume_kg,subjective_rating,notes,scaling_level,score_time_seconds,score_rounds,score_partial_reps,score_weight_kg,score_reps,workouts(name)',
						id: `eq.${workoutResultId}`,
						limit: '1',
					},
				})
				.json<WorkoutResult[]>()
				.then(rows => rows[0] ?? null),
	});
	const sets = useQuery({
		queryKey: ['ws-result-sets', workoutResultId],
		queryFn: () =>
			wsApi()
				.get('set_results', {
					searchParams: {
						select: 'id,set_number,reps,weight,rpe,notes,completed',
						workout_result_id: `eq.${workoutResultId}`,
						order: 'set_number.asc',
					},
				})
				.json<ResultSet[]>(),
	});
	const feedback = useQuery({
		queryKey: ['ws-result-feedback', workoutResultId],
		queryFn: () =>
			wsApi()
				.get('workout_result_feedback', {
					searchParams: {
						select: 'id,body,created_at',
						result_id: `eq.${workoutResultId}`,
						order: 'created_at.asc',
					},
				})
				.json<CoachFeedback[]>(),
	});

	useEffect(() => {
		if (!result.data || isEditing) return;
		setEditNotes(result.data.notes ?? '');
		setEditScaling(result.data.scaling_level ?? 'rx');
		setEditTime(
			result.data.score_time_seconds != null
				? formatDuration(result.data.score_time_seconds)
				: '',
		);
		setEditRounds(result.data.score_rounds?.toString() ?? '');
		setEditPartialReps(result.data.score_partial_reps?.toString() ?? '');
		setEditWeight(result.data.score_weight_kg?.toString() ?? '');
		setEditReps(result.data.score_reps?.toString() ?? '');
	}, [result.data, isEditing]);

	const parseTime = (value: string): number | null => {
		const trimmed = value.trim();
		if (!trimmed) return null;
		if (!trimmed.includes(':')) {
			const seconds = Number(trimmed);
			return Number.isFinite(seconds) && seconds >= 0
				? Math.round(seconds)
				: null;
		}
		const [minutesRaw, secondsRaw] = trimmed.split(':');
		const minutes = Number(minutesRaw);
		const seconds = Number(secondsRaw);
		if (
			!Number.isFinite(minutes) ||
			!Number.isFinite(seconds) ||
			minutes < 0 ||
			seconds < 0 ||
			seconds > 59
		)
			return null;
		return Math.round(minutes * 60 + seconds);
	};

	const saveEdits = async () => {
		if (!result.data) return;
		const time = parseTime(editTime);
		if (editTime.trim() && time == null) {
			Alert.alert(
				'Check the time',
				'Enter time as minutes:seconds, for example 12:34.',
			);
			return;
		}
		const numericFields = [
			['Rounds', editRounds],
			['Partial reps', editPartialReps],
			['Weight', editWeight],
			['Reps', editReps],
		] as const;
		const invalidField = numericFields.find(
			([, value]) =>
				value.trim() &&
				(!Number.isFinite(Number(value)) || Number(value) < 0),
		);
		if (invalidField) {
			Alert.alert(
				'Check the score',
				`${invalidField[0]} must be zero or greater.`,
			);
			return;
		}
		setIsSaving(true);
		try {
			await wsApi().patch(`workout_results?id=eq.${workoutResultId}`, {
				json: {
					notes: editNotes.trim() || null,
					is_rx: editScaling === 'rx',
					scaling_level: editScaling,
					score_time_seconds: time,
					score_rounds: editRounds.trim() ? Number(editRounds) : null,
					score_partial_reps: editPartialReps.trim()
						? Number(editPartialReps)
						: null,
					score_weight_kg: editWeight.trim()
						? Number(editWeight)
						: null,
					score_reps: editReps.trim() ? Number(editReps) : null,
				},
				headers: { Prefer: 'return=minimal' },
			});
			await result.refetch();
			setIsEditing(false);
		} catch {
			Alert.alert(
				'Could not save changes',
				'Check your connection and try again.',
			);
		} finally {
			setIsSaving(false);
		}
	};

	const deleteResult = () => {
		Alert.alert(
			'Delete this result?',
			'This removes the result and its logged sets. This cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete result',
					style: 'destructive',
					onPress: () => {
						void (async () => {
							setIsDeleting(true);
							try {
								await wsApi().delete(
									`workout_results?id=eq.${workoutResultId}`,
								);
								navigation.replace('TrainingResults');
							} catch {
								Alert.alert(
									'Could not delete result',
									'Check your connection and try again.',
								);
							} finally {
								setIsDeleting(false);
							}
						})();
					},
				},
			],
		);
	};

	if (result.isLoading) {
		return (
			<View style={styles.loading}>
				<SkeletonCard />
				<SkeletonCard />
			</View>
		);
	}
	if (result.isError || !result.data) {
		return (
			<View style={styles.state}>
				<TrainingState
					kind={result.isError ? 'error' : 'empty'}
					title={
						result.isError
							? "Result couldn't load"
							: 'Result not found'
					}
					message="Try returning to your results and opening it again."
					actionLabel="Back to results"
					onAction={() => navigation.replace('TrainingResults')}
				/>
			</View>
		);
	}

	const score = formatScore(result.data);
	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
		>
			<View style={styles.heading}>
				<View style={styles.completeIcon}>
					<Ionicons name="check" size={22} color="#FFFFFF" />
				</View>
				<View style={styles.headingCopy}>
					<Text style={styles.title}>
						{result.data.workouts.name}
					</Text>
					<Text style={styles.date}>
						{moment(result.data.completed_at).format(
							'dddd, D MMMM · h:mm A',
						)}
					</Text>
				</View>
			</View>

			<TrainingCard style={styles.metrics} accent="success">
				{score ? <Metric label="Score" value={score} /> : null}
				{result.data.duration_seconds != null ? (
					<Metric
						label="Duration"
						value={formatDuration(result.data.duration_seconds)}
					/>
				) : null}
				{result.data.total_volume_kg != null ? (
					<Metric
						label="Volume"
						value={`${result.data.total_volume_kg.toLocaleString()} kg`}
					/>
				) : null}
			</TrainingCard>

			<View style={styles.metaRow}>
				{result.data.scaling_level ? (
					<Text style={styles.pill}>{result.data.scaling_level}</Text>
				) : null}
				<TouchableOpacity
					accessibilityRole="button"
					onPress={() => setIsEditing(true)}
					style={styles.editButton}
				>
					<Ionicons
						name="pencil-outline"
						size={16}
						color={trainingTheme.colors.primary}
					/>
					<Text style={styles.editLabel}>Edit result</Text>
				</TouchableOpacity>
			</View>

			{sets.data && sets.data.length > 0 ? (
				<>
					<Text style={styles.sectionTitle}>Sets</Text>
					<TrainingCard>
						{sets.data.map((set, index) => (
							<View
								key={set.id}
								style={[
									styles.setRow,
									index > 0 && styles.setBorder,
								]}
							>
								<Text style={styles.setNumber}>
									Set {set.set_number}
								</Text>
								<Text style={styles.setValue}>
									{set.weight != null
										? `${set.weight} kg`
										: '—'}
									{set.reps != null ? ` × ${set.reps}` : ''}
									{set.rpe != null ? ` · RPE ${set.rpe}` : ''}
								</Text>
							</View>
						))}
					</TrainingCard>
				</>
			) : null}

			{result.data.notes ? (
				<>
					<Text style={styles.sectionTitle}>Your notes</Text>
					<TrainingCard>
						<Text style={styles.notes}>{result.data.notes}</Text>
					</TrainingCard>
				</>
			) : null}

			{feedback.data && feedback.data.length > 0 ? (
				<>
					<Text style={styles.sectionTitle}>Coach feedback</Text>
					<View style={styles.feedbackList}>
						{feedback.data.map(item => (
							<TrainingCard
								key={item.id}
								style={styles.feedbackCard}
							>
								<View style={styles.feedbackHeading}>
									<Ionicons
										name="message-text-outline"
										size={17}
										color={trainingTheme.colors.primary}
									/>
									<Text style={styles.feedbackLabel}>
										Coach feedback
									</Text>
									<Text style={styles.feedbackDate}>
										{moment(item.created_at).format(
											'D MMM',
										)}
									</Text>
								</View>
								<Text style={styles.feedbackBody}>
									{item.body}
								</Text>
							</TrainingCard>
						))}
					</View>
				</>
			) : null}

			<TouchableOpacity
				accessibilityRole="button"
				accessibilityState={{ disabled: isDeleting }}
				disabled={isDeleting}
				onPress={deleteResult}
				style={styles.deleteButton}
			>
				{isDeleting ? (
					<ActivityIndicator color={trainingTheme.colors.danger} />
				) : (
					<>
						<Ionicons
							name="trash-can-outline"
							size={18}
							color={trainingTheme.colors.danger}
						/>
						<Text style={styles.deleteLabel}>Delete result</Text>
					</>
				)}
			</TouchableOpacity>

			<Modal
				visible={isEditing}
				animationType="slide"
				presentationStyle="pageSheet"
				onRequestClose={() => !isSaving && setIsEditing(false)}
			>
				<ScrollView
					style={styles.editorScreen}
					contentContainerStyle={styles.editorContainer}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.editorHeading}>
						<TouchableOpacity
							accessibilityRole="button"
							disabled={isSaving}
							onPress={() => setIsEditing(false)}
							style={styles.editorHeaderButton}
						>
							<Text style={styles.cancelLabel}>Cancel</Text>
						</TouchableOpacity>
						<Text style={styles.editorTitle}>Edit result</Text>
						<TouchableOpacity
							accessibilityRole="button"
							disabled={isSaving}
							onPress={() => void saveEdits()}
							style={styles.editorHeaderButton}
						>
							{isSaving ? (
								<ActivityIndicator
									size="small"
									color={trainingTheme.colors.primary}
								/>
							) : (
								<Text style={styles.saveLabel}>Save</Text>
							)}
						</TouchableOpacity>
					</View>

					<Text style={styles.fieldLabel}>Scaling</Text>
					<View style={styles.scalingRow}>
						{(
							['rx', 'scaled', 'foundations'] as ScalingLevel[]
						).map(level => (
							<TouchableOpacity
								key={level}
								accessibilityRole="button"
								onPress={() => setEditScaling(level)}
								style={[
									styles.scalingButton,
									editScaling === level &&
										styles.scalingButtonActive,
								]}
							>
								<Text
									style={[
										styles.scalingLabel,
										editScaling === level &&
											styles.scalingLabelActive,
									]}
								>
									{level === 'rx'
										? 'Rx'
										: level.charAt(0).toUpperCase() +
											level.slice(1)}
								</Text>
							</TouchableOpacity>
						))}
					</View>

					{result.data.score_time_seconds != null ? (
						<EditorField
							label="Time (mm:ss)"
							value={editTime}
							onChange={setEditTime}
							keyboardType="numbers-and-punctuation"
						/>
					) : null}
					{result.data.score_rounds != null ? (
						<>
							<EditorField
								label="Rounds"
								value={editRounds}
								onChange={setEditRounds}
								keyboardType="number-pad"
							/>
							<EditorField
								label="Partial reps"
								value={editPartialReps}
								onChange={setEditPartialReps}
								keyboardType="number-pad"
							/>
						</>
					) : null}
					{result.data.score_weight_kg != null ? (
						<EditorField
							label="Weight (kg)"
							value={editWeight}
							onChange={setEditWeight}
							keyboardType="decimal-pad"
						/>
					) : null}
					{result.data.score_reps != null ? (
						<EditorField
							label="Reps"
							value={editReps}
							onChange={setEditReps}
							keyboardType="number-pad"
						/>
					) : null}

					<Text style={styles.fieldLabel}>Notes</Text>
					<TextInput
						style={[styles.editorInput, styles.notesInput]}
						value={editNotes}
						onChangeText={setEditNotes}
						placeholder="How did the workout feel?"
						placeholderTextColor={trainingTheme.colors.textMuted}
						multiline
					/>
				</ScrollView>
			</Modal>
		</ScrollView>
	);
};

const Metric = ({ label, value }: { label: string; value: string }) => (
	<View style={styles.metric}>
		<Text style={styles.metricValue}>{value}</Text>
		<Text style={styles.metricLabel}>{label}</Text>
	</View>
);

const EditorField = ({
	label,
	value,
	onChange,
	keyboardType,
}: {
	label: string;
	value: string;
	onChange: (value: string) => void;
	keyboardType: 'number-pad' | 'decimal-pad' | 'numbers-and-punctuation';
}) => (
	<View>
		<Text style={styles.fieldLabel}>{label}</Text>
		<TextInput
			style={styles.editorInput}
			value={value}
			onChangeText={onChange}
			keyboardType={keyboardType}
			placeholderTextColor={trainingTheme.colors.textMuted}
		/>
	</View>
);

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	container: {
		padding: trainingTheme.spacing.lg,
		paddingBottom: 40,
		gap: trainingTheme.spacing.lg,
	},
	loading: {
		flex: 1,
		padding: trainingTheme.spacing.lg,
		backgroundColor: trainingTheme.colors.background,
	},
	state: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.background,
	},
	heading: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
	},
	completeIcon: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.success,
	},
	headingCopy: { flex: 1 },
	title: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 24,
		fontWeight: '700',
	},
	date: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 13,
		marginTop: 3,
	},
	metrics: { flexDirection: 'row', gap: trainingTheme.spacing.sm },
	metric: { flex: 1, alignItems: 'center', gap: 3 },
	metricValue: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 18,
		fontWeight: '700',
		textAlign: 'center',
	},
	metricLabel: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 11,
	},
	metaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.sm,
	},
	pill: {
		color: trainingTheme.colors.primary,
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: trainingTheme.radius.pill,
		paddingHorizontal: 10,
		paddingVertical: 5,
		fontSize: 12,
		fontWeight: '700',
		textTransform: 'capitalize',
	},
	sectionTitle: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 17,
		fontWeight: '700',
		marginBottom: -4,
	},
	setRow: {
		minHeight: 44,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
	},
	setBorder: {
		borderTopColor: trainingTheme.colors.border,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	setNumber: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 13,
	},
	setValue: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		fontWeight: '600',
	},
	notes: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		lineHeight: 21,
	},
	feedbackList: { gap: trainingTheme.spacing.sm },
	feedbackCard: { backgroundColor: '#F7FAFF', borderColor: '#C9D9FF' },
	feedbackHeading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	feedbackLabel: {
		color: trainingTheme.colors.primary,
		fontFamily: 'Inter-Variable',
		fontSize: 12,
		fontWeight: '700',
	},
	feedbackDate: {
		marginLeft: 'auto',
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 11,
	},
	feedbackBody: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		lineHeight: 21,
		marginTop: trainingTheme.spacing.sm,
	},
	deleteButton: {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		marginTop: trainingTheme.spacing.lg,
	},
	deleteLabel: {
		color: trainingTheme.colors.danger,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		fontWeight: '700',
	},
	editButton: {
		minHeight: 44,
		marginLeft: 'auto',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 5,
		paddingHorizontal: 4,
	},
	editLabel: {
		color: trainingTheme.colors.primary,
		fontFamily: 'Inter-Variable',
		fontSize: 13,
		fontWeight: '700',
	},
	editorScreen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	editorContainer: {
		padding: trainingTheme.spacing.lg,
		paddingBottom: 48,
		gap: trainingTheme.spacing.lg,
	},
	editorHeading: {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	editorHeaderButton: {
		minWidth: 64,
		minHeight: 44,
		justifyContent: 'center',
	},
	editorTitle: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 18,
		fontWeight: '700',
	},
	cancelLabel: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 15,
		fontWeight: '600',
	},
	saveLabel: {
		color: trainingTheme.colors.primary,
		fontFamily: 'Inter-Variable',
		fontSize: 15,
		fontWeight: '700',
		textAlign: 'right',
	},
	fieldLabel: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 13,
		fontWeight: '700',
		marginBottom: 7,
	},
	editorInput: {
		minHeight: 48,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: trainingTheme.radius.sm,
		backgroundColor: trainingTheme.colors.surface,
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 16,
		paddingHorizontal: 13,
		paddingVertical: 10,
	},
	notesInput: { minHeight: 110, textAlignVertical: 'top' },
	scalingRow: { flexDirection: 'row', gap: trainingTheme.spacing.sm },
	scalingButton: {
		flex: 1,
		minHeight: 44,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: trainingTheme.radius.sm,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.surface,
	},
	scalingButtonActive: {
		borderColor: trainingTheme.colors.primary,
		backgroundColor: trainingTheme.colors.primary,
	},
	scalingLabel: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 12,
		fontWeight: '600',
	},
	scalingLabelActive: { color: '#FFFFFF' },
});

export default ResultDetail;
