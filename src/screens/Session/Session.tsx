import { ScrollView, Text } from '@/components/atoms';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import { buildClassSessionSummary } from '@/services/workoutStudio/classSessionSummary';
import { getScheduleDetail } from '@/services/session';
import { useWorkoutDetail } from '@/screens/Training/hooks/useWorkoutDetail';
import { memberTheme } from '@/theme/member';
import { ApplicationScreenProps, SessionParams } from '@/types/navigation';
import {
	SessionDetailSchemaType,
	SessionMemberAttendanceSchemaType,
} from '@/types/schemas/session';
import { Constant, Func } from '@/utils';
import { SessionTabsEnum, VisibilityOptions } from '@/utils/Enum';
import useStore from '@/zustand/Store';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isArray } from 'lodash';
import moment from 'moment';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
	SessionActionButtons,
	SessionAttendanceTab,
	SessionInformationTab,
	SessionLoader,
	SessionTabButtons,
} from './components';
import {
	classTrainingWorkoutQueryOptions,
	shouldRefreshClassTrainingResolution,
	useClassTrainingWorkout,
} from './hooks/useClassTrainingWorkout';

type SessionWaitlistMember = { calendar_event_id: number; user_id: number };

const Session = ({ route, navigation }: ApplicationScreenProps) => {
	const loggedInUser = useStore(state => state.loggedInUser);
	const allowLeaderboards = useStore(state => state.allowLeaderboards);
	const queryClient = useQueryClient();
	const [activeTab, setActiveTab] = useState<SessionTabsEnum>(
		SessionTabsEnum.INFO,
	);
	const [loadingTab, setLoadingTab] = useState<'workout' | 'results' | null>(
		null,
	);
	const trainingNavigationPending = useRef(false);
	const [activeTenantId, setActiveTenantId] = useState<string | null>(
		() => getStoredWSSession()?.user.active_tenant_id ?? null,
	);

	const {
		id: eventId = 0,
		waitlistEnabled,
		waitlistTime,
	} = route.params as SessionParams;

	const { data, error, isFetchedAfterMount } = useQuery({
		queryKey: ['sessionGetScheduleDetail'],
		queryFn: () => getScheduleDetail(eventId),
		select: res => res.data,
		enabled: !!eventId,
	});

	const session = data;
	const sessionTitle = session?.fb_class?.name ?? 'Class session';
	const bookedMembers = session?.member_attendance ?? [];
	const startTime = session?.start_datetime as string;

	// const sections = useMemo(() => session?.sections, [session]);
	const attendanceView = session?.attendance_view ?? false;
	// const attendanceLimit = session?.attendance_limit ?? null;

	const subscribed = useMemo(
		() => Func.checkSubscription(session?.bookable),
		[session],
	);

	const isLimited = useMemo(
		() =>
			!!session &&
			Func.isSessionVisible(
				session.bookable,
				Number(
					session.fb_class.class_visibility ||
						session.class?.class_visibility,
				),
				VisibilityOptions.LIMITED,
			),
		[session],
	);

	const isBookingLocked = useMemo(
		() =>
			!!(
				session &&
				Func.checkSessionLock(
					session.start_datetime,
					session.booking_HH,
					session.booking_MM,
				)
			),
		[session],
	);

	const disableUnbooking = useMemo(
		() =>
			!!(
				session &&
				Func.checkSessionLock(
					session.start_datetime,
					session.locktime_HH,
					session.locktime_MM,
				)
			),
		[session],
	);

	const isAttending = useMemo(
		() =>
			!!session?.member_attendance?.some(
				e => e.user_id === loggedInUser?.id,
			),
		[session, loggedInUser?.id],
	);

	const isWaitlist = useMemo(
		() =>
			!!session?.waitlist?.some(
				(w: SessionWaitlistMember) =>
					w.calendar_event_id === session?.id &&
					w.user_id === loggedInUser?.id,
			),
		[session, loggedInUser],
	);

	const waitlistNumber = useMemo(() => {
		const waitlist = Array.isArray(session?.waitlist)
			? session?.waitlist
			: [];
		const index = waitlist?.findIndex(
			(w: SessionWaitlistMember) => w.user_id === loggedInUser?.id,
		);
		return index !== -1 ? index + 1 : -1;
	}, [session, loggedInUser]);

	const waitlistLength = useMemo(() => {
		if (session?.waitlist && isArray(session.waitlist)) {
			return session.waitlist.length;
		}
		return 0;
	}, [session]);

	const spotsLeft = useMemo(() => {
		if (session && session?.attendance_limit !== null && bookedMembers) {
			return Number(session.attendance_limit) - bookedMembers.length;
		}

		return bookedMembers.length + 10;
	}, [session, bookedMembers]);

	const classId = useMemo(
		() => Number(session?.class_event.class_id),
		[session],
	);
	const classTrainingParams = useMemo(
		() =>
			activeTenantId && session
				? {
						tenantId: activeTenantId,
						classId,
						eventId,
						sessionDate: moment(session.start_datetime).format(
							Constant.DEFAULT_DATE_FORMAT,
						),
					}
				: null,
		[activeTenantId, classId, eventId, session],
	);
	const classTrainingQuery = useClassTrainingWorkout(classTrainingParams);
	const mappedWorkoutId =
		classTrainingQuery.data?.status === 'resolved'
			? classTrainingQuery.data.workoutId
			: '';
	const workoutDetailQuery = useWorkoutDetail(mappedWorkoutId);
	const todaySessionSummary = useMemo(
		() => buildClassSessionSummary(workoutDetailQuery.data),
		[workoutDetailQuery.data],
	);
	const todaySessionLoading =
		classTrainingParams !== null &&
		(classTrainingQuery.isPending ||
			(classTrainingQuery.data?.status === 'resolved' &&
				workoutDetailQuery.isPending));

	useFocusEffect(
		useCallback(() => {
			setActiveTenantId(
				getStoredWSSession()?.user.active_tenant_id ?? null,
			);
			trainingNavigationPending.current = false;
			setLoadingTab(null);
		}, []),
	);

	const openTrainingWorkout: (
		initialTab: 'overview' | 'leaderboard',
	) => Promise<void> = async initialTab => {
		if (trainingNavigationPending.current || !session) return;
		trainingNavigationPending.current = true;
		setLoadingTab(initialTab === 'leaderboard' ? 'results' : 'workout');
		let navigationStarted = false;

		try {
			const actionTenantId =
				getStoredWSSession()?.user.active_tenant_id ?? null;
			if (!actionTenantId) {
				navigationStarted = true;
				navigation.push('Main', {
					screen: 'TrainingStack',
					params: { screen: 'TrainingActivate', params: {} },
				});
				return;
			}

			const actionParams = {
				tenantId: actionTenantId,
				classId,
				eventId,
				sessionDate: moment(session.start_datetime).format(
					Constant.DEFAULT_DATE_FORMAT,
				),
			};
			const tenantChanged = actionTenantId !== activeTenantId;
			if (tenantChanged) setActiveTenantId(actionTenantId);

			let resolution = classTrainingQuery.data;
			if (tenantChanged) {
				resolution = await queryClient.fetchQuery({
					...classTrainingWorkoutQueryOptions(actionParams),
					staleTime: 0,
				});
			} else if (shouldRefreshClassTrainingResolution(resolution)) {
				resolution = (await classTrainingQuery.refetch()).data;
			}

			if (!resolution) {
				Alert.alert(
					'Workout unavailable',
					'The Workout Studio workout could not be opened.',
				);
				return;
			}

			if (resolution.status === 'resolved') {
				navigationStarted = true;
				navigation.push('Main', {
					screen: 'TrainingStack',
					params: {
						screen: 'TrainingWorkoutDetail',
						params: {
							workoutId: resolution.workoutId,
							initialTab,
						},
					},
				});
				return;
			}

			if (resolution.status === 'auth') {
				navigationStarted = true;
				navigation.push('Main', {
					screen: 'TrainingStack',
					params: { screen: 'TrainingActivate', params: {} },
				});
				return;
			}

			if (resolution.status === 'offline') {
				Alert.alert(
					'Workout Studio is offline',
					'Check your connection and try again.',
					[
						{ text: 'Cancel', style: 'cancel' },
						{
							text: 'Retry',
							onPress: () => void openTrainingWorkout(initialTab),
						},
					],
				);
				return;
			}

			let alertTitle = 'Workout unavailable';
			let alertMessage =
				'The Workout Studio workout could not be opened.';
			if (resolution.status === 'ambiguous') {
				alertTitle = 'Workout mapping conflict';
				alertMessage =
					'More than one Workout Studio workout is linked to this class. Please ask your gym team to correct the mapping.';
			} else if (resolution.status === 'not_mapped') {
				alertMessage =
					'No Workout Studio workout is linked to this class.';
			}
			Alert.alert(alertTitle, alertMessage);
		} finally {
			if (!navigationStarted) {
				trainingNavigationPending.current = false;
				setLoadingTab(null);
			}
		}
	};

	const openTrainingResults = () => {
		void openTrainingWorkout('leaderboard');
	};

	const handleTabChange = (tab: SessionTabsEnum) => {
		setActiveTab(tab);
	};

	useEffect(() => {
		if (isLimited) {
			setActiveTab(SessionTabsEnum.INFO);
		}
	}, [isLimited]);

	if (error) {
		return (
			<ScrollView style={styles.errorScreen}>
				<View style={styles.errorCard}>
					<Icon
						name="alert-circle-outline"
						size={28}
						color={memberTheme.colors.danger}
					/>
					<Text style={styles.errorText}>
						Could not load this session. Please try again.
					</Text>
				</View>
			</ScrollView>
		);
	}

	if (!isFetchedAfterMount) {
		return <SessionLoader />;
	}

	return (
		<View style={styles.container}>
			<View style={styles.heroCard}>
				<View style={styles.heroHeader}>
					<View style={styles.heroCopy}>
						<Text style={styles.eyebrow}>CLASS</Text>
						<Text style={styles.heroTitle}>{sessionTitle}</Text>
					</View>
					{isAttending || isWaitlist ? (
						<View style={styles.statusChip}>
							<Text style={styles.statusText}>
								{isAttending ? 'Booked' : 'Waitlisted'}
							</Text>
						</View>
					) : null}
				</View>
				<View style={styles.metaRow}>
					<Icon
						name="calendar-blank-outline"
						size={18}
						color={memberTheme.colors.primary}
					/>
					<Text style={styles.metaText}>
						{moment(startTime).format('ddd, D MMM · h:mm A')}
					</Text>
				</View>
				{session?.venue_name ? (
					<View style={styles.metaRow}>
						<Icon
							name="map-marker-outline"
							size={18}
							color={memberTheme.colors.primary}
						/>
						<Text style={styles.metaText}>
							{session.venue_name}
						</Text>
					</View>
				) : null}
			</View>

			<SessionActionButtons
				classId={classId}
				eventId={eventId}
				subscribed={subscribed}
				isAttending={isAttending}
				isWaitlist={isWaitlist}
				islocked={isBookingLocked}
				spotsLeft={spotsLeft}
				startTime={startTime}
				waitlistEnabled={!!waitlistEnabled}
				waitlistTime={Number(waitlistTime)}
				disableUnbooking={disableUnbooking}
				waitlistNumber={waitlistNumber}
				waitlistLength={waitlistLength}
			/>

			<SessionTabButtons
				activeTab={activeTab}
				handleTabChange={handleTabChange}
				handleWorkoutPress={() => void openTrainingWorkout('overview')}
				handleResultsPress={openTrainingResults}
				loadingTab={loadingTab}
				subscribed={subscribed}
				isLimited={isLimited}
				allowLeaderboards={allowLeaderboards}
				attendanceView={attendanceView}
				bookedMembers={
					bookedMembers as SessionMemberAttendanceSchemaType[]
				}
				isStaff={!!loggedInUser?.user_data.is_staff}
			/>

			{activeTab === SessionTabsEnum.INFO ? (
				<SessionInformationTab
					session={session as SessionDetailSchemaType}
					todaySessionLoading={todaySessionLoading}
					todaySessionSummary={todaySessionSummary}
				/>
			) : null}

			{activeTab === SessionTabsEnum.ATTENDANCE ? (
				<SessionAttendanceTab
					session={session as SessionDetailSchemaType}
				/>
			) : null}
		</View>
	);
};

export default Session;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: memberTheme.colors.background,
	},
	heroCard: {
		margin: memberTheme.spacing.md,
		marginBottom: memberTheme.spacing.sm,
		padding: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.lg,
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderColor: memberTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
	},
	heroHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		gap: memberTheme.spacing.md,
		marginBottom: memberTheme.spacing.md,
	},
	heroCopy: { flex: 1 },
	eyebrow: {
		color: memberTheme.colors.primary,
		fontSize: 11,
		fontWeight: '800',
		letterSpacing: 1.2,
		marginBottom: memberTheme.spacing.xs,
	},
	heroTitle: {
		color: memberTheme.colors.text,
		fontSize: 24,
		fontWeight: '800',
	},
	statusChip: {
		paddingHorizontal: memberTheme.spacing.md,
		paddingVertical: 6,
		borderRadius: memberTheme.radius.pill,
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	statusText: {
		color: memberTheme.colors.success,
		fontSize: 12,
		fontWeight: '700',
	},
	metaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: memberTheme.spacing.sm,
		marginTop: memberTheme.spacing.xs,
	},
	metaText: {
		flex: 1,
		color: memberTheme.colors.textMuted,
		fontSize: 14,
	},
	errorScreen: {
		flex: 1,
		backgroundColor: memberTheme.colors.background,
	},
	errorCard: {
		margin: memberTheme.spacing.lg,
		padding: memberTheme.spacing.lg,
		gap: memberTheme.spacing.sm,
		alignItems: 'center',
		borderRadius: memberTheme.radius.md,
		backgroundColor: memberTheme.colors.surface,
	},
	errorText: {
		color: memberTheme.colors.textMuted,
		textAlign: 'center',
	},
});
