import { useMemo } from "react";
import type { StackScreenProps } from "@react-navigation/stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import moment from "moment";
import {
	ActivityIndicator,
	FlatList,
	RefreshControl,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Ionicons from "react-native-vector-icons/MaterialCommunityIcons";
import { MemberScreen } from "@/components/member";
import { getStoredWSSession } from "@/services/workoutStudio/auth";
import {
	getMemberNotifications,
	markAllNotificationsRead,
	markNotificationRead,
	type MemberNotification,
} from "@/services/workoutStudio/notifications";
import { trainingTheme } from "@/theme/training";
import type { TrainingStackParamList } from "@/types/navigation";

type Props = StackScreenProps<TrainingStackParamList, "TrainingNotifications">;
type NotificationSession = ReturnType<typeof getStoredWSSession>;

export type NotificationInboxState = "loading" | "error" | "empty" | "ready";

export type NotificationInboxStateCopy = {
	state: NotificationInboxState;
	title: string;
	detail: string;
};

export const hasMemberNotificationSession = (
	session: NotificationSession,
): boolean =>
	session?.user.persona === "member" &&
	!!session.user.id &&
	!!session.user.active_tenant_id;

export const shouldEnableNotificationQuery = (
	session: NotificationSession,
): boolean => hasMemberNotificationSession(session);

export const notificationInboxStateCopy = (
	state: NotificationInboxState,
): NotificationInboxStateCopy => {
	if (state === "loading")
		return {
			state,
			title: "Loading notifications",
			detail: "Checking your latest training updates.",
		};
	if (state === "error")
		return {
			state,
			title: "Notifications unavailable",
			detail: "We could not load your updates. Try again shortly.",
		};
	if (state === "empty")
		return {
			state,
			title: "You're all caught up",
			detail: "New assignments, coach notes and training updates will appear here.",
		};
	return {
		state,
		title: "Your updates",
		detail: "Recent notifications from your training.",
	};
};

export const notificationInboxViewState = (
	enabled: boolean,
	isLoading: boolean,
	isError: boolean,
	notifications: MemberNotification[] | undefined,
): NotificationInboxState => {
	if (!enabled) return "empty";
	if (isLoading) return "loading";
	if (isError) return "error";
	if (!notifications || notifications.length === 0) return "empty";
	return "ready";
};

const KIND_ICON: Record<MemberNotification["kind"], string> = {
	assignment: "dumbbell",
	coach_note: "message-text-outline",
	reaction: "heart-outline",
	wellness_followup: "heart-pulse",
};

const formatNotificationDate = (createdAt: string): string => {
	const date = moment(createdAt);
	return date.isValid() ? date.format("D MMM") : "Date not available";
};

const notificationTime = (createdAt: string): string => {
	const date = moment(createdAt);
	return date.isValid()
		? `${date.fromNow()} · ${date.format("D MMM")}`
		: "Date not available";
};

export const notificationAccessibilityLabel = (
	notification: MemberNotification,
): string =>
	`${notification.read_at ? "Read" : "Unread"} notification. ${notification.title}. ${notification.body}. Received ${formatNotificationDate(notification.created_at)}.`;

const NotificationsInbox = ({ navigation }: Props) => {
	const queryClient = useQueryClient();
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const queryEnabled = shouldEnableNotificationQuery(session);
	const queryKey = useMemo(
		() => ["ws-member-notifications", uid, tenantId] as const,
		[tenantId, uid],
	);

	const query = useQuery<MemberNotification[]>({
		queryKey,
		queryFn: () => getMemberNotifications({ limit: 50 }),
		enabled: queryEnabled,
		staleTime: 60_000,
	});

	const markRead = useMutation({
		mutationFn: (notificationId: string) =>
			markNotificationRead(notificationId),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey });
		},
	});

	const markAllRead = useMutation({
		mutationFn: () => markAllNotificationsRead(),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey });
		},
	});

	const notifications = query.data;
	const unread = notifications?.filter((item) => !item.read_at).length ?? 0;
	const state = notificationInboxViewState(
		queryEnabled,
		query.isLoading,
		query.isError,
		notifications,
	);
	const copy = notificationInboxStateCopy(state);
	const mutationError = markRead.isError || markAllRead.isError;

	const handleTap = (notification: MemberNotification) => {
		if (
			queryEnabled &&
			!notification.read_at &&
			notification.id.trim() &&
			!markRead.isPending
		)
			markRead.mutate(notification.id);

		if (notification.kind === "assignment" && notification.entity_id) {
			navigation.navigate("TrainingWorkoutDetail", {
				workoutId: notification.entity_id,
			});
		} else if (notification.kind === "coach_note") {
			navigation.navigate("TrainingCoachNotes");
		}
	};

	const renderNotification = ({ item }: { item: MemberNotification }) => {
		const isUnread = !item.read_at;
		return (
			<TouchableOpacity
				accessibilityRole="button"
				accessibilityLabel={notificationAccessibilityLabel(item)}
				accessibilityState={{
					selected: isUnread,
					disabled: markRead.isPending,
				}}
				style={[styles.card, isUnread && styles.cardUnread]}
				onPress={() => handleTap(item)}
				activeOpacity={0.75}
			>
				<View
					style={[styles.itemIcon, isUnread && styles.itemIconUnread]}
				>
					<Ionicons
						name={KIND_ICON[item.kind]}
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
							{notificationTime(item.created_at)}
						</Text>
					</View>
				</View>
				{(item.kind === "assignment" || item.kind === "coach_note") && (
					<Ionicons
						name="chevron-right"
						size={20}
						color={trainingTheme.colors.textMuted}
					/>
				)}
			</TouchableOpacity>
		);
	};

	const header = (
		<View>
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

			{state === "ready" && notifications && (
				<View
					style={styles.summaryCard}
					accessibilityRole="summary"
					accessibilityLabel={`Notifications. ${unread > 0 ? `${unread} unread` : "All caught up"}.`}
				>
					<View
						style={[
							styles.summaryIcon,
							unread === 0 && styles.summaryIconCaughtUp,
						]}
					>
						<Ionicons
							name={unread > 0 ? "bell-ring-outline" : "check"}
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
							{unread > 0 ? "YOUR UPDATES" : "ALL CAUGHT UP"}
						</Text>
						<Text style={styles.summaryTitle}>
							{unread > 0
								? `${unread} unread ${unread === 1 ? "notification" : "notifications"}`
								: "Nothing new right now"}
						</Text>
					</View>
					{unread > 0 && (
						<TouchableOpacity
							accessibilityRole="button"
							accessibilityLabel="Mark all notifications read"
							accessibilityState={{
								disabled: markAllRead.isPending,
							}}
							style={styles.markAllButton}
							onPress={() => {
								if (!markAllRead.isPending && queryEnabled)
									markAllRead.mutate();
							}}
							disabled={markAllRead.isPending || !queryEnabled}
						>
							<Text style={styles.markAllText}>
								Mark all read
							</Text>
						</TouchableOpacity>
					)}
				</View>
			)}

			{state === "ready" && notifications && (
				<View style={styles.sectionHeading}>
					<Text style={styles.sectionTitle}>Recent</Text>
					<Text style={styles.sectionCount}>
						{notifications.length}
					</Text>
				</View>
			)}
			{mutationError && (
				<Text style={styles.actionError} accessibilityRole="alert">
					Read status could not be updated. Try again shortly.
				</Text>
			)}
		</View>
	);

	const renderState = () => {
		const signedOutCopy = {
			title: "Notifications unavailable",
			detail: "Sign in to view your training updates.",
		};
		const stateCopy = queryEnabled ? copy : signedOutCopy;
		return (
			<>
				{header}
				<View
					style={styles.stateContainer}
					accessibilityRole="summary"
					accessibilityLabel={`${stateCopy.title}. ${stateCopy.detail}`}
				>
					<View style={styles.stateIcon}>
						{state === "loading" ? (
							<ActivityIndicator
								size="large"
								color={trainingTheme.colors.primary}
							/>
						) : (
							<Ionicons
								name={
									state === "error"
										? "alert-circle-outline"
										: "bell-check-outline"
								}
								size={38}
								color={trainingTheme.colors.primary}
							/>
						)}
					</View>
					<Text style={styles.stateTitle}>{stateCopy.title}</Text>
					<Text style={styles.stateBody}>{stateCopy.detail}</Text>
					{state === "error" && queryEnabled && (
						<TouchableOpacity
							accessibilityRole="button"
							accessibilityLabel="Try again"
							style={styles.retryButton}
							onPress={() => void query.refetch()}
						>
							<Text style={styles.retryText}>Try again</Text>
						</TouchableOpacity>
					)}
				</View>
			</>
		);
	};

	return (
		<MemberScreen style={styles.screen} contentContainerStyle={styles.screenContent} edges={["top"]}>
			{state !== "ready" ? (
				renderState()
			) : (
				<FlatList
					data={notifications ?? []}
					keyExtractor={(item) => item.id}
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
		</MemberScreen>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	screenContent: { paddingHorizontal: 0 },
	listContent: { paddingBottom: trainingTheme.spacing.xxl },
	pageHeader: {
		flexDirection: "row",
		alignItems: "center",
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
		alignItems: "center",
		justifyContent: "center",
	},
	headerCopy: { flex: 1 },
	pageTitle: {
		fontSize: 28,
		lineHeight: 34,
		fontWeight: "800",
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
		flexDirection: "row",
		alignItems: "center",
		gap: trainingTheme.spacing.md,
	},
	summaryIcon: {
		width: 52,
		height: 52,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: "center",
		justifyContent: "center",
	},
	summaryIconCaughtUp: { backgroundColor: trainingTheme.colors.successSoft },
	summaryCopy: { flex: 1 },
	summaryEyebrow: {
		fontSize: 11,
		lineHeight: 15,
		fontWeight: "800",
		letterSpacing: 0.9,
		color: trainingTheme.colors.primary,
	},
	summaryTitle: {
		fontSize: 16,
		lineHeight: 22,
		fontWeight: "800",
		color: trainingTheme.colors.text,
		marginTop: 2,
	},
	markAllButton: {
		minHeight: trainingTheme.touchTarget,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: trainingTheme.spacing.md,
	},
	markAllText: {
		fontSize: 12,
		fontWeight: "800",
		color: trainingTheme.colors.primary,
	},
	sectionHeading: {
		flexDirection: "row",
		alignItems: "center",
		marginHorizontal: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.md,
		gap: trainingTheme.spacing.sm,
	},
	sectionTitle: {
		fontSize: 20,
		lineHeight: 26,
		fontWeight: "800",
		color: trainingTheme.colors.text,
	},
	sectionCount: {
		minWidth: 26,
		height: 26,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.primarySoft,
		fontSize: 13,
		lineHeight: 26,
		fontWeight: "800",
		color: trainingTheme.colors.primary,
		textAlign: "center",
	},
	card: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		marginHorizontal: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.md,
		flexDirection: "row",
		alignItems: "center",
		gap: trainingTheme.spacing.md,
		borderWidth: 1,
		borderColor: "transparent",
		...trainingTheme.shadow,
	},
	cardUnread: { borderColor: trainingTheme.colors.primarySoft },
	itemIcon: {
		width: 48,
		height: 48,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surfaceMuted,
		alignItems: "center",
		justifyContent: "center",
	},
	itemIconUnread: { backgroundColor: trainingTheme.colors.primarySoft },
	itemCopy: { flex: 1 },
	titleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: trainingTheme.spacing.sm,
	},
	itemTitle: {
		flex: 1,
		fontSize: 16,
		lineHeight: 21,
		fontWeight: "800",
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
		flexDirection: "row",
		alignItems: "center",
		gap: trainingTheme.spacing.xs,
		marginTop: trainingTheme.spacing.sm,
	},
	itemTime: {
		fontSize: 11,
		lineHeight: 15,
		color: trainingTheme.colors.textMuted,
	},
	actionError: {
		marginHorizontal: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.md,
		fontSize: 12,
		lineHeight: 17,
		color: trainingTheme.colors.danger,
	},
	stateContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: trainingTheme.spacing.xxl,
		paddingBottom: 80,
	},
	stateIcon: {
		width: 84,
		height: 84,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: trainingTheme.spacing.lg,
	},
	stateTitle: {
		fontSize: 21,
		lineHeight: 27,
		fontWeight: "800",
		color: trainingTheme.colors.text,
		textAlign: "center",
	},
	stateBody: {
		fontSize: 15,
		lineHeight: 22,
		color: trainingTheme.colors.textMuted,
		textAlign: "center",
		marginTop: trainingTheme.spacing.sm,
	},
	retryButton: {
		minHeight: 50,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: trainingTheme.spacing.xl,
		marginTop: trainingTheme.spacing.xl,
	},
	retryText: { fontSize: 15, fontWeight: "800", color: "#FFFFFF" },
});

export default NotificationsInbox;
