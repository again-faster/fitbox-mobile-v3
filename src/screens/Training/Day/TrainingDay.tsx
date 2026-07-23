import { getStoredWSSession } from '@/services/workoutStudio/auth';
import { getMemberWorkouts } from '@/services/workoutStudio/workouts';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackScreenProps } from '@/types/navigation';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import OfflineBanner from '../components/OfflineBanner';
import SkeletonCard from '../components/SkeletonCard';
import TrainingState from '../components/TrainingState';
import { useTrainingConnectivity } from '../hooks/useTrainingConnectivity';
import { normalizeTrainingDate } from './trainingDate';

export { trainingDayTitle } from './trainingDate';

const TrainingDay = ({
	route,
	navigation,
}: TrainingStackScreenProps<'TrainingDay'>) => {
	const date = normalizeTrainingDate(route.params.date);
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const { isOffline, refresh: refreshConnectivity } =
		useTrainingConnectivity();

	const assignments = useQuery({
		queryKey: ['ws-assignments-day', uid, tenantId, date],
		queryFn: () => getMemberWorkouts(tenantId!, date!, date!),
		enabled: !!uid && !!tenantId && !!date,
		staleTime: 60_000,
	});

	const retry = () => {
		void refreshConnectivity();
		void assignments.refetch();
	};

	const content = () => {
		if (!date) {
			return (
				<TrainingState
					kind="error"
					title="That training date isn't valid"
					message="Open the shortcut again or choose a workout from Training."
					actionLabel="Open today's training"
					onAction={() => navigation.replace('TrainingToday')}
				/>
			);
		}

		if (assignments.isLoading) {
			return (
				<>
					<SkeletonCard />
					<SkeletonCard />
				</>
			);
		}

		if (assignments.isError) {
			return (
				<TrainingState
					kind={isOffline ? 'offline' : 'error'}
					title="Training couldn't load"
					message={
						isOffline
							? 'Reconnect to load your assigned workouts.'
							: 'Please try again in a moment.'
					}
					actionLabel="Try again"
					onAction={retry}
				/>
			);
		}

		if (!assignments.data?.length) {
			return (
				<TrainingState
					kind="empty"
					title="No workout assigned"
					message={`There isn't any training scheduled for ${moment(
						date,
					).format('dddd, D MMMM')}.`}
					actionLabel="Browse workouts"
					onAction={() => navigation.navigate('TrainingWorkouts')}
				/>
			);
		}

		return assignments.data.map(assignment => (
			<TouchableOpacity
				key={assignment.id}
				style={styles.workoutCard}
				accessibilityRole="button"
				accessibilityLabel={`Open ${assignment.workouts.name}`}
				onPress={() =>
					navigation.navigate('TrainingWorkoutDetail', {
						workoutId: assignment.workout_id,
						assignmentId:
							assignment.source?.type === 'class'
								? undefined
								: assignment.id,
					})
				}
			>
				<View style={styles.workoutCopy}>
					<Text style={styles.workoutName}>
						{assignment.workouts.name}
					</Text>
					{assignment.workouts.estimated_duration_minutes ? (
						<Text style={styles.meta}>
							~{assignment.workouts.estimated_duration_minutes}{' '}
							min
						</Text>
					) : null}
					{assignment.source?.class_name ? (
						<Text style={styles.meta}>
							{assignment.source.class_name}
						</Text>
					) : null}
					{assignment.notes ? (
						<Text style={styles.notes}>{assignment.notes}</Text>
					) : null}
				</View>
				<Ionicons
					name="chevron-right"
					size={24}
					color={trainingTheme.colors.textMuted}
				/>
			</TouchableOpacity>
		));
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['bottom']}>
			<ScrollView
				contentContainerStyle={styles.container}
				refreshControl={
					<RefreshControl
						refreshing={assignments.isRefetching}
						onRefresh={retry}
					/>
				}
			>
				{isOffline ? <OfflineBanner onRetry={retry} /> : null}
				<View style={styles.heading}>
					<Text style={styles.eyebrow}>YOUR TRAINING</Text>
					<Text style={styles.date}>
						{date
							? moment(date).format('dddd, D MMMM YYYY')
							: 'Unknown date'}
					</Text>
				</View>
				{content()}
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: trainingTheme.colors.background },
	container: {
		padding: trainingTheme.spacing.lg,
		paddingBottom: 40,
		gap: trainingTheme.spacing.md,
	},
	heading: { marginBottom: trainingTheme.spacing.xs },
	eyebrow: {
		color: trainingTheme.colors.primary,
		fontSize: 11,
		fontWeight: '800',
		letterSpacing: 1,
	},
	date: {
		color: trainingTheme.colors.text,
		fontSize: 24,
		fontWeight: '700',
		marginTop: 4,
	},
	workoutCard: {
		alignItems: 'center',
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderLeftColor: trainingTheme.colors.primary,
		borderLeftWidth: 4,
		borderRadius: trainingTheme.radius.md,
		borderWidth: StyleSheet.hairlineWidth,
		flexDirection: 'row',
		minHeight: 96,
		padding: trainingTheme.spacing.lg,
	},
	workoutCopy: { flex: 1, paddingRight: trainingTheme.spacing.sm },
	workoutName: {
		color: trainingTheme.colors.text,
		fontSize: 17,
		fontWeight: '700',
	},
	meta: { color: trainingTheme.colors.textMuted, fontSize: 13, marginTop: 4 },
	notes: { color: trainingTheme.colors.text, fontSize: 13, marginTop: 8 },
});

export default TrainingDay;
