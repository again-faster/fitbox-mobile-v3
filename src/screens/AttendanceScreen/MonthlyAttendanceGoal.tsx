import {
	MemberCard,
	MemberPill,
	MemberProgressRing,
} from '@/components/member';
import { Text } from '@/components/atoms';
import { mmkvStorage } from '@/storage';
import { memberTheme } from '@/theme/member';
import { useEffect, useState } from 'react';
import {
	Modal,
	Pressable,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import Confetti from '../Training/components/Confetti';

const SUGGESTED_GOALS = [4, 8, 12, 16];
const DEFAULT_GOAL = 8;
const MIN_GOAL = 1;
const MAX_GOAL = 31;

interface MonthlyAttendanceGoalProps {
	attendanceCount: number;
	gymId: number;
	memberId?: number;
}

interface ActionButtonProps {
	label: string;
	onPress: () => void;
	secondary?: boolean;
	danger?: boolean;
}

const ActionButton = ({
	label,
	onPress,
	secondary = false,
	danger = false,
}: ActionButtonProps) => (
	<TouchableOpacity
		style={[
			styles.actionButton,
			secondary && styles.actionButtonSecondary,
			danger && styles.actionButtonDanger,
		]}
		onPress={onPress}
		activeOpacity={0.85}
		accessibilityRole="button"
		accessibilityLabel={label}
	>
		<Text
			bold
			style={[
				styles.actionButtonLabel,
				secondary && styles.actionButtonLabelSecondary,
				danger && styles.actionButtonLabelDanger,
			]}
		>
			{label}
		</Text>
	</TouchableOpacity>
);

const MonthlyAttendanceGoal = ({
	attendanceCount,
	gymId,
	memberId,
}: MonthlyAttendanceGoalProps) => {
	const [goal, setGoal] = useState<number | null>(null);
	const [draftGoal, setDraftGoal] = useState(DEFAULT_GOAL);
	const [isReady, setIsReady] = useState(false);
	const [showEditor, setShowEditor] = useState(false);
	const [showCelebration, setShowCelebration] = useState(false);

	const now = new Date();
	const monthId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
		2,
		'0',
	)}`;
	const monthName = now.toLocaleString('en-AU', { month: 'long' });
	const storageScope = `${gymId}:${memberId ?? 'unknown'}`;
	const goalKey = `attendanceGoal:v1:${storageScope}`;
	const celebratedKey = `attendanceGoalCelebrated:v1:${storageScope}:${monthId}`;

	useEffect(() => {
		if (!memberId || !gymId) {
			setGoal(null);
			setIsReady(false);
			return;
		}

		const savedGoal = mmkvStorage.getNumber(goalKey);
		const validGoal =
			savedGoal && savedGoal >= MIN_GOAL && savedGoal <= MAX_GOAL
				? savedGoal
				: null;

		setGoal(validGoal);
		setDraftGoal(validGoal ?? DEFAULT_GOAL);
		setShowCelebration(false);
		setIsReady(true);
	}, [goalKey, gymId, memberId]);

	useEffect(() => {
		if (
			!isReady ||
			!goal ||
			attendanceCount < goal ||
			mmkvStorage.getBoolean(celebratedKey)
		) {
			return;
		}

		mmkvStorage.set(celebratedKey, true);
		setShowCelebration(true);
	}, [attendanceCount, celebratedKey, goal, isReady]);

	if (!isReady) return null;

	const achieved = goal !== null && attendanceCount >= goal;
	const remaining = goal === null ? 0 : Math.max(goal - attendanceCount, 0);
	const progress = goal === null ? 0 : Math.min(attendanceCount / goal, 1);

	const openEditor = () => {
		setDraftGoal(goal ?? DEFAULT_GOAL);
		setShowEditor(true);
	};

	const saveGoal = () => {
		const nextGoal = Math.min(Math.max(draftGoal, MIN_GOAL), MAX_GOAL);
		mmkvStorage.set(goalKey, nextGoal);
		if (attendanceCount < nextGoal) {
			mmkvStorage.delete(celebratedKey);
		}
		setGoal(nextGoal);
		setShowEditor(false);
	};

	const removeGoal = () => {
		mmkvStorage.delete(goalKey);
		setGoal(null);
		setShowEditor(false);
	};

	return (
		<>
			<View style={styles.heroCard}>
				<View style={styles.glowLarge} />
				<View style={styles.glowSmall} />
				{goal === null ? (
					<View style={styles.emptyContent}>
						<View style={styles.eyebrowPill}>
							<Text bold style={styles.eyebrowText}>
								MONTHLY ROUTINE
							</Text>
						</View>
						<Text bold style={styles.heroTitle}>
							Make consistency your new personal best.
						</Text>
						<Text style={styles.heroBody}>
							Choose how often you want to train and follow your
							progress throughout the month.
						</Text>
						<TouchableOpacity
							style={styles.heroAction}
							onPress={openEditor}
							activeOpacity={0.85}
							accessibilityRole="button"
						>
							<Text bold style={styles.heroActionText}>
								Set monthly goal
							</Text>
							<Icon
								name="arrow-top-right"
								size={20}
								color={memberTheme.colors.ink}
							/>
						</TouchableOpacity>
					</View>
				) : (
					<>
						<View style={styles.heroHeader}>
							<View>
								<Text bold style={styles.eyebrowTextLight}>
									YOUR CONSISTENCY
								</Text>
								<Text
									bold
									style={styles.goalTitle}
								>{`${monthName} goal`}</Text>
							</View>
							<TouchableOpacity
								style={styles.editPill}
								onPress={openEditor}
								accessibilityRole="button"
								accessibilityLabel="Edit monthly attendance goal"
							>
								<Icon
									name="pencil-outline"
									size={17}
									color="#FFFFFF"
								/>
								<Text bold style={styles.editLabel}>
									Edit
								</Text>
							</TouchableOpacity>
						</View>
						<View style={styles.goalContent}>
							<MemberProgressRing
								progress={progress}
								size={156}
								strokeWidth={12}
								trackColor="rgba(255,255,255,0.22)"
								progressColor="#FFFFFF"
							>
								<Text bold style={styles.ringValue}>
									{attendanceCount}
								</Text>
								<Text
									style={styles.ringLabel}
								>{`of ${goal} visits`}</Text>
							</MemberProgressRing>
							<View style={styles.goalMessage}>
								<Icon
									name={
										achieved
											? 'trophy-outline'
											: 'lightning-bolt-outline'
									}
									size={24}
									color="#FFFFFF"
								/>
								<Text bold style={styles.goalMessageTitle}>
									{achieved ? 'Goal achieved' : 'Keep moving'}
								</Text>
								<Text style={styles.goalMessageBody}>
									{achieved
										? 'You showed up for yourself this month.'
										: `${remaining} ${remaining === 1 ? 'visit' : 'visits'} to reach your goal.`}
								</Text>
							</View>
						</View>
					</>
				)}
			</View>

			<Modal
				visible={showEditor}
				transparent
				animationType="slide"
				onRequestClose={() => setShowEditor(false)}
			>
				<View style={styles.modalRoot}>
					<Pressable
						style={styles.modalBackdrop}
						onPress={() => setShowEditor(false)}
						accessibilityLabel="Close goal editor"
					/>
					<View style={styles.editorSheet}>
						<View style={styles.sheetHandle} />
						<Text bold style={styles.sheetTitle}>
							Set your monthly rhythm
						</Text>
						<Text style={styles.sheetBody}>
							Choose a target that feels motivating and realistic.
							It will repeat each month.
						</Text>
						<View style={styles.suggestions}>
							{SUGGESTED_GOALS.map(value => (
								<MemberPill
									key={value}
									label={`${value} visits`}
									selected={draftGoal === value}
									onPress={() => setDraftGoal(value)}
								/>
							))}
						</View>
						<View style={styles.stepperCard}>
							<TouchableOpacity
								style={styles.stepperButton}
								onPress={() =>
									setDraftGoal(value =>
										Math.max(MIN_GOAL, value - 1),
									)
								}
								disabled={draftGoal === MIN_GOAL}
								accessibilityRole="button"
								accessibilityLabel="Decrease monthly goal"
							>
								<Icon
									name="minus"
									size={24}
									color={memberTheme.colors.ink}
								/>
							</TouchableOpacity>
							<View style={styles.stepperValue}>
								<Text bold style={styles.draftValue}>
									{draftGoal}
								</Text>
								<Text style={styles.draftLabel}>
									visits per month
								</Text>
							</View>
							<TouchableOpacity
								style={styles.stepperButton}
								onPress={() =>
									setDraftGoal(value =>
										Math.min(MAX_GOAL, value + 1),
									)
								}
								disabled={draftGoal === MAX_GOAL}
								accessibilityRole="button"
								accessibilityLabel="Increase monthly goal"
							>
								<Icon
									name="plus"
									size={24}
									color={memberTheme.colors.ink}
								/>
							</TouchableOpacity>
						</View>
						<ActionButton label="Save goal" onPress={saveGoal} />
						{goal !== null && (
							<ActionButton
								label="Remove goal"
								onPress={removeGoal}
								secondary
								danger
							/>
						)}
					</View>
				</View>
			</Modal>

			<Modal
				visible={showCelebration}
				transparent
				animationType="fade"
				onRequestClose={() => setShowCelebration(false)}
			>
				<View style={[styles.modalRoot, styles.celebrationRoot]}>
					<Confetti />
					<MemberCard style={styles.celebrationCard}>
						<View style={styles.trophyCircle}>
							<Icon
								name="trophy-outline"
								size={42}
								color={memberTheme.colors.primary}
							/>
						</View>
						<Text bold style={styles.celebrationTitle}>
							Goal achieved!
						</Text>
						<Text style={styles.celebrationBody}>
							{`You reached your ${monthName} goal of ${goal ?? 0} visits.`}
						</Text>
						<ActionButton
							label="Continue"
							onPress={() => setShowCelebration(false)}
						/>
					</MemberCard>
				</View>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	heroCard: {
		minHeight: 280,
		backgroundColor: memberTheme.colors.primary,
		borderRadius: memberTheme.radius.xl,
		padding: memberTheme.spacing.xl,
		marginBottom: memberTheme.spacing.xl,
		overflow: 'hidden',
		...memberTheme.shadow,
	},
	glowLarge: {
		position: 'absolute',
		width: 260,
		height: 260,
		borderRadius: 130,
		backgroundColor: 'rgba(255,255,255,0.11)',
		top: -110,
		right: -90,
	},
	glowSmall: {
		position: 'absolute',
		width: 150,
		height: 150,
		borderRadius: 75,
		backgroundColor: 'rgba(95,34,96,0.20)',
		bottom: -70,
		left: -45,
	},
	emptyContent: {
		flex: 1,
		justifyContent: 'space-between',
	},
	eyebrowPill: {
		alignSelf: 'flex-start',
		backgroundColor: 'rgba(255,255,255,0.18)',
		paddingHorizontal: memberTheme.spacing.md,
		paddingVertical: memberTheme.spacing.sm,
		borderRadius: memberTheme.radius.pill,
	},
	eyebrowText: {
		fontSize: 10,
		letterSpacing: 1.2,
		color: '#FFFFFF',
	},
	heroTitle: {
		fontSize: 29,
		lineHeight: 34,
		color: '#FFFFFF',
		maxWidth: 310,
		marginTop: memberTheme.spacing.lg,
	},
	heroBody: {
		fontSize: 14,
		lineHeight: 21,
		color: 'rgba(255,255,255,0.82)',
		marginVertical: memberTheme.spacing.lg,
		maxWidth: 315,
	},
	heroAction: {
		alignSelf: 'flex-start',
		flexDirection: 'row',
		alignItems: 'center',
		gap: memberTheme.spacing.sm,
		backgroundColor: '#FFFFFF',
		paddingHorizontal: memberTheme.spacing.lg,
		minHeight: 48,
		borderRadius: memberTheme.radius.pill,
	},
	heroActionText: {
		color: memberTheme.colors.ink,
	},
	heroHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
	},
	eyebrowTextLight: {
		fontSize: 10,
		letterSpacing: 1.1,
		color: 'rgba(255,255,255,0.72)',
	},
	goalTitle: {
		fontSize: 24,
		lineHeight: 30,
		color: '#FFFFFF',
		marginTop: memberTheme.spacing.xs,
	},
	editPill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: memberTheme.spacing.xs,
		backgroundColor: 'rgba(255,255,255,0.16)',
		paddingVertical: memberTheme.spacing.sm,
		paddingHorizontal: memberTheme.spacing.md,
		borderRadius: memberTheme.radius.pill,
	},
	editLabel: {
		fontSize: 12,
		color: '#FFFFFF',
	},
	goalContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: memberTheme.spacing.lg,
	},
	ringValue: {
		fontSize: 38,
		lineHeight: 42,
		color: '#FFFFFF',
	},
	ringLabel: {
		fontSize: 12,
		color: 'rgba(255,255,255,0.78)',
	},
	goalMessage: {
		flex: 1,
		paddingLeft: memberTheme.spacing.lg,
	},
	goalMessageTitle: {
		fontSize: 18,
		lineHeight: 23,
		color: '#FFFFFF',
		marginTop: memberTheme.spacing.sm,
	},
	goalMessageBody: {
		fontSize: 12,
		lineHeight: 18,
		color: 'rgba(255,255,255,0.78)',
		marginTop: memberTheme.spacing.xs,
	},
	modalRoot: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'rgba(21,21,26,0.48)',
	},
	modalBackdrop: {
		...StyleSheet.absoluteFillObject,
	},
	editorSheet: {
		backgroundColor: memberTheme.colors.background,
		borderTopLeftRadius: memberTheme.radius.xl,
		borderTopRightRadius: memberTheme.radius.xl,
		paddingHorizontal: memberTheme.spacing.xl,
		paddingTop: memberTheme.spacing.md,
		paddingBottom: memberTheme.spacing.xxl,
	},
	sheetHandle: {
		width: 44,
		height: 5,
		borderRadius: 3,
		backgroundColor: memberTheme.colors.border,
		alignSelf: 'center',
		marginBottom: memberTheme.spacing.xl,
	},
	sheetTitle: {
		fontSize: 26,
		lineHeight: 32,
		color: memberTheme.colors.ink,
	},
	sheetBody: {
		fontSize: 14,
		lineHeight: 21,
		color: memberTheme.colors.textMuted,
		marginTop: memberTheme.spacing.sm,
	},
	suggestions: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: memberTheme.spacing.sm,
		marginVertical: memberTheme.spacing.xl,
	},
	stepperCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.lg,
		padding: memberTheme.spacing.lg,
		marginBottom: memberTheme.spacing.xl,
		borderWidth: 1,
		borderColor: memberTheme.colors.border,
	},
	stepperButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: memberTheme.colors.surfaceSoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepperValue: {
		alignItems: 'center',
	},
	draftValue: {
		fontSize: 44,
		lineHeight: 48,
		color: memberTheme.colors.ink,
	},
	draftLabel: {
		fontSize: 12,
		color: memberTheme.colors.textMuted,
	},
	actionButton: {
		minHeight: 54,
		borderRadius: memberTheme.radius.pill,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.ink,
		marginTop: memberTheme.spacing.sm,
	},
	actionButtonSecondary: {
		backgroundColor: 'transparent',
		borderWidth: 1,
		borderColor: memberTheme.colors.border,
	},
	actionButtonDanger: {
		borderColor: memberTheme.colors.danger,
	},
	actionButtonLabel: {
		color: '#FFFFFF',
	},
	actionButtonLabelSecondary: {
		color: memberTheme.colors.ink,
	},
	actionButtonLabelDanger: {
		color: memberTheme.colors.danger,
	},
	celebrationRoot: {
		justifyContent: 'center',
		paddingHorizontal: memberTheme.spacing.xl,
	},
	celebrationCard: {
		padding: memberTheme.spacing.xl,
		alignItems: 'center',
	},
	trophyCircle: {
		width: 86,
		height: 86,
		borderRadius: 43,
		backgroundColor: memberTheme.colors.surfaceSoft,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: memberTheme.spacing.lg,
	},
	celebrationTitle: {
		fontSize: 28,
		lineHeight: 34,
		color: memberTheme.colors.ink,
		textAlign: 'center',
	},
	celebrationBody: {
		fontSize: 14,
		lineHeight: 21,
		color: memberTheme.colors.textMuted,
		textAlign: 'center',
		marginVertical: memberTheme.spacing.md,
	},
});

export default MonthlyAttendanceGoal;
