import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { StackScreenProps } from '@react-navigation/stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { useState } from 'react';
import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingBuildSchedule'>;
const QUICK_DATES = [
	{ label: 'Today', days: 0 },
	{ label: 'Tomorrow', days: 1 },
	{ label: 'In 3 days', days: 3 },
	{ label: 'In 1 week', days: 7 },
];

const BuildSchedule = ({ route, navigation }: Props) => {
	const qc = useQueryClient();
	const { workoutId, workoutName } = route.params;
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const [selected, setSelected] = useState<number | null>(null);
	const schedule = useMutation({
		mutationFn: async (days: number) => {
			const scheduledFor = moment()
				.add(days, 'days')
				.format('YYYY-MM-DD');
			await wsApi().post('workout_assignments', {
				json: {
					workout_id: workoutId,
					athlete_id: uid,
					coach_id: uid,
					tenant_id: tenantId,
					due_date: scheduledFor,
					status: 'scheduled',
				},
				headers: { Prefer: 'return=minimal' },
			});
			return scheduledFor;
		},
		onSuccess: scheduledFor => {
			void qc.invalidateQueries({ queryKey: ['ws-assignments'] });
			void qc.invalidateQueries({ queryKey: ['ws-assignments-today'] });
			Alert.alert(
				'Scheduled!',
				`"${workoutName}" added for ${moment(scheduledFor).format('dddd, MMM D')}.`,
				[
					{
						text: 'Done',
						onPress: () => navigation.navigate('TrainingToday'),
					},
				],
			);
		},
		onError: (error: unknown) => {
			Alert.alert(
				'Workout not scheduled',
				error instanceof Error
					? error.message
					: 'Check your connection and try again.',
			);
		},
	});

	return (
		<SafeAreaView style={styles.screen} edges={['top']}>
			<View style={styles.header}>
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityLabel="Go back"
					style={styles.back}
					onPress={() => navigation.goBack()}
				>
					<Ionicons
						name="arrow-left"
						size={24}
						color={trainingTheme.colors.text}
					/>
				</TouchableOpacity>
				<View style={styles.headerCopy}>
					<Text style={styles.title}>Schedule workout</Text>
					<Text style={styles.subtitle}>
						Choose when it should appear in your plan.
					</Text>
				</View>
			</View>
			<View style={styles.container}>
				<View style={styles.workoutCard}>
					<View style={styles.workoutIcon}>
						<Ionicons
							name="calendar-check-outline"
							size={27}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<View style={styles.workoutCopy}>
						<Text style={styles.eyebrow}>WORKOUT</Text>
						<Text style={styles.workoutName}>{workoutName}</Text>
					</View>
				</View>
				<Text style={styles.sectionTitle}>
					When do you want to train?
				</Text>
				<View style={styles.options}>
					{QUICK_DATES.map(({ label, days }) => {
						const active = selected === days;
						return (
							<TouchableOpacity
								key={days}
								accessibilityRole="radio"
								accessibilityState={{ checked: active }}
								style={[
									styles.option,
									active && styles.optionActive,
								]}
								onPress={() => setSelected(days)}
							>
								<View
									style={[
										styles.dateIcon,
										active && styles.dateIconActive,
									]}
								>
									<Ionicons
										name="calendar-blank-outline"
										size={20}
										color={
											active
												? trainingTheme.colors.primary
												: trainingTheme.colors.textMuted
										}
									/>
								</View>
								<View style={styles.optionCopy}>
									<Text
										style={[
											styles.optionLabel,
											active && styles.optionLabelActive,
										]}
									>
										{label}
									</Text>
									<Text style={styles.optionDate}>
										{moment()
											.add(days, 'days')
											.format('dddd, D MMMM')}
									</Text>
								</View>
								<Ionicons
									name={
										active
											? 'radiobox-marked'
											: 'radiobox-blank'
									}
									size={22}
									color={
										active
											? trainingTheme.colors.primary
											: trainingTheme.colors.border
									}
								/>
							</TouchableOpacity>
						);
					})}
				</View>
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityState={{
						disabled: selected === null || schedule.isPending,
					}}
					style={[
						styles.confirm,
						selected === null && styles.confirmDisabled,
					]}
					disabled={selected === null || schedule.isPending}
					onPress={() => {
						if (selected !== null) schedule.mutate(selected);
					}}
				>
					<Text style={styles.confirmLabel}>
						{schedule.isPending
							? 'Scheduling…'
							: 'Confirm schedule'}
					</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	header: {
		minHeight: 92,
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		gap: 12,
	},
	back: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
	},
	headerCopy: { flex: 1 },
	title: {
		color: trainingTheme.colors.text,
		fontSize: 26,
		fontWeight: '700',
	},
	subtitle: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		marginTop: 3,
	},
	container: { flex: 1, padding: 16, paddingBottom: 28, gap: 16 },
	workoutCard: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
		padding: 18,
		borderRadius: 22,
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	workoutIcon: {
		width: 52,
		height: 52,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.surface,
	},
	workoutCopy: { flex: 1 },
	eyebrow: {
		color: trainingTheme.colors.primary,
		fontSize: 11,
		fontWeight: '700',
		letterSpacing: 0.9,
	},
	workoutName: {
		color: trainingTheme.colors.text,
		fontSize: 18,
		fontWeight: '700',
		marginTop: 4,
	},
	sectionTitle: {
		color: trainingTheme.colors.text,
		fontSize: 18,
		fontWeight: '700',
		marginTop: 2,
	},
	options: { gap: 10 },
	option: {
		minHeight: 76,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 14,
		borderRadius: 18,
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
	},
	optionActive: {
		backgroundColor: trainingTheme.colors.primarySoft,
		borderColor: trainingTheme.colors.primary,
	},
	dateIcon: {
		width: 42,
		height: 42,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.background,
	},
	dateIconActive: { backgroundColor: trainingTheme.colors.surface },
	optionCopy: { flex: 1 },
	optionLabel: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '700',
	},
	optionLabelActive: { color: trainingTheme.colors.primary },
	optionDate: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 3,
	},
	confirm: {
		minHeight: 56,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 'auto',
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.primary,
	},
	confirmDisabled: { backgroundColor: trainingTheme.colors.border },
	confirmLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default BuildSchedule;
