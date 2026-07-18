import {
	createSubmissionId,
	logSectionResultAtomic,
	type SectionScoreEntryPayload,
	type SectionScorePayload,
} from '@/services/workoutStudio/scoreable';
import type {
	ScalingLevel,
	WorkoutSection,
} from '@/services/workoutStudio/types';
import { trainingTheme } from '@/theme/training';
import { useEffect, useState } from 'react';
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

type EntryState = { primary: string; secondary: string };

const parseTime = (value: string): number | undefined => {
	if (!value.trim()) return undefined;
	const parts = value.split(':').map(Number);
	if (
		parts.length > 2 ||
		parts.some(part => !Number.isFinite(part) || part < 0) ||
		(parts.length === 2 && parts[1]! >= 60)
	)
		return undefined;
	return parts.length === 2 ? parts[0]! * 60 + parts[1]! : parts[0];
};

const numberOrUndefined = (value: string): number | undefined => {
	if (!value.trim()) return undefined;
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const scoreTypeFor = (section: WorkoutSection) => {
	if (['for_time', 'chipper', 'emom'].includes(section.scoring_type))
		return 'time';
	if (section.scoring_type === 'amrap') return 'rounds_reps';
	if (section.scoring_type === 'strength') return 'load';
	return section.leaderboard_score_type ?? 'custom_numeric';
};

const entryCountFor = (section: WorkoutSection) => {
	if (section.rounds && section.rounds > 0) return section.rounds;
	if (section.score_collection_mode === 'per_set') {
		const sets = section.section_blocks.flatMap(block =>
			block.block_movements.map(item => item.sets ?? 0),
		);
		return Math.max(1, ...sets);
	}
	return 1;
};

const SectionScoreModal = ({
	section,
	visible,
	onClose,
	onLogged,
	sessionSubmissionId,
	assignmentId,
	scalingLevel,
}: {
	section: WorkoutSection | null;
	visible: boolean;
	onClose: () => void;
	onLogged: () => void;
	sessionSubmissionId: string;
	assignmentId?: string;
	scalingLevel: ScalingLevel;
}) => {
	const [primary, setPrimary] = useState('');
	const [secondary, setSecondary] = useState('');
	const [notes, setNotes] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [submissionId, setSubmissionId] = useState(createSubmissionId);
	const [entries, setEntries] = useState<EntryState[]>([
		{ primary: '', secondary: '' },
	]);
	const isMulti = section?.score_collection_mode !== 'section';
	const kind = section ? scoreTypeFor(section) : 'custom_numeric';
	const count = section ? entryCountFor(section) : 1;

	useEffect(() => {
		setEntries(
			Array.from({ length: count }, () => ({
				primary: '',
				secondary: '',
			})),
		);
		setPrimary('');
		setSecondary('');
		setNotes('');
		setSubmissionId(createSubmissionId());
	}, [section?.id, count]);

	if (!section) return null;

	let labels = ['Score', ''];
	if (kind === 'time') labels = ['Time (MM:SS)', ''];
	if (kind === 'rounds_reps') labels = ['Rounds', 'Partial reps'];
	if (kind === 'load') labels = ['Weight (kg)', 'Reps'];

	const buildScore = (state: EntryState): SectionScorePayload => {
		if (kind === 'time')
			return { time_seconds: parseTime(state.primary), score_type: kind };
		if (kind === 'rounds_reps')
			return {
				rounds: numberOrUndefined(state.primary),
				partial_reps: numberOrUndefined(state.secondary),
				score_type: kind,
			};
		if (kind === 'load')
			return {
				weight_kg: numberOrUndefined(state.primary),
				reps: numberOrUndefined(state.secondary),
				score_type: kind,
			};
		return { points: numberOrUndefined(state.primary), score_type: kind };
	};

	const submit = async () => {
		const states = isMulti ? entries : [{ primary, secondary }];
		const hasInvalidScore = states.some(state => {
			if (!state.primary.trim()) return true;
			if (kind === 'time') return parseTime(state.primary) === undefined;
			if (numberOrUndefined(state.primary) === undefined) return true;
			if (kind === 'load') {
				return numberOrUndefined(state.secondary) === undefined;
			}
			return (
				Boolean(state.secondary.trim()) &&
				numberOrUndefined(state.secondary) === undefined
			);
		});
		if (hasInvalidScore) {
			Alert.alert(
				'Check the score',
				kind === 'time'
					? 'Enter a valid time, such as 8:30.'
					: 'Complete each required score field with a valid number.',
			);
			return;
		}
		setSubmitting(true);
		try {
			const score = isMulti
				? { score_type: kind }
				: buildScore({ primary, secondary });
			const scoreEntries: SectionScoreEntryPayload[] = isMulti
				? entries.map((entry, index) => ({
						...buildScore(entry),
						segment_index: index,
						segment_label: `${section.score_collection_mode.replace('per_', '')} ${index + 1}`,
					}))
				: [];
			await logSectionResultAtomic({
				sectionId: section.id,
				sessionSubmissionId,
				sectionSubmissionId: submissionId,
				scalingLevel,
				score,
				entries: scoreEntries,
				notes: notes.trim() || undefined,
				assignmentId,
			});
			onLogged();
			onClose();
		} catch (error) {
			Alert.alert(
				'Could not save score',
				error instanceof Error
					? error.message
					: 'Check your connection and try again.',
			);
		} finally {
			setSubmitting(false);
		}
	};

	const fields = (
		state: EntryState,
		onChange: (next: EntryState) => void,
	) => (
		<View style={styles.fieldRow}>
			<View style={styles.field}>
				<Text style={styles.label}>{labels[0]}</Text>
				<TextInput
					style={styles.input}
					value={state.primary}
					onChangeText={value =>
						onChange({ ...state, primary: value })
					}
					keyboardType={
						kind === 'time'
							? 'numbers-and-punctuation'
							: 'decimal-pad'
					}
				/>
			</View>
			{labels[1] ? (
				<View style={styles.field}>
					<Text style={styles.label}>{labels[1]}</Text>
					<TextInput
						style={styles.input}
						value={state.secondary}
						onChangeText={value =>
							onChange({ ...state, secondary: value })
						}
						keyboardType="number-pad"
					/>
				</View>
			) : null}
		</View>
	);

	return (
		<Modal
			visible={visible}
			animationType="slide"
			presentationStyle="pageSheet"
			onRequestClose={onClose}
		>
			<View style={styles.screen}>
				<View style={styles.header}>
					<View>
						<Text style={styles.title}>Log section score</Text>
						<Text style={styles.subtitle}>{section.name}</Text>
					</View>
					<TouchableOpacity onPress={onClose} disabled={submitting}>
						<Text style={styles.close}>Close</Text>
					</TouchableOpacity>
				</View>
				<ScrollView
					contentContainerStyle={styles.content}
					keyboardShouldPersistTaps="handled"
				>
					<Text style={styles.collection}>
						{section.score_collection_mode.replace(/_/g, ' ')}
					</Text>
					{isMulti
						? entries.map((entry, index) => (
								<View
									key={`${section.id}-${index}`}
									style={styles.entry}
								>
									<Text style={styles.entryTitle}>
										{index + 1}
									</Text>
									{fields(entry, next =>
										setEntries(current =>
											current.map((item, itemIndex) =>
												itemIndex === index
													? next
													: item,
											),
										),
									)}
								</View>
							))
						: fields({ primary, secondary }, next => {
								setPrimary(next.primary);
								setSecondary(next.secondary);
							})}
					<Text style={styles.label}>Notes</Text>
					<TextInput
						style={[styles.input, styles.notes]}
						value={notes}
						onChangeText={setNotes}
						multiline
					/>
				</ScrollView>
				<TouchableOpacity
					style={styles.save}
					onPress={() => void submit()}
					disabled={submitting}
				>
					{submitting ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.saveText}>Save score</Text>
					)}
				</TouchableOpacity>
			</View>
		</Modal>
	);
};

export default SectionScoreModal;

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: trainingTheme.colors.background,
		padding: 16,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 12,
	},
	title: {
		color: trainingTheme.colors.text,
		fontSize: 21,
		fontWeight: '700',
	},
	subtitle: { color: trainingTheme.colors.textMuted, marginTop: 3 },
	close: {
		color: trainingTheme.colors.primary,
		fontWeight: '700',
		padding: 10,
	},
	content: { gap: 14, paddingBottom: 30 },
	collection: {
		alignSelf: 'flex-start',
		textTransform: 'capitalize',
		color: trainingTheme.colors.primary,
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 5,
		fontSize: 12,
		fontWeight: '700',
	},
	entry: {
		padding: 12,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		borderRadius: 14,
		backgroundColor: trainingTheme.colors.surface,
	},
	entryTitle: {
		color: trainingTheme.colors.text,
		fontWeight: '700',
		marginBottom: 8,
	},
	fieldRow: { flexDirection: 'row', gap: 10 },
	field: { flex: 1 },
	label: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		fontWeight: '600',
		marginBottom: 5,
	},
	input: {
		minHeight: 48,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		borderRadius: 10,
		backgroundColor: trainingTheme.colors.surface,
		color: trainingTheme.colors.text,
		paddingHorizontal: 12,
	},
	notes: { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 },
	save: {
		minHeight: 52,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primary,
	},
	saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
