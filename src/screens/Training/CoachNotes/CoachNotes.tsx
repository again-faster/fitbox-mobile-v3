import { wsApi, wsRpc } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { CoachNote } from '@/services/workoutStudio/types';
import { trainingTheme } from '@/theme/training';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import {
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import SkeletonCard from '../components/SkeletonCard';

const CoachNotes = () => {
	const qc = useQueryClient();
	const session = getStoredWSSession();
	const uid = session?.user.id;

	const { data, isLoading, isRefetching, refetch } = useQuery({
		queryKey: ['ws-coach-notes', uid],
		queryFn: () =>
			wsApi()
				.get('section_athlete_notes', {
					searchParams: {
						select: 'id,content,created_at,read_at',
						athlete_id: `eq.${uid}`,
						order: 'created_at.desc',
					},
				})
				.json<CoachNote[]>(),
		enabled: !!uid,
		staleTime: 60_000,
	});

	const markRead = useMutation({
		mutationFn: (noteId: string) =>
			wsRpc('mark_section_athlete_note_read', { p_note_id: noteId }),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ['ws-coach-notes', uid] });
			void qc.invalidateQueries({
				queryKey: ['ws-coach-notes-unread', uid],
			});
		},
	});

	const markAllRead = useMutation({
		mutationFn: () => wsRpc('mark_all_section_athlete_notes_read'),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ['ws-coach-notes', uid] });
			void qc.invalidateQueries({
				queryKey: ['ws-coach-notes-unread', uid],
			});
		},
	});

	const unread = data?.filter(n => !n.read_at).length ?? 0;

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
			ListHeaderComponent={
				unread > 0 ? (
					<TouchableOpacity
						style={styles.markAllBtn}
						onPress={() => markAllRead.mutate()}
					>
						<Text style={styles.markAllText}>
							Mark all {unread} read
						</Text>
					</TouchableOpacity>
				) : null
			}
			ListEmptyComponent={
				isLoading ? (
					<View style={{ padding: 16 }}>
						<SkeletonCard />
						<SkeletonCard />
					</View>
				) : (
					<View style={styles.empty}>
						<Text style={styles.emptyText}>No coach notes yet</Text>
					</View>
				)
			}
			renderItem={({ item }) => (
				<TouchableOpacity
					style={[
						styles.card,
						styles.cardSurface,
						!item.read_at && {
							borderLeftWidth: 3,
							borderLeftColor: trainingTheme.colors.primary,
						},
					]}
					onPress={() => !item.read_at && markRead.mutate(item.id)}
				>
					<Text style={styles.content}>{item.content}</Text>
					<Text style={styles.date}>
						{moment(item.created_at).format(
							'MMM D, YYYY [·] h:mm A',
						)}
					</Text>
					{!item.read_at && (
						<View
							style={[
								styles.unreadDot,
								{
									backgroundColor:
										trainingTheme.colors.primary,
								},
							]}
						/>
					)}
				</TouchableOpacity>
			)}
		/>
	);
};

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	container: { padding: 16, paddingBottom: 40 },
	markAllBtn: {
		backgroundColor: trainingTheme.colors.primarySoft,
		borderRadius: 14,
		padding: 12,
		alignItems: 'center',
		marginBottom: 12,
	},
	markAllText: {
		color: trainingTheme.colors.primary,
		fontWeight: '700',
		fontSize: 14,
	},
	card: {
		borderRadius: 18,
		padding: 14,
		marginBottom: 10,
		position: 'relative',
	},
	cardSurface: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
	},
	content: { color: trainingTheme.colors.text, fontSize: 15, lineHeight: 22 },
	date: { color: trainingTheme.colors.textMuted, fontSize: 12, marginTop: 6 },
	unreadDot: {
		position: 'absolute',
		top: 14,
		right: 14,
		width: 8,
		height: 8,
		borderRadius: 4,
	},
	empty: { alignItems: 'center', padding: 40 },
	emptyText: { color: trainingTheme.colors.textMuted, fontSize: 15 },
});

export default CoachNotes;
