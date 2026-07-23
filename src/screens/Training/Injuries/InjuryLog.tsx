import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { InjurySide } from '@/services/workoutStudio/types';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackScreenProps } from '@/types/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import moment from 'moment';
import { useRef, useState } from 'react';
import {
	Alert,
	FlatList,
	Modal,
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

type Props = TrainingStackScreenProps<'TrainingInjuryLog'>;

const BODY_AREAS = [
	'Neck',
	'Shoulder',
	'Upper back',
	'Lower back',
	'Elbow',
	'Wrist',
	'Chest',
	'Hip',
	'Knee',
	'Ankle',
	'Foot',
	'Hamstring',
	'Quad',
	'Calf',
	'Other',
] as const;

const SIDES: { key: InjurySide; label: string }[] = [
	{ key: 'left', label: 'Left' },
	{ key: 'right', label: 'Right' },
	{ key: 'na', label: 'N/A' },
];

const BodyAreaSeparator = () => <View style={styles.sheetSeparator} />;

const InjuryLog = ({ navigation }: Props) => {
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const qc = useQueryClient();

	const [bodyArea, setBodyArea] = useState('');
	const [bodyAreaSheetOpen, setBodyAreaSheetOpen] = useState(false);
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
		} catch (error) {
			if (error instanceof HTTPError) {
				const body = await error.response
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
					<Text style={styles.headerTitle}>Log an injury</Text>
					<Text style={styles.headerSubtitle}>
						Help us understand what affects your training.
					</Text>
				</View>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.introCard}>
					<View style={styles.introIcon}>
						<Ionicons
							name="heart-pulse"
							size={27}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<View style={styles.introCopy}>
						<Text style={styles.introTitle}>
							Recovery starts with context
						</Text>
						<Text style={styles.introBody}>
							This helps personalise sessions while you recover.
						</Text>
					</View>
				</View>

				<View style={styles.formCard}>
					<Text style={styles.sectionEyebrow}>INJURY DETAILS</Text>
					<Text style={styles.label}>
						Body area <Text style={styles.required}>*</Text>
					</Text>
					<TouchableOpacity
						accessibilityRole="button"
						accessibilityLabel={
							bodyArea
								? `Body area: ${bodyArea}`
								: 'Select body area'
						}
						style={styles.pickerTrigger}
						onPress={() => setBodyAreaSheetOpen(true)}
					>
						<View style={styles.pickerCopy}>
							<Ionicons
								name="human-male"
								size={21}
								color={trainingTheme.colors.primary}
							/>
							<Text
								style={
									bodyArea
										? styles.pickerValue
										: styles.pickerPlaceholder
								}
							>
								{bodyArea || 'Select body area'}
							</Text>
						</View>
						<Ionicons
							name="chevron-down"
							size={21}
							color={trainingTheme.colors.textMuted}
						/>
					</TouchableOpacity>

					<Text style={styles.label}>Side</Text>
					<View style={styles.segmentRow}>
						{SIDES.map(option => {
							const selected = side === option.key;
							return (
								<TouchableOpacity
									key={option.key}
									accessibilityRole="radio"
									accessibilityState={{ selected }}
									style={[
										styles.segmentButton,
										selected &&
											styles.segmentButtonSelected,
									]}
									onPress={() => setSide(option.key)}
								>
									<Text
										style={[
											styles.segmentText,
											selected &&
												styles.segmentTextSelected,
										]}
									>
										{option.label}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>

					<View style={styles.labelRow}>
						<Text style={styles.labelInline}>
							Initial severity{' '}
							<Text style={styles.required}>*</Text>
						</Text>
						<Text style={styles.labelHint}>1 mild · 5 severe</Text>
					</View>
					<View style={styles.severityRow}>
						{[1, 2, 3, 4, 5].map(value => {
							const selected = severity === value;
							return (
								<TouchableOpacity
									key={value}
									accessibilityRole="radio"
									accessibilityLabel={`Severity ${value} out of 5`}
									accessibilityState={{ selected }}
									style={[
										styles.severityButton,
										selected &&
											styles.severityButtonSelected,
									]}
									onPress={() => setSeverity(value)}
								>
									<Text
										style={[
											styles.severityText,
											selected &&
												styles.severityTextSelected,
										]}
									>
										{value}
									</Text>
								</TouchableOpacity>
							);
						})}
					</View>

					<Text style={styles.label}>Started on</Text>
					<View style={styles.dateDisplay}>
						<Ionicons
							name="calendar-blank-outline"
							size={21}
							color={trainingTheme.colors.primary}
						/>
						<Text style={styles.dateText}>
							{moment(startedOn).format('dddd, D MMMM YYYY')}
						</Text>
					</View>
				</View>

				<View style={styles.shareCard}>
					<View style={styles.shareIcon}>
						<Ionicons
							name="account-heart-outline"
							size={24}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<View style={styles.shareCopy}>
						<Text style={styles.shareTitle}>
							Share with my coaches
						</Text>
						<Text style={styles.shareBody}>
							Let coaches see this injury and your recovery
							updates.
						</Text>
					</View>
					<Switch
						accessibilityLabel="Share injury with my coaches"
						value={shareWithCoaches}
						onValueChange={setShareWithCoaches}
						trackColor={{
							true: trainingTheme.colors.primary,
							false: trainingTheme.colors.border,
						}}
						thumbColor={trainingTheme.colors.surface}
					/>
				</View>

				<View style={styles.formCard}>
					<View style={styles.labelRow}>
						<Text style={styles.labelInline}>Notes</Text>
						<Text style={styles.labelHint}>Optional</Text>
					</View>
					<TextInput
						accessibilityLabel="Injury notes"
						style={styles.notesInput}
						value={note}
						onChangeText={setNote}
						placeholder="Add anything your coach should know…"
						placeholderTextColor={trainingTheme.colors.textMuted}
						multiline
						maxLength={500}
						numberOfLines={4}
					/>
					<Text style={styles.characterCount}>{note.length}/500</Text>
				</View>

				<TouchableOpacity
					accessibilityRole="button"
					accessibilityState={{ disabled: !canSubmit || submitting }}
					style={[
						styles.submitButton,
						!canSubmit && styles.submitButtonDisabled,
					]}
					onPress={() => void handleSubmit()}
					disabled={!canSubmit || submitting}
				>
					<Ionicons
						name="shield-plus-outline"
						size={21}
						color={
							canSubmit
								? '#FFFFFF'
								: trainingTheme.colors.textMuted
						}
					/>
					<Text
						style={[
							styles.submitText,
							!canSubmit && styles.submitTextDisabled,
						]}
					>
						{submitting ? 'Logging…' : 'Log injury'}
					</Text>
				</TouchableOpacity>
				{!canSubmit && (
					<Text style={styles.submitHint}>
						Select a body area and severity to continue.
					</Text>
				)}
			</ScrollView>

			{toastVisible && (
				<View style={styles.toast}>
					<Ionicons
						name="check-circle"
						size={22}
						color={trainingTheme.colors.success}
					/>
					<Text style={styles.toastText}>Injury logged.</Text>
				</View>
			)}

			<Modal
				visible={bodyAreaSheetOpen}
				transparent
				animationType="slide"
				onRequestClose={() => setBodyAreaSheetOpen(false)}
			>
				<View style={styles.sheetContainer}>
					<TouchableOpacity
						accessibilityRole="button"
						accessibilityLabel="Close body area picker"
						style={styles.sheetBackdrop}
						activeOpacity={1}
						onPress={() => setBodyAreaSheetOpen(false)}
					/>
					<View style={styles.sheet}>
						<View style={styles.sheetHandle} />
						<View style={styles.sheetHeader}>
							<View>
								<Text style={styles.sheetTitle}>
									Choose body area
								</Text>
								<Text style={styles.sheetSubtitle}>
									Where are you feeling the issue?
								</Text>
							</View>
							<TouchableOpacity
								accessibilityRole="button"
								accessibilityLabel="Close"
								style={styles.sheetClose}
								onPress={() => setBodyAreaSheetOpen(false)}
							>
								<Ionicons
									name="close"
									size={22}
									color={trainingTheme.colors.text}
								/>
							</TouchableOpacity>
						</View>
						<FlatList
							data={BODY_AREAS}
							keyExtractor={item => item}
							renderItem={({ item }) => {
								const selected = bodyArea === item;
								return (
									<TouchableOpacity
										accessibilityRole="radio"
										accessibilityState={{ selected }}
										style={styles.sheetRow}
										onPress={() => {
											setBodyArea(item);
											setBodyAreaSheetOpen(false);
										}}
									>
										<Text style={styles.sheetRowText}>
											{item}
										</Text>
										{selected && (
											<Ionicons
												name="check-circle"
												size={22}
												color={
													trainingTheme.colors.primary
												}
											/>
										)}
									</TouchableOpacity>
								);
							}}
							ItemSeparatorComponent={BodyAreaSeparator}
						/>
					</View>
				</View>
			</Modal>
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
	introCard: {
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
	},
	introIcon: {
		width: 52,
		height: 52,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
	introCopy: { flex: 1 },
	introTitle: {
		fontSize: 16,
		lineHeight: 21,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	introBody: {
		fontSize: 13,
		lineHeight: 18,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	formCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		...trainingTheme.shadow,
	},
	sectionEyebrow: {
		fontSize: 11,
		lineHeight: 15,
		fontWeight: '800',
		letterSpacing: 0.9,
		color: trainingTheme.colors.primary,
		marginBottom: trainingTheme.spacing.md,
	},
	label: {
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '700',
		color: trainingTheme.colors.text,
		marginTop: trainingTheme.spacing.md,
		marginBottom: trainingTheme.spacing.sm,
	},
	required: { color: trainingTheme.colors.danger },
	pickerTrigger: {
		minHeight: 54,
		borderRadius: trainingTheme.radius.md,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		backgroundColor: trainingTheme.colors.background,
		paddingHorizontal: trainingTheme.spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	pickerCopy: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.sm,
	},
	pickerValue: { fontSize: 15, color: trainingTheme.colors.text },
	pickerPlaceholder: { fontSize: 15, color: trainingTheme.colors.textMuted },
	segmentRow: { flexDirection: 'row', gap: trainingTheme.spacing.sm },
	segmentButton: {
		flex: 1,
		minHeight: 48,
		borderRadius: trainingTheme.radius.md,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		backgroundColor: trainingTheme.colors.background,
		alignItems: 'center',
		justifyContent: 'center',
	},
	segmentButtonSelected: {
		borderColor: trainingTheme.colors.primary,
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	segmentText: {
		fontSize: 14,
		fontWeight: '700',
		color: trainingTheme.colors.textMuted,
	},
	segmentTextSelected: { color: trainingTheme.colors.primary },
	labelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.sm,
	},
	labelInline: {
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '700',
		color: trainingTheme.colors.text,
	},
	labelHint: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
	},
	severityRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	severityButton: {
		width: 48,
		height: 48,
		borderRadius: trainingTheme.radius.pill,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		backgroundColor: trainingTheme.colors.background,
		alignItems: 'center',
		justifyContent: 'center',
	},
	severityButtonSelected: {
		borderColor: trainingTheme.colors.primary,
		backgroundColor: trainingTheme.colors.primary,
	},
	severityText: {
		fontSize: 16,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	severityTextSelected: { color: '#FFFFFF' },
	dateDisplay: {
		minHeight: 54,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.background,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		paddingHorizontal: trainingTheme.spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.sm,
	},
	dateText: { fontSize: 14, color: trainingTheme.colors.textMuted },
	shareCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		...trainingTheme.shadow,
	},
	shareIcon: {
		width: 46,
		height: 46,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	shareCopy: { flex: 1 },
	shareTitle: {
		fontSize: 15,
		lineHeight: 20,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	shareBody: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	notesInput: {
		minHeight: 108,
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
	submitButton: {
		minHeight: 56,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primary,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: trainingTheme.spacing.sm,
	},
	submitButtonDisabled: { backgroundColor: trainingTheme.colors.primarySoft },
	submitText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
	submitTextDisabled: { color: trainingTheme.colors.textMuted },
	submitHint: {
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.textMuted,
		textAlign: 'center',
		marginTop: -trainingTheme.spacing.sm,
	},
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
	sheetContainer: { flex: 1, justifyContent: 'flex-end' },
	sheetBackdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(21, 21, 26, 0.42)',
	},
	sheet: {
		backgroundColor: trainingTheme.colors.surface,
		borderTopLeftRadius: trainingTheme.radius.lg,
		borderTopRightRadius: trainingTheme.radius.lg,
		paddingBottom: trainingTheme.spacing.xxl,
		maxHeight: '76%',
	},
	sheetHandle: {
		width: 44,
		height: 5,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.border,
		alignSelf: 'center',
		marginTop: trainingTheme.spacing.md,
	},
	sheetHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: trainingTheme.spacing.lg,
	},
	sheetTitle: {
		fontSize: 21,
		lineHeight: 27,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	sheetSubtitle: {
		fontSize: 13,
		lineHeight: 18,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	sheetClose: {
		width: trainingTheme.touchTarget,
		height: trainingTheme.touchTarget,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.surfaceMuted,
		alignItems: 'center',
		justifyContent: 'center',
	},
	sheetRow: {
		minHeight: 54,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: trainingTheme.spacing.lg,
	},
	sheetRowText: { fontSize: 15, color: trainingTheme.colors.text },
	sheetSeparator: {
		height: 1,
		backgroundColor: trainingTheme.colors.border,
		marginHorizontal: trainingTheme.spacing.lg,
	},
});

export default InjuryLog;
