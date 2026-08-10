import {
	ActivityIndicator,
	Alert,
	Animated,
	Image,
	PanResponder,
	PermissionsAndroid,
	Platform,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useEffect, useMemo, useRef, useState } from 'react';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Share from 'react-native-share';
import { captureRef, releaseCapture } from 'react-native-view-shot';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { TrainingStackParamList } from '@/types/navigation';
import type { WorkoutResult } from '@/services/workoutStudio/types';
import { wsApi } from '@/services/workoutStudio/api';
import { useWorkoutDetail } from '@/screens/Training/hooks/useWorkoutDetail';
import PrimaryButton from '@/screens/Training/components/PrimaryButton';
import TrainingState from '@/screens/Training/components/TrainingState';
import { trainingTheme } from '@/theme/training';
import {
	buildWorkoutShareDescription,
	formatShareDuration,
	formatShareScore,
	SHARE_DESCRIPTION_MAX_LENGTH,
} from './shareWorkout';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingShareWorkout'>;
type OverlayStyle = 'complete' | 'survived' | 'heavy';
type OverlaySize = 'small' | 'standard' | 'large';

const OVERLAY_SCALES: Record<OverlaySize, number> = {
	small: 0.82,
	standard: 1,
	large: 1.15,
};

const OVERLAY_HEADLINES: Record<OverlayStyle, string> = {
	complete: 'WORKOUT COMPLETE',
	survived: 'WE SURVIVED',
	heavy: 'HEAVY DAY',
};

const OVERLAY_LABELS: Record<OverlayStyle, string> = {
	complete: 'Complete',
	survived: 'We Survived',
	heavy: 'Heavy Day',
};

const getResult = (workoutResultId: string) =>
	wsApi()
		.get('workout_results', {
			searchParams: {
				select: 'id,workout_id,completed_at,duration_seconds,total_volume_kg,subjective_rating,notes,scaling_level,score_time_seconds,score_rounds,score_partial_reps,score_weight_kg,score_reps,workouts(name)',
				id: `eq.${workoutResultId}`,
				limit: '1',
			},
		})
		.json<WorkoutResult[]>()
		.then(rows => rows[0] ?? null);

const requestCameraAccess = async () => {
	if (Platform.OS !== 'android') return true;
	const cameraPermission = PermissionsAndroid.PERMISSIONS.CAMERA;
	if (!cameraPermission) return false;
	const result = await PermissionsAndroid.request(cameraPermission);
	return result === PermissionsAndroid.RESULTS.GRANTED;
};

const ShareWorkoutComposer = ({ route }: Props) => {
	const { width } = useWindowDimensions();
	const canvasRef = useRef<View>(null);
	const descriptionWasInitialised = useRef(false);
	const overlayPosition = useRef(new Animated.ValueXY()).current;
	const [photoUri, setPhotoUri] = useState<string | null>(null);
	const [description, setDescription] = useState('');
	const [overlayStyle, setOverlayStyle] = useState<OverlayStyle>('survived');
	const [overlaySize, setOverlaySize] = useState<OverlaySize>('standard');
	const [showScore, setShowScore] = useState(false);
	const [showDuration, setShowDuration] = useState(false);
	const [showScaling, setShowScaling] = useState(false);
	const [showVolume, setShowVolume] = useState(false);
	const [showDate, setShowDate] = useState(false);
	const [isSharing, setIsSharing] = useState(false);

	const result = useQuery({
		queryKey: ['ws-share-result', route.params.workoutResultId],
		queryFn: () => getResult(route.params.workoutResultId),
	});
	const workout = useWorkoutDetail(result.data?.workout_id ?? '');

	useEffect(() => {
		if (!workout.data || descriptionWasInitialised.current) return;
		setDescription(buildWorkoutShareDescription(workout.data));
		descriptionWasInitialised.current = true;
	}, [workout.data]);

	const panResponder = useMemo(
		() =>
			PanResponder.create({
				onStartShouldSetPanResponder: () => true,
				onMoveShouldSetPanResponder: () => true,
				onPanResponderGrant: () => {
					overlayPosition.extractOffset();
				},
				onPanResponderMove: Animated.event(
					[null, { dx: overlayPosition.x, dy: overlayPosition.y }],
					{ useNativeDriver: false },
				),
				onPanResponderRelease: () => {
					overlayPosition.flattenOffset();
				},
			}),
		[overlayPosition],
	);

	const selectPhoto = async () => {
		const response = await launchImageLibrary({
			mediaType: 'photo',
			selectionLimit: 1,
			quality: 0.9,
			maxWidth: 1800,
			maxHeight: 1800,
		});
		if (response.errorMessage) {
			Alert.alert('Photo unavailable', response.errorMessage);
			return;
		}
		const uri = response.assets?.[0]?.uri;
		if (uri) setPhotoUri(uri);
	};

	const takePhoto = async () => {
		if (!(await requestCameraAccess())) {
			Alert.alert(
				'Camera permission needed',
				'Allow camera access to take a post-workout group photo.',
			);
			return;
		}
		const response = await launchCamera({
			mediaType: 'photo',
			quality: 0.9,
			maxWidth: 1800,
			maxHeight: 1800,
			saveToPhotos: false,
		});
		if (response.errorMessage) {
			Alert.alert('Camera unavailable', response.errorMessage);
			return;
		}
		const uri = response.assets?.[0]?.uri;
		if (uri) setPhotoUri(uri);
	};

	const shareImage = async () => {
		if (!canvasRef.current || !result.data) return;
		setIsSharing(true);
		let capturedUri: string | null = null;
		try {
			capturedUri = await captureRef(canvasRef, {
				format: 'png',
				quality: 1,
				result: 'tmpfile',
				width: 1080,
				height: 1350,
			});
			await Share.open({
				url: capturedUri.startsWith('file://')
					? capturedUri
					: `file://${capturedUri}`,
				type: 'image/png',
				title: `Share ${result.data.workouts.name}`,
				failOnCancel: false,
			});
		} catch (error) {
			Alert.alert(
				'Could not share image',
				error instanceof Error ? error.message : 'Please try again.',
			);
		} finally {
			if (capturedUri) releaseCapture(capturedUri);
			setIsSharing(false);
		}
	};

	if (result.isLoading || (result.data && workout.isLoading)) {
		return (
			<View style={styles.loading}>
				<ActivityIndicator
					size="large"
					color={trainingTheme.colors.primary}
				/>
			</View>
		);
	}

	if (result.isError || !result.data) {
		return (
			<View style={styles.loading}>
				<TrainingState
					kind="error"
					title="Workout couldn't load"
					message="Return to your result and try sharing again."
				/>
			</View>
		);
	}

	const score = formatShareScore(result.data);
	const previewWidth = Math.min(width - trainingTheme.spacing.lg * 2, 430);
	const previewHeight = previewWidth * 1.25;
	const scale = OVERLAY_SCALES[overlaySize];

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
			keyboardShouldPersistTaps="handled"
		>
			<View style={styles.intro}>
				<Text style={styles.title}>Share the effort</Text>
				<Text style={styles.subtitle}>
					Get the crew together, add the workout, and celebrate the
					session.
				</Text>
			</View>

			<View
				style={[
					styles.previewFrame,
					{ width: previewWidth, height: previewHeight },
				]}
			>
				<View
					collapsable={false}
					ref={canvasRef}
					style={styles.captureCanvas}
				>
					{photoUri ? (
						<Image
							source={{ uri: photoUri }}
							resizeMode="cover"
							style={StyleSheet.absoluteFillObject}
						/>
					) : null}
					<Animated.View
						accessibilityLabel="Workout share overlay. Drag to reposition."
						{...panResponder.panHandlers}
						style={[
							styles.overlay,
							styles[`overlay_${overlayStyle}`],
							{
								transform: [
									...overlayPosition.getTranslateTransform(),
									{ scale },
								],
							},
						]}
					>
						<Text
							style={[
								styles.eyebrow,
								styles[`text_${overlayStyle}`],
							]}
						>
							{OVERLAY_HEADLINES[overlayStyle]}
						</Text>
						<Text
							style={[
								styles.workoutName,
								styles[`text_${overlayStyle}`],
							]}
						>
							{result.data.workouts.name}
						</Text>
						{description ? (
							<Text
								style={[
									styles.description,
									styles[`muted_${overlayStyle}`],
								]}
								numberOfLines={3}
							>
								{description}
							</Text>
						) : null}
						<View style={styles.statsRow}>
							{showScore && score ? (
								<OverlayStat label="Score" value={score} />
							) : null}
							{showDuration &&
							result.data.duration_seconds != null ? (
								<OverlayStat
									label="Duration"
									value={formatShareDuration(
										result.data.duration_seconds,
									)}
								/>
							) : null}
							{showVolume &&
							result.data.total_volume_kg != null ? (
								<OverlayStat
									label="Volume"
									value={`${result.data.total_volume_kg.toLocaleString()} kg`}
								/>
							) : null}
						</View>
						<View style={styles.footerRow}>
							<Text style={styles.brand}>fitbox</Text>
							{showScaling && result.data.scaling_level ? (
								<Text style={styles.footerText}>
									{result.data.scaling_level === 'rx'
										? 'Rx'
										: result.data.scaling_level}
								</Text>
							) : null}
							{showDate ? (
								<Text style={styles.footerText}>
									{moment(result.data.completed_at).format(
										'D MMM YYYY',
									)}
								</Text>
							) : null}
						</View>
					</Animated.View>
				</View>
				{!photoUri ? (
					<View pointerEvents="none" style={styles.emptyPhotoHint}>
						<Ionicons
							name="camera-plus-outline"
							size={38}
							color={trainingTheme.colors.textMuted}
						/>
						<Text style={styles.emptyPhotoText}>
							Add a group photo or share the sticker by itself
						</Text>
					</View>
				) : null}
			</View>

			<View style={styles.photoActions}>
				<ActionButton
					icon="camera-outline"
					label="Take photo"
					onPress={() => void takePhoto()}
				/>
				<ActionButton
					icon="image-outline"
					label="Choose photo"
					onPress={() => void selectPhoto()}
				/>
				{photoUri ? (
					<ActionButton
						icon="sticker-outline"
						label="Sticker only"
						onPress={() => setPhotoUri(null)}
					/>
				) : null}
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Workout description</Text>
				<TextInput
					accessibilityLabel="Workout description"
					value={description}
					onChangeText={setDescription}
					placeholder="For example: 100 x Deadlift"
					placeholderTextColor={trainingTheme.colors.textMuted}
					maxLength={SHARE_DESCRIPTION_MAX_LENGTH}
					multiline
					style={styles.descriptionInput}
				/>
				<Text style={styles.helperText}>
					Generated from the workout name and member-visible sections.
					You can edit or remove it.
				</Text>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Style</Text>
				<View style={styles.choiceRow}>
					{(['survived', 'complete', 'heavy'] as OverlayStyle[]).map(
						style => (
							<ChoiceButton
								key={style}
								active={overlayStyle === style}
								label={OVERLAY_LABELS[style]}
								onPress={() => setOverlayStyle(style)}
							/>
						),
					)}
				</View>
				<Text style={[styles.sectionTitle, styles.sizeTitle]}>
					Size
				</Text>
				<View style={styles.choiceRow}>
					{(['small', 'standard', 'large'] as OverlaySize[]).map(
						size => (
							<ChoiceButton
								key={size}
								active={overlaySize === size}
								label={
									size.charAt(0).toUpperCase() + size.slice(1)
								}
								onPress={() => setOverlaySize(size)}
							/>
						),
					)}
				</View>
			</View>

			<View style={styles.section}>
				<Text style={styles.sectionTitle}>Optional details</Text>
				{score ? (
					<ToggleRow
						label="Score"
						value={showScore}
						onChange={setShowScore}
					/>
				) : null}
				{result.data.duration_seconds != null ? (
					<ToggleRow
						label="Duration"
						value={showDuration}
						onChange={setShowDuration}
					/>
				) : null}
				{result.data.scaling_level ? (
					<ToggleRow
						label="Rx / scaling"
						value={showScaling}
						onChange={setShowScaling}
					/>
				) : null}
				{result.data.total_volume_kg != null ? (
					<ToggleRow
						label="Total volume"
						value={showVolume}
						onChange={setShowVolume}
					/>
				) : null}
				<ToggleRow
					label="Date"
					value={showDate}
					onChange={setShowDate}
				/>
			</View>

			<PrimaryButton
				disabled={isSharing}
				label={isSharing ? 'Preparing image…' : 'Share image'}
				onPress={() => void shareImage()}
			/>
		</ScrollView>
	);
};

const OverlayStat = ({ label, value }: { label: string; value: string }) => (
	<View style={styles.overlayStat}>
		<Text style={styles.overlayStatValue}>{value}</Text>
		<Text style={styles.overlayStatLabel}>{label}</Text>
	</View>
);

const ActionButton = ({
	icon,
	label,
	onPress,
}: {
	icon: string;
	label: string;
	onPress: () => void;
}) => (
	<TouchableOpacity
		accessibilityRole="button"
		onPress={onPress}
		style={styles.actionButton}
	>
		<Ionicons name={icon} size={20} color={trainingTheme.colors.primary} />
		<Text style={styles.actionLabel}>{label}</Text>
	</TouchableOpacity>
);

const ChoiceButton = ({
	active,
	label,
	onPress,
}: {
	active: boolean;
	label: string;
	onPress: () => void;
}) => (
	<TouchableOpacity
		accessibilityRole="button"
		accessibilityState={{ selected: active }}
		onPress={onPress}
		style={[styles.choiceButton, active && styles.choiceButtonActive]}
	>
		<Text style={[styles.choiceLabel, active && styles.choiceLabelActive]}>
			{label}
		</Text>
	</TouchableOpacity>
);

const ToggleRow = ({
	label,
	value,
	onChange,
}: {
	label: string;
	value: boolean;
	onChange: (value: boolean) => void;
}) => (
	<View style={styles.toggleRow}>
		<Text style={styles.toggleLabel}>{label}</Text>
		<Switch
			accessibilityLabel={`Include ${label}`}
			value={value}
			onValueChange={onChange}
			trackColor={{ false: trainingTheme.colors.border, true: trainingTheme.colors.primarySoft }}
			thumbColor={value ? trainingTheme.colors.primary : trainingTheme.colors.surface}
		/>
	</View>
);

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	container: {
		alignItems: 'center',
		padding: trainingTheme.spacing.lg,
		paddingBottom: 48,
		gap: trainingTheme.spacing.lg,
	},
	loading: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.background,
	},
	intro: { width: '100%', gap: 5 },
	title: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 25,
		fontWeight: '800',
	},
	subtitle: {
		color: trainingTheme.colors.textMuted,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		lineHeight: 20,
	},
	previewFrame: {
		borderRadius: trainingTheme.radius.lg,
		overflow: 'hidden',
		backgroundColor: '#D9DCE3',
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
	},
	captureCanvas: { flex: 1, backgroundColor: 'transparent' },
	emptyPhotoHint: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 50,
		gap: 10,
	},
	emptyPhotoText: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		fontWeight: '600',
		lineHeight: 18,
		textAlign: 'center',
	},
	overlay: {
		position: 'absolute',
		left: 18,
		right: 18,
		bottom: 20,
		borderRadius: 18,
		padding: 17,
		shadowColor: '#000000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.24,
		shadowRadius: 10,
		elevation: 7,
	},
	overlay_complete: { backgroundColor: 'rgba(13, 18, 28, 0.88)' },
	overlay_survived: { backgroundColor: 'rgba(24, 38, 91, 0.91)' },
	overlay_heavy: { backgroundColor: 'rgba(49, 39, 24, 0.94)' },
	text_complete: { color: '#FFFFFF' },
	text_survived: { color: '#FFFFFF' },
	text_heavy: { color: '#FFFFFF' },
	muted_complete: { color: '#D7DAE0' },
	muted_survived: { color: '#D8E0FF' },
	muted_heavy: { color: '#E9DDC4' },
	eyebrow: {
		fontFamily: 'Inter-Variable',
		fontSize: 10,
		fontWeight: '900',
		letterSpacing: 1.5,
		marginBottom: 5,
	},
	workoutName: {
		fontFamily: 'Inter-Variable',
		fontSize: 22,
		fontWeight: '900',
		letterSpacing: -0.4,
	},
	description: {
		fontFamily: 'Inter-Variable',
		fontSize: 13,
		fontWeight: '600',
		lineHeight: 18,
		marginTop: 4,
	},
	statsRow: { flexDirection: 'row', gap: 18, marginTop: 13 },
	overlayStat: { gap: 1 },
	overlayStatValue: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
	overlayStatLabel: { color: '#CCD2E0', fontSize: 9, fontWeight: '700' },
	footerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 9,
		marginTop: 12,
	},
	brand: {
		color: '#FFFFFF',
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		fontWeight: '900',
		letterSpacing: -0.4,
		marginRight: 'auto',
	},
	footerText: {
		color: '#FFFFFF',
		fontSize: 10,
		fontWeight: '700',
		textTransform: 'capitalize',
	},
	photoActions: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'center',
		gap: trainingTheme.spacing.sm,
	},
	actionButton: {
		minHeight: 48,
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		borderRadius: trainingTheme.radius.sm,
		backgroundColor: trainingTheme.colors.surface,
		padding: 7,
		gap: 3,
	},
	actionLabel: {
		color: trainingTheme.colors.text,
		fontSize: 11,
		fontWeight: '700',
		textAlign: 'center',
	},
	section: {
		width: '100%',
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		padding: trainingTheme.spacing.md,
	},
	sectionTitle: {
		color: trainingTheme.colors.text,
		fontFamily: 'Inter-Variable',
		fontSize: 14,
		fontWeight: '800',
		marginBottom: 10,
	},
	sizeTitle: { marginTop: 16 },
	descriptionInput: {
		minHeight: 72,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: trainingTheme.radius.sm,
		backgroundColor: trainingTheme.colors.background,
		color: trainingTheme.colors.text,
		fontSize: 14,
		lineHeight: 20,
		padding: 11,
		textAlignVertical: 'top',
	},
	helperText: {
		color: trainingTheme.colors.textMuted,
		fontSize: 11,
		lineHeight: 16,
		marginTop: 7,
	},
	choiceRow: { flexDirection: 'row', gap: 7 },
	choiceButton: {
		flex: 1,
		minHeight: 42,
		alignItems: 'center',
		justifyContent: 'center',
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: trainingTheme.radius.sm,
		paddingHorizontal: 6,
	},
	choiceButtonActive: {
		borderColor: trainingTheme.colors.primary,
		backgroundColor: trainingTheme.colors.primary,
	},
	choiceLabel: {
		color: trainingTheme.colors.text,
		fontSize: 11,
		fontWeight: '700',
		textAlign: 'center',
	},
	choiceLabelActive: { color: '#FFFFFF' },
	toggleRow: {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderTopColor: trainingTheme.colors.border,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	toggleLabel: {
		color: trainingTheme.colors.text,
		fontSize: 14,
		fontWeight: '600',
	},
});

export default ShareWorkoutComposer;
