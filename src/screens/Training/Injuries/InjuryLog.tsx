import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { InjurySide } from '@/services/workoutStudio/types';
import type { TrainingStackScreenProps } from '@/types/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import moment from 'moment';
import { useRef, useState } from 'react';
import {
	Alert,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

type Props = TrainingStackScreenProps<'TrainingInjuryLog'>;

const SIDES: { key: InjurySide; label: string }[] = [
	{ key: 'left', label: 'Left' },
	{ key: 'right', label: 'Right' },
	{ key: 'na', label: 'N/A' },
];

const InjuryLog = ({ navigation }: Props) => {
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const qc = useQueryClient();

	const [bodyArea, setBodyArea] = useState('');
	const [side, setSide] = useState<InjurySide>('na');
	const [severity, setSeverity] = useState<number | null>(null);
	const [startedOn] = useState(moment().format('YYYY-MM-DD'));
	const [shareWithCoaches, setShareWithCoaches] = useState(false);
	const [note, setNote] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [toastVisible, setToastVisible] = useState(false);
	const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const canSubmit = bodyArea.trim().length > 0 && severity !== null;

	const showToast = () => {
		setToastVisible(true);
		if (toastTimer.current) clearTimeout(toastTimer.current);
		toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
	};

	const handleSubmit = async () => {
		if (!canSubmit || submitting) return;
		setSubmitting(true);
		try {
			await wsApi()
				.post('injuries', {
					json: {
						user_id: uid,
						tenant_id: tenantId,
						body_area: bodyArea.trim(),
						side,
						initial_severity: severity,
						started_on: startedOn,
						status: 'active',
						share_with_coaches: shareWithCoaches,
						note: note.trim() || null,
					},
					headers: { Prefer: 'return=representation' },
				})
				.json<{ id: string }[]>();

			void qc.invalidateQueries({ queryKey: ['ws-injuries'] });
			showToast();
			setTimeout(() => navigation.goBack(), 2500);
		} catch (e) {
			if (e instanceof HTTPError) {
				const body = await e.response
					.json<{ code?: string; message?: string }>()
					.catch(() => null);
				// eslint-disable-next-line no-console
				console.log('[InjuryLog] POST error', {
					code: body?.code,
					message: body?.message,
				});
			}
			Alert.alert('Error', 'Could not log injury. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<View style={styles.outer}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.label}>Body area *</Text>
				<TextInput
					style={styles.input}
					value={bodyArea}
					onChangeText={setBodyArea}
					placeholder="e.g. Left knee, Lower back"
					placeholderTextColor="#9CA3AF"
					autoFocus
				/>

				<Text style={styles.label}>Side</Text>
				<View style={styles.segmentRow}>
					{SIDES.map(s => (
						<TouchableOpacity
							key={s.key}
							style={[
								styles.segmentBtn,
								side === s.key && styles.segmentBtnActive,
							]}
							onPress={() => setSide(s.key)}
						>
							<Text
								style={[
									styles.segmentText,
									side === s.key && styles.segmentTextActive,
								]}
							>
								{s.label}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<Text style={styles.label}>
					Initial severity * (1 = mild, 5 = severe)
				</Text>
				<View style={styles.chipRow}>
					{[1, 2, 3, 4, 5].map(n => (
						<TouchableOpacity
							key={n}
							style={[
								styles.chip,
								severity === n && styles.chipActive,
							]}
							onPress={() => setSeverity(n)}
						>
							<Text
								style={[
									styles.chipText,
									severity === n && styles.chipTextActive,
								]}
							>
								{n}
							</Text>
						</TouchableOpacity>
					))}
				</View>

				<Text style={styles.label}>Started on</Text>
				<View style={styles.dateDisplay}>
					<Text style={styles.dateText}>{startedOn}</Text>
				</View>

				<View style={styles.switchRow}>
					<Text style={styles.switchLabel}>
						Let my coaches see this injury and my recovery updates.
					</Text>
					<Switch
						value={shareWithCoaches}
						onValueChange={setShareWithCoaches}
						trackColor={{ true: '#3B82F6', false: '#D1D5DB' }}
					/>
				</View>

				<Text style={styles.label}>Notes (optional)</Text>
				<TextInput
					style={[styles.input, styles.inputMultiline]}
					value={note}
					onChangeText={setNote}
					placeholder="Any additional context…"
					placeholderTextColor="#9CA3AF"
					multiline
					numberOfLines={3}
				/>

				<TouchableOpacity
					style={[
						styles.submitBtn,
						!canSubmit && styles.submitBtnDisabled,
					]}
					onPress={() => void handleSubmit()}
					disabled={!canSubmit || submitting}
				>
					<Text style={styles.submitBtnText}>
						{submitting ? 'Logging…' : 'Log injury'}
					</Text>
				</TouchableOpacity>
			</ScrollView>

			{toastVisible ? (
				<View style={styles.toast}>
					<Text style={styles.toastText}>Injury logged.</Text>
				</View>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	outer: { flex: 1, backgroundColor: '#F9FAFB' },
	scroll: { flex: 1 },
	container: { padding: 16, paddingBottom: 40, gap: 12 },
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
		marginTop: 4,
	},
	input: {
		backgroundColor: '#FFFFFF',
		borderRadius: 10,
		padding: 12,
		fontSize: 15,
		color: '#111827',
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
	segmentRow: { flexDirection: 'row', gap: 8 },
	segmentBtn: {
		flex: 1,
		padding: 10,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#D1D5DB',
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
	},
	segmentBtnActive: {
		borderColor: '#3B82F6',
		backgroundColor: '#EFF6FF',
	},
	segmentText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
	segmentTextActive: { color: '#3B82F6' },
	chipRow: { flexDirection: 'row', gap: 10 },
	chip: {
		width: 44,
		height: 44,
		borderRadius: 22,
		borderWidth: 1,
		borderColor: '#D1D5DB',
		backgroundColor: '#FFFFFF',
		alignItems: 'center',
		justifyContent: 'center',
	},
	chipActive: { borderColor: '#3B82F6', backgroundColor: '#3B82F6' },
	chipText: { fontSize: 16, fontWeight: '600', color: '#374151' },
	chipTextActive: { color: '#FFFFFF' },
	dateDisplay: {
		backgroundColor: '#FFFFFF',
		borderRadius: 10,
		padding: 12,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	dateText: { fontSize: 15, color: '#6B7280' },
	switchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#FFFFFF',
		borderRadius: 10,
		padding: 14,
		gap: 12,
	},
	switchLabel: {
		flex: 1,
		fontSize: 14,
		color: '#374151',
		lineHeight: 20,
	},
	submitBtn: {
		backgroundColor: '#3B82F6',
		borderRadius: 12,
		padding: 16,
		alignItems: 'center',
		marginTop: 8,
	},
	submitBtnDisabled: { backgroundColor: '#9CA3AF' },
	submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
	toast: {
		position: 'absolute',
		left: 16,
		right: 16,
		bottom: 24,
		backgroundColor: '#FFFFFF',
		borderRadius: 6,
		padding: 16,
		borderLeftWidth: 4,
		borderLeftColor: '#3B82F6',
		zIndex: 200,
		shadowColor: '#000',
		shadowOpacity: 0.15,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 4,
	},
	toastText: { fontSize: 14, fontWeight: '600', color: '#111827' },
});

export default InjuryLog;
