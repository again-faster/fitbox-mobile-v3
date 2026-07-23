import { wsApi, wsRpc } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { Notification } from '@/services/workoutStudio/types';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import {
	ActivityIndicator,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingNotifications'>;

const KIND_ICON: Record<string, string> = {
	assignment: 'dumbbell',
	coach_note: 'message-text-outline',
	reaction: 'heart-outline',
	wellness_followup: 'heart-pulse',
};

const NotificationsInbox = ({ navigation }: Props) => {
	const qc = useQueryClient();
	const session = getStoredWSSession();
	const uid = session?.user.id;

	const query = useQuery({
		queryKey: ['ws-notifications', uid],
		queryFn: () =>
			wsApi()
				.get('notifications', {
					searchParams: {
						select: '*',
						user_id: `eq.${uid}`,
						order: 'created_at.desc',
						limit: '50',
					},
				})
				.json<Notification[]>(),
		enabled: !!uid,
		staleTime: 60_000,
	});

	const markRead = useMutation({
		mutationFn: (id: string) =>
			wsRpc('mark_notification_read', { p_id: id }),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ['ws-notifications', uid] });
		},
	});

	const markAllRead = useMutation({
		mutationFn: () => wsRpc('mark_all_notifications_read'),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ['ws-notifications', uid] });
		},
	});

	const handleTap = (notification: Notification) => {
		if (!notification.read_at) markRead.mutate(notification.id);
		if (notification.kind === 'assignment' && notification.entity_id) {
			navigation.navigate('TrainingWorkoutDetail', {
				workoutId: notification.entity_id,
			});
		} else if (notification.kind === 'coach_note') {
			navigation.navigate('TrainingCoachNotes');
		}
	};

	const notifications = query.data ?? [];
	const unread = notifications.filter(item => !item.read_at).length;
	const header = (
		<>
			<View style={styles.pageHeader}>
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
					<Text style={styles.pageTitle}>Notifications</Text>
					<Text style={styles.pageSubtitle}>
						Updates from your training.
					</Text>
				</View>
			</View>

			{notifications.length > 0 && (
				<View style={styles.summaryCard}>
					<View
						style={[
							styles.summaryIcon,
							unread === 0 && styles.summaryIconCaughtUp,
						]}
					>
						<Ionicons
							name={unread > 0 ? 'bell-ring-outline' : 'check'}
							size={27}
							color={
								unread > 0
									? trainingTheme.colors.primary
									: trainingTheme.colors.success
							}
						/>
					</View>
					<View style={styles.summaryCopy}>
						<Text style={styles.summaryEyebrow}>
							{unread > 0 ? 'YOUR UPDATES' : 'ALL CAUGHT UP'}
						</Text>
						<Text style={styles.summaryTitle}>
							{unread > 0
								? `${unread} unread ${unread === 1 ? 'notification' : 'notifications'}`
								: 'Nothing new right now'}
						</Text>
					</View>
					{unread > 0 && (
						<TouchableOpacity
							accessibilityRole="button"
							accessibilityLabel={`Mark all ${unread} notifications read`}
							accessibilityState={{
								disabled: markAllRead.isPending,
							}}
							style={styles.markAllButton}
							onPress={() => markAllRead.mutate()}
							disabled={markAllRead.isPending}
						>
							<Text style={styles.markAllText}>
								Mark all read
							</Text>
						</TouchableOpacity>
					)}
				</View>
			)}

			{notifications.length > 0 && (
				<View style={styles.sectionHeading}>
					<Text style={styles.sectionTitle}>Recent</Text>
					<Text style={styles.sectionCount}>
						{notifications.length}
					</Text>
				</View>
			)}
		</>
	);

	const renderNotification = ({ item }: { item: Notification }) => {
		const isUnread = !item.read_at;
		return (
			<TouchableOpacity
				accessibilityRole="button"
				accessibilityLabel={`${isUnread ? 'Unread. ' : ''}${item.title}. ${item.body}`}
				style={[styles.card, isUnread && styles.cardUnread]}
				onPress={() => handleTap(item)}
				activeOpacity={0.75}
			>
				<View
					style={[styles.itemIcon, isUnread && styles.itemIconUnread]}
				>
					<Ionicons
						name={KIND_ICON[item.kind] ?? 'bell-outline'}
						size={23}
						color={
							isUnread
								? trainingTheme.colors.primary
								: trainingTheme.colors.textMuted
						}
					/>
				</View>
				<View style={styles.itemCopy}>
					<View style={styles.titleRow}>
						<Text style={styles.itemTitle} numberOfLines={2}>
							{item.title}
						</Text>
						{isUnread && <View style={styles.unreadDot} />}
					</View>
					<Text style={styles.itemBody}>{item.body}</Text>
					<View style={styles.timeRow}>
						<Ionicons
							name="clock-outline"
							size={14}
							color={trainingTheme.colors.textMuted}
						/>
						<Text style={styles.itemTime}>
							{moment(item.created_at).fromNow()} ·{' '}
							{moment(item.created_at).format('D MMM')}
						</Text>
					</View>
				</View>
				{(item.kind === 'assignment' || item.kind === 'coach_note') && (
					<Ionicons
						name="chevron-right"
						size={20}
						color={trainingTheme.colors.textMuted}
					/>
				)}
			</TouchableOpacity>
		);
	};

	return (
		<SafeAreaView style={styles.screen} edges={['top']}>
			{query.isLoading && (
				<>
					{header}
					<View style={styles.stateContainer}>
						<View style={styles.stateIcon}>
							<ActivityIndicator
								size="large"
								color={trainingTheme.colors.primary}
							/>
						</View>
						<Text style={styles.stateTitle}>
							Loading notifications
						</Text>
					</View>
				</>
			)}
			{!query.isLoading && query.isError && (
				<>
					{header}
					<View style={styles.stateContainer}>
						<View style={styles.stateIcon}>
							<Ionicons
								name="alert-circle-outline"
								size={36}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<Text style={styles.stateTitle}>
							Notifications couldn&apos;t load
						</Text>
						<Text style={styles.stateBody}>
							Check your connection and try again.
						</Text>
						<TouchableOpacity
							accessibilityRole="button"
							style={styles.retryButton}
							onPress={() => void query.refetch()}
						>
							<Text style={styles.retryText}>Try again</Text>
						</TouchableOpacity>
					</View>
				</>
			)}
			{!query.isLoading &&
				!query.isError &&
				notifications.length === 0 && (
					<>
						{header}
						<View style={styles.stateContainer}>
							<View style={styles.stateIcon}>
								<Ionicons
									name="bell-check-outline"
									size={38}
									color={trainingTheme.colors.primary}
								/>
							</View>
							<Text style={styles.stateTitle}>
								You&apos;re all caught up
							</Text>
							<Text style={styles.stateBody}>
								New assignments, coach notes and training
								updates will appear here.
							</Text>
						</View>
					</>
				)}
			{!query.isLoading && !query.isError && notifications.length > 0 && (
				<FlatList
					data={notifications}
					keyExtractor={item => item.id}
					ListHeaderComponent={header}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={query.isRefetching}
							tintColor={trainingTheme.colors.primary}
							colors={[trainingTheme.colors.primary]}
							onRefresh={() => void query.refetch()}
						/>
					}
					renderItem={renderNotification}
				/>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	listContent: { paddingBottom: trainingTheme.spacing.xxl },
	pageHeader: {
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
	pageTitle: {
		fontSize: 28,
		lineHeight: 34,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	pageSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	summaryCard: {
		marginHorizontal: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.xl,
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.primarySoft,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
	},
	summaryIcon: {
		width: 52,
		height: 52,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
	summaryIconCaughtUp: { backgroundColor: trainingTheme.colors.successSoft },
	summaryCopy: { flex: 1 },
	summaryEyebrow: {
		fontSize: 11,
		lineHeight: 15,
		fontWeight: '800',
		letterSpacing: 0.9,
		color: trainingTheme.colors.primary,
	},
	summaryTitle: {
		fontSize: 16,
		lineHeight: 22,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		marginTop: 2,
	},
	markAllButton: {
		minHeight: trainingTheme.touchTarget,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: trainingTheme.spacing.md,
	},
	markAllText: {
		fontSize: 12,
		fontWeight: '800',
		color: trainingTheme.colors.primary,
	},
	sectionHeading: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.md,
		gap: trainingTheme.spacing.sm,
	},
	sectionTitle: {
		fontSize: 20,
		lineHeight: 26,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	sectionCount: {
		minWidth: 26,
		height: 26,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.primarySoft,
		fontSize: 13,
		lineHeight: 26,
		fontWeight: '800',
		color: trainingTheme.colors.primary,
		textAlign: 'center',
	},
	card: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		marginHorizontal: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		borderWidth: 1,
		borderColor: 'transparent',
		...trainingTheme.shadow,
	},
	cardUnread: { borderColor: trainingTheme.colors.primarySoft },
	itemIcon: {
		width: 48,
		height: 48,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surfaceMuted,
		alignItems: 'center',
		justifyContent: 'center',
	},
	itemIconUnread: { backgroundColor: trainingTheme.colors.primarySoft },
	itemCopy: { flex: 1 },
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.sm,
	},
	itemTitle: {
		flex: 1,
		fontSize: 16,
		lineHeight: 21,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	unreadDot: {
		width: 9,
		height: 9,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.primary,
	},
	itemBody: {
		fontSize: 13,
		lineHeight: 19,
		color: trainingTheme.colors.textMuted,
		marginTop: 3,
	},
	timeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.xs,
		marginTop: trainingTheme.spacing.sm,
	},
	itemTime: {
		fontSize: 11,
		lineHeight: 15,
		color: trainingTheme.colors.textMuted,
	},
	stateContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: trainingTheme.spacing.xxl,
		paddingBottom: 80,
	},
	stateIcon: {
		width: 84,
		height: 84,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: trainingTheme.spacing.lg,
	},
	stateTitle: {
		fontSize: 21,
		lineHeight: 27,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		textAlign: 'center',
	},
	stateBody: {
		fontSize: 15,
		lineHeight: 22,
		color: trainingTheme.colors.textMuted,
		textAlign: 'center',
		marginTop: trainingTheme.spacing.sm,
	},
	retryButton: {
		minHeight: 50,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: trainingTheme.spacing.xl,
		marginTop: trainingTheme.spacing.xl,
	},
	retryText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});

export default NotificationsInbox;
