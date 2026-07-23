import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackScreenProps } from '@/types/navigation';
import Slider from '@ptomasroos/react-native-multi-slider';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = TrainingStackScreenProps<'TrainingInjuryDailyUpdate'>;

const getRecoveryLabel = (value: number) => {
	if (value <= 25) return 'Early recovery';
	if (value <= 50) return 'Making progress';
	if (value <= 75) return 'Feeling stronger';
	if (value < 100) return 'Nearly there';
	return 'Fully recovered';
};

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
		} catch (error) {
			if (error instanceof HTTPError) {
				const body = await error.response
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
		} catch (error) {
			if (error instanceof HTTPError) {
				const body = await error.response
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
		} catch (error) {
			let code: string | undefined;
			let message: string | undefined;
			if (error instanceof HTTPError) {
				const body = await error.response
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
		<SafeAreaView style={styles.screen} edges={['top']}>
			<View style={styles.header}>
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
				<View style={styles.headerCopy}>
					<Text style={styles.headerTitle}>Recovery update</Text>
					<Text style={styles.headerSubtitle}>
						{moment(recordedFor).format('dddd, D MMMM')}
					</Text>
				</View>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.injuryCard}>
					<View style={styles.injuryIcon}>
						<Ionicons
							name="bandage"
							size={27}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<View style={styles.injuryCopy}>
						<Text style={styles.injuryEyebrow}>
							TODAY&apos;S CHECK-IN
						</Text>
						<Text style={styles.injuryTitle}>{injuryBodyArea}</Text>
						<Text style={styles.injuryBody}>
							A quick update helps keep your training appropriate.
						</Text>
					</View>
				</View>

				<View style={styles.recoveryCard}>
					<View style={styles.recoveryHeading}>
						<View>
							<Text style={styles.fieldLabel}>
								How recovered do you feel?
							</Text>
							<Text style={styles.recoveryStatus}>
								{getRecoveryLabel(recoveryPct)}
							</Text>
						</View>
						<View style={styles.percentBadge}>
							<Text style={styles.percentValue}>
								{recoveryPct}%
							</Text>
						</View>
					</View>
					<View
						accessible
						accessibilityRole="adjustable"
						accessibilityLabel="Recovery percentage"
						accessibilityValue={{
							min: 0,
							max: 100,
							now: recoveryPct,
							text: `${recoveryPct} percent`,
						}}
						style={styles.sliderWrap}
					>
						<Slider
							values={[recoveryPct]}
							min={0}
							max={100}
							step={5}
							sliderLength={250}
							onValuesChange={([value]) =>
								setRecoveryPct(value ?? recoveryPct)
							}
							selectedStyle={styles.sliderSelected}
							unselectedStyle={styles.sliderUnselected}
							markerStyle={styles.sliderMarker}
						/>
					</View>
					<View style={styles.sliderLabels}>
						<Text style={styles.sliderLabel}>Needs rest</Text>
						<Text style={styles.sliderLabel}>Fully recovered</Text>
					</View>
				</View>

				<View style={styles.notesCard}>
					<View style={styles.labelRow}>
						<Text style={styles.fieldLabel}>
							How does it feel today?
						</Text>
						<Text style={styles.optional}>Optional</Text>
					</View>
					<TextInput
						accessibilityLabel="Recovery notes"
						style={styles.notesInput}
						value={note}
						onChangeText={setNote}
						placeholder="For example: less stiff, still sore overhead…"
						placeholderTextColor={trainingTheme.colors.textMuted}
						multiline
						maxLength={500}
						numberOfLines={4}
					/>
					<Text style={styles.characterCount}>{note.length}/500</Text>
				</View>

				<View style={styles.coachCard}>
					<View style={styles.coachIcon}>
						<Ionicons
							name="account-voice"
							size={24}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<View style={styles.coachCopy}>
						<Text style={styles.coachTitle}>
							Ask a coach to check in
						</Text>
						<Text style={styles.coachBody}>
							Flag that you would like support with this injury.
						</Text>
					</View>
					<Switch
						accessibilityLabel="Ask a coach to check in"
						value={requestCoachContact}
						onValueChange={setRequestCoachContact}
						trackColor={{
							true: trainingTheme.colors.primary,
							false: trainingTheme.colors.border,
						}}
						thumbColor={trainingTheme.colors.surface}
					/>
				</View>

				<TouchableOpacity
					accessibilityRole="button"
					accessibilityState={{ disabled: submitting }}
					style={[
						styles.submitButton,
						submitting && styles.submitButtonDisabled,
					]}
					onPress={() => void handleSubmit()}
					disabled={submitting}
				>
					<Ionicons name="check" size={21} color="#FFFFFF" />
					<Text style={styles.submitText}>
						{submitting ? 'Saving…' : 'Save today’s update'}
					</Text>
				</TouchableOpacity>
			</ScrollView>

			{toastVisible && (
				<View style={styles.toast}>
					<Ionicons
						name="check-circle"
						size={22}
						color={trainingTheme.colors.success}
					/>
					<Text style={styles.toastText}>Update logged.</Text>
				</View>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: trainingTheme.spacing.lg,
		paddingTop: trainingTheme.spacing.md,
		paddingBottom: trainingTheme.spacing.lg,
		gap: trainingTheme.spacing.md,
	},
	backButton: {
		width: trainingTheme.touchTarget,
		height: trainingTheme.touchTarget,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerCopy: { flex: 1 },
	headerTitle: {
		fontSize: 28,
		lineHeight: 34,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	headerSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	scroll: { flex: 1 },
	content: {
		paddingHorizontal: trainingTheme.spacing.lg,
		paddingBottom: trainingTheme.spacing.xxl,
		gap: trainingTheme.spacing.lg,
	},
	injuryCard: {
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
	},
	injuryIcon: {
		width: 54,
		height: 54,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
	injuryCopy: { flex: 1 },
	injuryEyebrow: {
		fontSize: 11,
		lineHeight: 15,
		fontWeight: '800',
		letterSpacing: 0.9,
		color: trainingTheme.colors.primary,
	},
	injuryTitle: {
		fontSize: 19,
		lineHeight: 25,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		marginTop: 2,
	},
	injuryBody: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	recoveryCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		...trainingTheme.shadow,
	},
	recoveryHeading: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: trainingTheme.spacing.md,
	},
	fieldLabel: {
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	recoveryStatus: {
		fontSize: 13,
		lineHeight: 18,
		color: trainingTheme.colors.primary,
		fontWeight: '700',
		marginTop: 3,
	},
	percentBadge: {
		minWidth: 70,
		height: 48,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: trainingTheme.spacing.sm,
	},
	percentValue: {
		fontSize: 21,
		lineHeight: 27,
		fontWeight: '800',
		color: trainingTheme.colors.primary,
	},
	sliderWrap: {
		alignItems: 'center',
		marginTop: trainingTheme.spacing.xl,
		minHeight: 48,
		justifyContent: 'center',
	},
	sliderSelected: { backgroundColor: trainingTheme.colors.primary },
	sliderUnselected: { backgroundColor: trainingTheme.colors.border },
	sliderMarker: {
		width: 28,
		height: 28,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.primary,
		borderColor: trainingTheme.colors.surface,
		borderWidth: 4,
		...trainingTheme.shadow,
	},
	sliderLabels: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: trainingTheme.spacing.sm,
	},
	sliderLabel: {
		fontSize: 11,
		lineHeight: 15,
		color: trainingTheme.colors.textMuted,
	},
	notesCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		...trainingTheme.shadow,
	},
	labelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: trainingTheme.spacing.md,
	},
	optional: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
	},
	notesInput: {
		minHeight: 104,
		borderRadius: trainingTheme.radius.md,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		backgroundColor: trainingTheme.colors.background,
		padding: trainingTheme.spacing.md,
		fontSize: 15,
		lineHeight: 21,
		color: trainingTheme.colors.text,
		textAlignVertical: 'top',
	},
	characterCount: {
		fontSize: 11,
		color: trainingTheme.colors.textMuted,
		textAlign: 'right',
		marginTop: trainingTheme.spacing.sm,
	},
	coachCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		...trainingTheme.shadow,
	},
	coachIcon: {
		width: 46,
		height: 46,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	coachCopy: { flex: 1 },
	coachTitle: {
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	coachBody: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	submitButton: {
		minHeight: 56,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primary,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: trainingTheme.spacing.sm,
	},
	submitButtonDisabled: { opacity: 0.55 },
	submitText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
	toast: {
		position: 'absolute',
		left: trainingTheme.spacing.lg,
		right: trainingTheme.spacing.lg,
		bottom: trainingTheme.spacing.xl,
		minHeight: 58,
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.md,
		paddingHorizontal: trainingTheme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.sm,
		zIndex: 200,
		...trainingTheme.shadow,
	},
	toastText: {
		fontSize: 14,
		fontWeight: '700',
		color: trainingTheme.colors.text,
	},
});

export default InjuryDailyUpdate;
