import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { FeedItem } from '@/services/workoutStudio/types';
import { trainingTheme } from '@/theme/training';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import SkeletonCard from '../components/SkeletonCard';

const REACTIONS = ['💪', '🔥', '🎉', '👏', '❤️'];

const GymFeed = () => {
	const session = getStoredWSSession();
	const tenantId = session?.user.active_tenant_id;

	const since = moment().subtract(14, 'days').toISOString();

	const { data, isLoading, isRefetching, refetch } = useQuery({
		queryKey: ['ws-feed', tenantId],
		queryFn: () =>
			wsApi()
				.get('workout_results', {
					searchParams: {
						select: 'id,athlete_id,completed_at,workouts(name)',
						tenant_id: `eq.${tenantId}`,
						completed_at: `gte.${since}`,
						order: 'completed_at.desc',
					},
				})
				.json<FeedItem[]>(),
		enabled: !!tenantId,
		staleTime: 60_000,
	});

	return (
		<FlatList
			style={styles.screen}
			contentContainerStyle={styles.container}
			data={data}
			keyExtractor={item => item.id}
			refreshControl={
				<RefreshControl
					refreshing={isRefetching}
					onRefresh={() => {
						void refetch();
					}}
					tintColor={trainingTheme.colors.primary}
				/>
			}
			ListEmptyComponent={
				isLoading ? (
					<View style={{ padding: 16 }}>
						<SkeletonCard />
						<SkeletonCard />
					</View>
				) : (
					<View style={styles.empty}>
						<Text style={styles.emptyText}>
							No activity in the last 14 days
						</Text>
					</View>
				)
			}
			renderItem={({ item }) => (
				<View style={styles.card}>
					<View style={styles.header}>
						<View
							style={[
								styles.avatar,
								{
									backgroundColor:
										trainingTheme.colors.primary,
								},
							]}
						>
							<Text style={styles.avatarText}>
								{(item.profile?.full_name ?? 'A')
									.charAt(0)
									.toUpperCase()}
							</Text>
						</View>
						<View>
							<Text style={styles.name}>
								{item.profile?.full_name ?? 'Athlete'}
							</Text>
							<Text style={styles.time}>
								{moment(item.completed_at).format(
									'MMM D [·] h:mm A',
								)}
							</Text>
						</View>
					</View>
					<Text style={styles.workoutName}>
						Completed {item.workouts.name}
					</Text>
					<View style={styles.reactions}>
						{REACTIONS.map(r => (
							<Text key={r} style={styles.reactionEmoji}>
								{r}
							</Text>
						))}
					</View>
				</View>
			)}
		/>
	);
};

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	container: { padding: 16, paddingBottom: 40 },
	card: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: 18,
		padding: 16,
		marginBottom: 12,
		gap: 12,
	},
	header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		justifyContent: 'center',
		alignItems: 'center',
	},
	avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
	name: { color: trainingTheme.colors.text, fontSize: 14, fontWeight: '700' },
	time: { color: trainingTheme.colors.textMuted, fontSize: 12 },
	workoutName: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '600',
	},
	reactions: { flexDirection: 'row', gap: 8 },
	reactionEmoji: { fontSize: 22 },
	empty: { alignItems: 'center', padding: 40 },
	emptyText: { color: trainingTheme.colors.textMuted, fontSize: 15 },
});

export default GymFeed;
