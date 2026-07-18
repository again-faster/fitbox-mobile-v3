/* eslint-disable no-nested-ternary, no-restricted-syntax */
import { useMemo, useState } from 'react';
import {
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { StackScreenProps } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { TrainingStackParamList } from '@/types/navigation';
import { trainingTheme } from '@/theme/training';
import SkeletonCard from '../components/SkeletonCard';
import TrainingState from '../components/TrainingState';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingBenchmarks'>;
type Benchmark = {
	id: string;
	name: string;
	estimated_duration_minutes: number | null;
};
type Attempt = {
	workout_id: string;
	completed_at: string;
	score_time_seconds: number | null;
	score_rounds: number | null;
	score_partial_reps: number | null;
	score_weight_kg: number | null;
	score_reps: number | null;
};

const scoreLabel = (attempt: Attempt) => {
	if (attempt.score_time_seconds != null)
		return `${Math.floor(attempt.score_time_seconds / 60)}:${String(attempt.score_time_seconds % 60).padStart(2, '0')}`;
	if (attempt.score_rounds != null)
		return `${attempt.score_rounds} rounds${attempt.score_partial_reps ? ` + ${attempt.score_partial_reps}` : ''}`;
	if (attempt.score_weight_kg != null) return `${attempt.score_weight_kg} kg`;
	if (attempt.score_reps != null) return `${attempt.score_reps} reps`;
	return 'Completed';
};

const Benchmarks = ({ navigation }: Props) => {
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const [search, setSearch] = useState('');
	const benchmarks = useQuery({
		queryKey: ['ws-benchmarks'],
		queryFn: () =>
			wsApi()
				.get('workouts', {
					searchParams: {
						select: 'id,name,estimated_duration_minutes',
						type: 'eq.benchmark',
						order: 'name.asc',
					},
				})
				.json<Benchmark[]>(),
		staleTime: 300_000,
	});
	const attempts = useQuery({
		queryKey: ['ws-benchmark-attempts', uid],
		queryFn: () =>
			wsApi()
				.get('workout_results', {
					searchParams: {
						select: 'workout_id,completed_at,score_time_seconds,score_rounds,score_partial_reps,score_weight_kg,score_reps',
						athlete_id: `eq.${uid}`,
						completed_at: 'not.is.null',
						order: 'completed_at.desc',
						limit: '500',
					},
				})
				.json<Attempt[]>(),
		enabled: !!uid,
		staleTime: 120_000,
	});
	const attemptsByWorkout = useMemo(() => {
		const grouped: Record<string, Attempt[]> = {};
		for (const item of attempts.data ?? [])
			(grouped[item.workout_id] ??= []).push(item);
		return grouped;
	}, [attempts.data]);
	const filtered = useMemo(() => {
		const needle = search.trim().toLowerCase();
		return needle
			? (benchmarks.data ?? []).filter(item =>
					item.name.toLowerCase().includes(needle),
				)
			: (benchmarks.data ?? []);
	}, [benchmarks.data, search]);
	const refresh = () => {
		void benchmarks.refetch();
		void attempts.refetch();
	};

	return (
		<FlatList
			style={styles.screen}
			contentContainerStyle={styles.container}
			data={filtered}
			keyExtractor={item => item.id}
			refreshControl={
				<RefreshControl
					refreshing={
						benchmarks.isRefetching || attempts.isRefetching
					}
					onRefresh={refresh}
					tintColor={trainingTheme.colors.primary}
				/>
			}
			ListHeaderComponent={
				<View style={styles.header}>
					<Text style={styles.title}>Benchmarks</Text>
					<Text style={styles.subtitle}>
						Repeat recognised workouts and compare your performance
						over time.
					</Text>
					<View style={styles.searchWrap}>
						<Ionicons
							name="magnify"
							size={20}
							color={trainingTheme.colors.textMuted}
						/>
						<TextInput
							value={search}
							onChangeText={setSearch}
							placeholder="Search benchmarks"
							placeholderTextColor={
								trainingTheme.colors.textMuted
							}
							style={styles.search}
						/>
					</View>
				</View>
			}
			ListEmptyComponent={
				benchmarks.isLoading ? (
					<View style={styles.loading}>
						<SkeletonCard />
						<SkeletonCard />
					</View>
				) : benchmarks.isError ? (
					<TrainingState
						kind="error"
						title="Benchmarks couldn't load"
						message="Check your connection and try again."
						actionLabel="Try again"
						onAction={refresh}
					/>
				) : (
					<TrainingState
						kind="empty"
						title={
							search
								? 'No matching benchmarks'
								: 'No benchmarks available'
						}
						message={
							search
								? 'Try a different search.'
								: 'Your gym has not published benchmark workouts yet.'
						}
					/>
				)
			}
			renderItem={({ item }) => {
				const history = attemptsByWorkout[item.id] ?? [];
				const latest = history[0];
				return (
					<TouchableOpacity
						accessibilityRole="button"
						style={styles.card}
						onPress={() =>
							navigation.navigate('TrainingWorkoutDetail', {
								workoutId: item.id,
							})
						}
					>
						<View style={styles.icon}>
							<Ionicons
								name="trophy-outline"
								size={22}
								color={trainingTheme.colors.warning}
							/>
						</View>
						<View style={styles.copy}>
							<Text style={styles.name}>{item.name}</Text>
							<Text style={styles.meta}>
								{history.length === 0
									? 'Not attempted yet'
									: `${history.length} attempt${history.length === 1 ? '' : 's'} · Last ${moment(latest!.completed_at).format('D MMM')}`}
							</Text>
							{latest ? (
								<Text style={styles.lastScore}>
									Latest: {scoreLabel(latest)}
								</Text>
							) : item.estimated_duration_minutes ? (
								<Text style={styles.lastScore}>
									About {item.estimated_duration_minutes} min
								</Text>
							) : null}
						</View>
						<Ionicons
							name="chevron-right"
							size={21}
							color={trainingTheme.colors.textMuted}
						/>
					</TouchableOpacity>
				);
			}}
		/>
	);
};

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	container: { padding: 16, paddingBottom: 48, flexGrow: 1 },
	header: { marginBottom: 16 },
	title: {
		color: trainingTheme.colors.text,
		fontSize: 26,
		fontWeight: '700',
	},
	subtitle: {
		color: trainingTheme.colors.textMuted,
		fontSize: 14,
		lineHeight: 20,
		marginTop: 4,
	},
	searchWrap: {
		height: 48,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		borderRadius: 12,
		backgroundColor: trainingTheme.colors.surface,
		paddingHorizontal: 12,
		marginTop: 16,
	},
	search: { flex: 1, color: trainingTheme.colors.text, fontSize: 15 },
	card: {
		minHeight: 88,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 14,
		marginBottom: 10,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		backgroundColor: trainingTheme.colors.surface,
	},
	icon: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.warningSoft,
	},
	copy: { flex: 1 },
	name: { color: trainingTheme.colors.text, fontSize: 16, fontWeight: '700' },
	meta: { color: trainingTheme.colors.textMuted, fontSize: 12, marginTop: 3 },
	lastScore: {
		color: trainingTheme.colors.primary,
		fontSize: 13,
		fontWeight: '600',
		marginTop: 4,
	},
	loading: { gap: 10 },
});
export default Benchmarks;
