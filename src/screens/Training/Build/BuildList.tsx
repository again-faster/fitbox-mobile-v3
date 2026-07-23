import {
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
/* eslint-disable no-nested-ternary */
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { PersonalWorkout } from '@/services/workoutStudio/types';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';
import SkeletonCard from '../components/SkeletonCard';
import TrainingState from '../components/TrainingState';

type Nav = StackNavigationProp<TrainingStackParamList>;

const BuildList = () => {
	const nav = useNavigation<Nav>();
	const uid = getStoredWSSession()?.user.id;
	const workouts = useQuery({
		queryKey: ['ws-personal-workouts', uid],
		queryFn: () =>
			wsApi()
				.get('workouts', {
					searchParams: {
						select: 'id,name,description,est_duration_min,created_at',
						created_by: `eq.${uid}`,
						visibility: 'eq.personal',
						order: 'created_at.desc',
					},
				})
				.json<PersonalWorkout[]>(),
		enabled: !!uid,
		staleTime: 60_000,
	});
	const createWorkout = () => nav.navigate('TrainingBuildEditor', {});

	return (
		<SafeAreaView style={styles.screen} edges={['top']}>
			<View style={styles.header}>
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityLabel="Go back"
					style={styles.back}
					onPress={() => nav.goBack()}
				>
					<Ionicons
						name="arrow-left"
						size={24}
						color={trainingTheme.colors.text}
					/>
				</TouchableOpacity>
				<View style={styles.headerCopy}>
					<Text style={styles.title}>My workouts</Text>
					<Text style={styles.subtitle}>
						Build sessions that fit your goals.
					</Text>
				</View>
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityLabel="Build a workout"
					style={styles.headerAdd}
					onPress={createWorkout}
				>
					<Ionicons
						name="plus"
						size={23}
						color={trainingTheme.colors.primary}
					/>
				</TouchableOpacity>
			</View>
			<FlatList
				data={workouts.data ?? []}
				keyExtractor={item => item.id}
				contentContainerStyle={styles.container}
				refreshControl={
					<RefreshControl
						refreshing={workouts.isRefetching}
						onRefresh={() => {
							void workouts.refetch();
						}}
						tintColor={trainingTheme.colors.primary}
					/>
				}
				ListEmptyComponent={
					workouts.isLoading ? (
						<View style={styles.loading}>
							<SkeletonCard />
							<SkeletonCard />
						</View>
					) : workouts.isError ? (
						<TrainingState
							kind="error"
							title="Your workouts couldn't load"
							message="Check your connection and try again."
							actionLabel="Try again"
							onAction={() => {
								void workouts.refetch();
							}}
						/>
					) : (
						<View style={styles.emptyCard}>
							<View style={styles.emptyIcon}>
								<Ionicons
									name="dumbbell"
									size={34}
									color={trainingTheme.colors.primary}
								/>
							</View>
							<Text style={styles.emptyTitle}>
								Create your first workout
							</Text>
							<Text style={styles.emptySub}>
								Build it your way, save it here, then schedule
								or start it whenever you are ready.
							</Text>
							<TouchableOpacity
								accessibilityRole="button"
								style={styles.primaryButton}
								onPress={createWorkout}
							>
								<Ionicons
									name="plus"
									size={20}
									color="#FFFFFF"
								/>
								<Text style={styles.primaryLabel}>
									Build a workout
								</Text>
							</TouchableOpacity>
						</View>
					)
				}
				renderItem={({ item }) => (
					<View style={styles.card}>
						<TouchableOpacity
							style={styles.cardMain}
							onPress={() =>
								nav.navigate('TrainingWorkoutDetail', {
									workoutId: item.id,
								})
							}
						>
							<View style={styles.workoutIcon}>
								<Ionicons
									name="dumbbell"
									size={21}
									color={trainingTheme.colors.primary}
								/>
							</View>
							<View style={styles.cardCopy}>
								<Text style={styles.cardName}>{item.name}</Text>
								<Text style={styles.cardMeta}>
									{item.est_duration_min
										? `About ${item.est_duration_min} min · `
										: ''}
									{moment(item.created_at).fromNow()}
								</Text>
							</View>
						</TouchableOpacity>
						<View style={styles.actions}>
							<TouchableOpacity
								accessibilityRole="button"
								accessibilityLabel={`Schedule ${item.name}`}
								style={styles.iconButton}
								onPress={() =>
									nav.navigate('TrainingBuildSchedule', {
										workoutId: item.id,
										workoutName: item.name,
									})
								}
							>
								<Ionicons
									name="calendar-plus"
									size={20}
									color={trainingTheme.colors.primary}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								accessibilityRole="button"
								style={styles.runButton}
								onPress={() =>
									nav.navigate('TrainingRunWorkout', {
										workoutId: item.id,
										workoutName: item.name,
									})
								}
							>
								<Text style={styles.runLabel}>Start</Text>
							</TouchableOpacity>
						</View>
					</View>
				)}
			/>
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
	headerAdd: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	container: { flexGrow: 1, padding: 16, paddingBottom: 40, gap: 12 },
	loading: { gap: 12 },
	emptyCard: {
		marginTop: 18,
		paddingHorizontal: 24,
		paddingVertical: 34,
		alignItems: 'center',
		borderRadius: 24,
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		...trainingTheme.shadow,
	},
	emptyIcon: {
		width: 70,
		height: 70,
		borderRadius: 35,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	emptyTitle: {
		color: trainingTheme.colors.text,
		fontSize: 21,
		fontWeight: '700',
		marginTop: 18,
	},
	emptySub: {
		color: trainingTheme.colors.textMuted,
		fontSize: 14,
		lineHeight: 21,
		textAlign: 'center',
		marginTop: 7,
	},
	primaryButton: {
		minHeight: 52,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		alignSelf: 'stretch',
		marginTop: 22,
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.primary,
	},
	primaryLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
	card: {
		padding: 14,
		borderRadius: 18,
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		gap: 12,
	},
	cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	workoutIcon: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	cardCopy: { flex: 1 },
	cardName: {
		color: trainingTheme.colors.text,
		fontSize: 16,
		fontWeight: '700',
	},
	cardMeta: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 3,
	},
	actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
	iconButton: {
		width: 44,
		height: 44,
		borderRadius: 14,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	runButton: {
		minHeight: 44,
		paddingHorizontal: 20,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 14,
		backgroundColor: trainingTheme.colors.primary,
	},
	runLabel: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

export default BuildList;
