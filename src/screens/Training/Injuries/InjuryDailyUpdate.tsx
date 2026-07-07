import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
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
import Slider from '@ptomasroos/react-native-multi-slider';

type Props = TrainingStackScreenProps<'TrainingInjuryDailyUpdate'>;

const InjuryDailyUpdate = ({ navigation, route }: Props) => {
	const { injuryId, injuryBodyArea } = route.params;
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const qc = useQueryClient();

	const [recoveryPct, setRecoveryPct] = useState(50);
	const [note, setNote] = useState('');
	const [requestCoachContact, setRequestCoachContact] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [toastVisible, setToastVisible] = useState(false);
	const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const recordedFor = moment().format('YYYY-MM-DD');

	const showToast = () => {
		setToastVisible(true);
		if (toastTimer.current) clearTimeout(toastTimer.current);
		toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
	};

	const doPatch = async (existingId: string) => {
		await wsApi().patch('injury_updates', {
			searchParams: { id: `eq.${existingId}` },
			json: {
				recovery_pct: recoveryPct,
				note: note.trim() || null,
				request_coach_contact: requestCoachContact,
			},
		});
	};

	const executePatch = async (existingId: string) => {
		setSubmitting(true);
		try {
			await doPatch(existingId);
			void qc.invalidateQueries({ queryKey: ['ws-injuries'] });
			showToast();
			setTimeout(() => navigation.goBack(), 2500);
		} catch (e) {
			if (e instanceof HTTPError) {
				const body = await e.response
					.json<{ code?: string; message?: string }>()
					.catch(() => null);
				// eslint-disable-next-line no-console
				console.log('[InjuryDailyUpdate] PATCH error', {
					code: body?.code,
					message: body?.message,
				});
			}
			Alert.alert('Error', 'Could not replace update. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	const handleDuplicate = async () => {
		try {
			const rows = await wsApi()
				.get('injury_updates', {
					searchParams: {
						select: 'id',
						injury_id: `eq.${injuryId}`,
						recorded_for: `eq.${recordedFor}`,
						limit: '1',
					},
				})
				.json<{ id: string }[]>();

			const existingId = rows[0]?.id;
			if (!existingId) {
				Alert.alert(
					'Error',
					'Could not find existing update to replace.',
				);
				return;
			}

			Alert.alert('Already logged today', 'Replace it?', [
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Replace',
					onPress: () => void executePatch(existingId),
				},
			]);
		} catch (e) {
			if (e instanceof HTTPError) {
				const body = await e.response
					.json<{ code?: string; message?: string }>()
					.catch(() => null);
				// eslint-disable-next-line no-console
				console.log('[InjuryDailyUpdate] GET existing error', {
					code: body?.code,
					message: body?.message,
				});
			}
			Alert.alert('Error', 'Could not check existing update.');
		}
	};

	const handleSubmit = async () => {
		if (submitting) return;
		setSubmitting(true);
		try {
			await wsApi().post('injury_updates', {
				json: {
					injury_id: injuryId,
					user_id: uid,
					tenant_id: tenantId,
					recovery_pct: recoveryPct,
					note: note.trim() || null,
					request_coach_contact: requestCoachContact,
					recorded_for: recordedFor,
				},
			});
			void qc.invalidateQueries({ queryKey: ['ws-injuries'] });
			showToast();
			setTimeout(() => navigation.goBack(), 2500);
		} catch (e) {
			let code: string | undefined;
			let message: string | undefined;
			if (e instanceof HTTPError) {
				const body = await e.response
					.json<{ code?: string; message?: string }>()
					.catch(() => null);
				code = body?.code;
				message = body?.message;
				// eslint-disable-next-line no-console
				console.log('[InjuryDailyUpdate] POST error', {
					code,
					message,
				});
			}

			if (code === '23505') {
				setSubmitting(false);
				await handleDuplicate();
			} else {
				Alert.alert('Error', 'Could not log update. Please try again.');
				setSubmitting(false);
			}
		}
	};

	return (
		<View style={styles.outer}>
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.container}
				keyboardShouldPersistTaps="handled"
			>
				<Text style={styles.heading}>{injuryBodyArea}</Text>

				<Text style={styles.label}>Recovery today</Text>
				<View style={styles.sliderWrap}>
					<Text style={styles.sliderValue}>{recoveryPct}%</Text>
					<Slider
						values={[recoveryPct]}
						min={0}
						max={100}
						step={5}
						sliderLength={240}
						onValuesChange={([v]) =>
							setRecoveryPct(v ?? recoveryPct)
						}
						selectedStyle={{ backgroundColor: '#3B82F6' }}
						unselectedStyle={{ backgroundColor: '#D1D5DB' }}
						markerStyle={{
							backgroundColor: '#3B82F6',
							borderColor: '#fff',
							borderWidth: 2,
						}}
					/>
				</View>

				<Text style={styles.label}>Notes (optional)</Text>
				<TextInput
					style={[styles.input, styles.inputMultiline]}
					value={note}
					onChangeText={setNote}
					placeholder="How does it feel today?"
					placeholderTextColor="#9CA3AF"
					multiline
					numberOfLines={3}
				/>

				<View style={styles.switchRow}>
					<Text style={styles.switchLabel}>
						Ask a coach to check in with me about this.
					</Text>
					<Switch
						value={requestCoachContact}
						onValueChange={setRequestCoachContact}
						trackColor={{ true: '#3B82F6', false: '#D1D5DB' }}
					/>
				</View>

				<TouchableOpacity
					style={[
						styles.submitBtn,
						submitting && styles.submitBtnDisabled,
					]}
					onPress={() => void handleSubmit()}
					disabled={submitting}
				>
					<Text style={styles.submitBtnText}>
						{submitting ? 'Logging…' : 'Log update'}
					</Text>
				</TouchableOpacity>
			</ScrollView>

			{toastVisible ? (
				<View style={styles.toast}>
					<Text style={styles.toastText}>Update logged.</Text>
				</View>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	outer: { flex: 1, backgroundColor: '#F9FAFB' },
	scroll: { flex: 1 },
	container: { padding: 16, paddingBottom: 40, gap: 12 },
	heading: {
		fontSize: 20,
		fontWeight: '700',
		color: '#111827',
		marginBottom: 4,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
		marginTop: 4,
	},
	sliderWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		backgroundColor: '#FFFFFF',
		borderRadius: 10,
		padding: 14,
	},
	sliderValue: {
		fontSize: 22,
		fontWeight: '700',
		color: '#3B82F6',
		width: 52,
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

export default InjuryDailyUpdate;
