import { useMovementDetail } from '@/screens/Training/hooks/useMovementDetail';
import { wsApi } from '@/services/workoutStudio/api';
import { trainingTheme } from '@/theme/training';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
	ActivityIndicator,
	Linking,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

type Props = {
	movementId: string | null;
	movementName: string;
	uid: string | null;
	onClose: () => void;
};

const REP_OPTIONS: (1 | 3 | 5)[] = [1, 3, 5];

export const MovementSheet = ({
	movementId,
	movementName,
	uid,
	onClose,
}: Props): React.JSX.Element => {
	const queryClient = useQueryClient();
	const { detail, bestRM, isLoading } = useMovementDetail(movementId, uid);
	const [selectedRep, setSelectedRep] = useState<1 | 3 | 5>(1);
	const [weightInput, setWeightInput] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [saved, setSaved] = useState(false);
	const [saveError, setSaveError] = useState(false);

	const handleSave = async () => {
		if (!movementId || !uid || !weightInput) return;
		setSubmitting(true);
		setSaveError(false);
		try {
			await wsApi().post('athlete_rms', {
				json: {
					athlete_id: uid,
					movement_id: movementId,
					rep_max: selectedRep,
					weight_kg: parseFloat(weightInput),
					achieved_on: new Date().toISOString().slice(0, 10),
					source: 'manual',
				},
				headers: { Prefer: 'return=minimal' },
			});
			void queryClient.invalidateQueries({ queryKey: ['ws-maxes'] });
			setSaved(true);
			setWeightInput('');
			setTimeout(() => {
				setSaved(false);
			}, 1500);
		} catch {
			setSaveError(true);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			animationType="slide"
			presentationStyle="pageSheet"
			visible={!!movementId}
			onRequestClose={onClose}
			statusBarTranslucent={false}
		>
			<ScrollView
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.header}>
					<Text style={styles.title}>{movementName}</Text>
					<TouchableOpacity
						onPress={onClose}
						hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
						accessibilityRole="button"
						accessibilityLabel="Close movement details"
					>
						<Text style={styles.closeBtn}>×</Text>
					</TouchableOpacity>
				</View>

				{isLoading ? (
					<ActivityIndicator
						color={trainingTheme.colors.primary}
						style={styles.loader}
					/>
				) : null}

				{detail?.description ? (
					<Text style={styles.description}>{detail.description}</Text>
				) : null}

				{detail?.video_url ? (
					<TouchableOpacity
						onPress={() =>
							void Linking.openURL(detail.video_url as string)
						}
					>
						<Text style={styles.videoLink}>
							Watch technique video →
						</Text>
					</TouchableOpacity>
				) : null}

				<View style={styles.divider} />

				<Text style={styles.sectionLabel}>Your best 1RM</Text>
				{bestRM ? (
					<View style={styles.rmRow}>
						<Text style={styles.rmWeight}>
							{bestRM.weight_kg} kg
						</Text>
						<Text style={styles.rmDate}>{bestRM.achieved_on}</Text>
					</View>
				) : (
					<Text style={styles.noRecord}>No 1RM recorded yet</Text>
				)}

				<View style={styles.divider} />

				<Text style={styles.sectionLabel}>Log new max</Text>

				<View style={styles.segmentRow}>
					{REP_OPTIONS.map(n => {
						const isActive = selectedRep === n;
						return (
							<TouchableOpacity
								key={n}
								style={[
									styles.segmentBtn,
									isActive && styles.segmentBtnActive,
								]}
								onPress={() => setSelectedRep(n)}
								accessibilityRole="button"
								accessibilityState={{ selected: isActive }}
								accessibilityLabel={`${n} rep max`}
							>
								<Text
									style={[
										styles.segmentText,
										isActive && styles.segmentTextActive,
									]}
								>
									{n}RM
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>

				<TextInput
					style={styles.weightInput}
					keyboardType="decimal-pad"
					placeholder="kg"
					placeholderTextColor={trainingTheme.colors.textMuted}
					value={weightInput}
					onChangeText={setWeightInput}
				/>

				<TouchableOpacity
					style={[
						styles.saveBtn,
						(!weightInput || submitting) && styles.saveBtnDisabled,
					]}
					onPress={() => void handleSave()}
					disabled={!weightInput || submitting}
				>
					<Text style={styles.saveBtnText}>
						{submitting ? 'Saving…' : 'Save max'}
					</Text>
				</TouchableOpacity>

				{saved ? <Text style={styles.savedText}>Saved!</Text> : null}
				{saveError ? (
					<Text style={styles.errorText}>
						Could not save. Try again.
					</Text>
				) : null}
			</ScrollView>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: trainingTheme.spacing.xl,
		paddingBottom: 40,
		backgroundColor: trainingTheme.colors.background,
		flexGrow: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	title: {
		flex: 1,
		fontSize: 18,
		fontWeight: '700',
		color: trainingTheme.colors.text,
	},
	closeBtn: {
		fontSize: 24,
		color: trainingTheme.colors.textMuted,
		lineHeight: 28,
	},
	loader: { marginVertical: 16 },
	description: {
		fontSize: 14,
		color: trainingTheme.colors.textMuted,
		marginBottom: 12,
		lineHeight: 20,
	},
	videoLink: {
		fontSize: 14,
		color: trainingTheme.colors.primary,
		marginBottom: 12,
	},
	divider: {
		height: 1,
		backgroundColor: trainingTheme.colors.border,
		marginVertical: 12,
	},
	sectionLabel: {
		fontSize: 13,
		color: trainingTheme.colors.textMuted,
		fontWeight: '500',
		marginBottom: 8,
	},
	rmRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
		gap: 8,
		marginBottom: 4,
	},
	rmWeight: {
		fontSize: 22,
		fontWeight: '700',
		color: trainingTheme.colors.primary,
	},
	rmDate: {
		fontSize: 13,
		color: trainingTheme.colors.textMuted,
	},
	noRecord: {
		fontSize: 14,
		color: trainingTheme.colors.textMuted,
		marginBottom: 4,
	},
	segmentRow: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 12,
	},
	segmentBtn: {
		flex: 1,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		borderRadius: trainingTheme.radius.sm,
		paddingVertical: 10,
		alignItems: 'center',
	},
	segmentBtnActive: {
		backgroundColor: trainingTheme.colors.primary,
		borderColor: trainingTheme.colors.primary,
	},
	segmentText: {
		fontSize: 14,
		fontWeight: '500',
		color: trainingTheme.colors.text,
	},
	segmentTextActive: {
		color: trainingTheme.colors.surface,
	},
	weightInput: {
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		borderRadius: trainingTheme.radius.sm,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
		color: trainingTheme.colors.text,
		backgroundColor: trainingTheme.colors.surface,
		marginBottom: 12,
	},
	saveBtn: {
		backgroundColor: trainingTheme.colors.primary,
		borderRadius: trainingTheme.radius.sm,
		paddingVertical: 12,
		alignItems: 'center',
		marginBottom: 8,
	},
	saveBtnDisabled: {
		opacity: 0.5,
	},
	saveBtnText: {
		color: trainingTheme.colors.surface,
		fontSize: 15,
		fontWeight: '600',
	},
	savedText: {
		color: trainingTheme.colors.success,
		fontSize: 14,
		textAlign: 'center',
		marginTop: 4,
	},
	errorText: {
		color: trainingTheme.colors.danger,
		fontSize: 14,
		textAlign: 'center',
		marginTop: 4,
	},
});
