/* eslint-disable no-nested-ternary */
import { useMemo, useState } from 'react';
import {
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
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

type Props = StackScreenProps<TrainingStackParamList, 'TrainingPT'>;
type Tab = 'book' | 'mine';
type AppointmentType = {
	id: string;
	name: string;
	description: string | null;
	duration_minutes: number;
	delivery_mode: 'in_person' | 'remote' | 'hybrid';
	location_type: string | null;
	max_clients: number;
};
type Participant = { appointment_id: string };
type Appointment = {
	id: string;
	start_at: string;
	end_at: string;
	status: 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
	location: string | null;
	cancellation_reason: string | null;
	pt_appointment_types: { name: string; description: string | null } | null;
};
const STATUS: Record<
	Appointment['status'],
	{ label: string; color: string; background: string }
> = {
	requested: {
		label: 'Requested',
		color: trainingTheme.colors.warning,
		background: trainingTheme.colors.warningSoft,
	},
	confirmed: {
		label: 'Confirmed',
		color: trainingTheme.colors.success,
		background: trainingTheme.colors.successSoft,
	},
	completed: {
		label: 'Completed',
		color: trainingTheme.colors.primary,
		background: trainingTheme.colors.primarySoft,
	},
	cancelled: {
		label: 'Cancelled',
		color: trainingTheme.colors.textMuted,
		background: trainingTheme.colors.surfaceMuted,
	},
	no_show: {
		label: 'No show',
		color: trainingTheme.colors.danger,
		background: '#FDECEA',
	},
};

const PersonalTraining = ({ route }: Props) => {
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const [tab, setTab] = useState<Tab>(route.params?.initialTab ?? 'book');
	const types = useQuery({
		queryKey: ['ws-pt-types', tenantId],
		queryFn: () =>
			wsApi()
				.get('pt_appointment_types', {
					searchParams: {
						select: 'id,name,description,duration_minutes,delivery_mode,location_type,max_clients',
						tenant_id: `eq.${tenantId}`,
						active: 'eq.true',
						order: 'name.asc',
					},
				})
				.json<AppointmentType[]>(),
		enabled: !!tenantId,
		staleTime: 300_000,
	});
	const participants = useQuery({
		queryKey: ['ws-pt-participants', uid],
		queryFn: () =>
			wsApi()
				.get('pt_appointment_participants', {
					searchParams: {
						select: 'appointment_id',
						member_id: `eq.${uid}`,
					},
				})
				.json<Participant[]>(),
		enabled: !!uid,
		staleTime: 60_000,
	});
	const ids = useMemo(
		() => (participants.data ?? []).map(item => item.appointment_id),
		[participants.data],
	);
	const appointments = useQuery({
		queryKey: ['ws-pt-appointments', uid, ids.join(',')],
		queryFn: () =>
			wsApi()
				.get('pt_appointments', {
					searchParams: {
						select: 'id,start_at,end_at,status,location,cancellation_reason,pt_appointment_types(name,description)',
						id: `in.(${ids.join(',')})`,
						start_at: `gte.${moment().subtract(30, 'days').toISOString()}`,
						order: 'start_at.asc',
					},
				})
				.json<Appointment[]>(),
		enabled: ids.length > 0,
		staleTime: 60_000,
	});
	const refresh = () => {
		void types.refetch();
		void participants.refetch();
		if (ids.length > 0) void appointments.refetch();
	};
	const refreshing =
		types.isRefetching ||
		participants.isRefetching ||
		appointments.isRefetching;
	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					tintColor={trainingTheme.colors.primary}
				/>
			}
		>
			<View>
				<Text style={styles.title}>Personal Training</Text>
				<Text style={styles.subtitle}>
					Discover sessions offered by your gym and keep track of your
					appointments.
				</Text>
			</View>
			<View style={styles.tabs}>
				{(['book', 'mine'] as const).map(key => (
					<TouchableOpacity
						key={key}
						accessibilityRole="tab"
						accessibilityState={{ selected: tab === key }}
						onPress={() => setTab(key)}
						style={[styles.tab, tab === key && styles.tabSelected]}
					>
						<Text
							style={[
								styles.tabLabel,
								tab === key && styles.tabLabelSelected,
							]}
						>
							{key === 'book' ? 'Book PT' : 'My PT'}
						</Text>
					</TouchableOpacity>
				))}
			</View>
			{tab === 'book' ? (
				<>
					<Text style={styles.sectionTitle}>Available sessions</Text>
					{types.isLoading ? (
						<>
							<SkeletonCard />
							<SkeletonCard />
						</>
					) : types.isError ? (
						<TrainingState
							kind="error"
							title="PT sessions couldn't load"
							message="Check your connection and try again."
							actionLabel="Try again"
							onAction={() => void types.refetch()}
						/>
					) : (types.data?.length ?? 0) === 0 ? (
						<TrainingState
							kind="empty"
							title="No PT sessions available"
							message="Your gym has not published any bookable PT session types yet."
						/>
					) : (
						types.data?.map(item => (
							<View key={item.id} style={styles.serviceCard}>
								<View style={styles.serviceIcon}>
									<Ionicons
										name="account-supervisor-outline"
										size={23}
										color={trainingTheme.colors.primary}
									/>
								</View>
								<View style={styles.copy}>
									<Text style={styles.serviceName}>
										{item.name}
									</Text>
									{item.description ? (
										<Text style={styles.description}>
											{item.description}
										</Text>
									) : null}
									<View style={styles.metaRow}>
										<Text style={styles.meta}>
											{item.duration_minutes} min
										</Text>
										<Text style={styles.dot}>·</Text>
										<Text style={styles.meta}>
											{item.delivery_mode.replace(
												'_',
												' ',
											)}
										</Text>
										{item.max_clients > 1 ? (
											<>
												<Text style={styles.dot}>
													·
												</Text>
												<Text style={styles.meta}>
													Up to {item.max_clients}
												</Text>
											</>
										) : null}
									</View>
								</View>
							</View>
						))
					)}
					<View style={styles.info}>
						<Ionicons
							name="shield-check-outline"
							size={20}
							color={trainingTheme.colors.warning}
						/>
						<Text style={styles.infoText}>
							Coach availability, conflicts and PT credits must be
							confirmed by Workout Studio before a booking is
							created. Native slot confirmation will be enabled
							through that secure server flow.
						</Text>
					</View>
				</>
			) : (
				<>
					<Text style={styles.sectionTitle}>Upcoming and recent</Text>
					{participants.isLoading ||
					(ids.length > 0 && appointments.isLoading) ? (
						<>
							<SkeletonCard />
							<SkeletonCard />
						</>
					) : participants.isError || appointments.isError ? (
						<TrainingState
							kind="error"
							title="Your PT sessions couldn't load"
							message="Check your connection and try again."
							actionLabel="Try again"
							onAction={refresh}
						/>
					) : ids.length === 0 ||
					  (appointments.data?.length ?? 0) === 0 ? (
						<TrainingState
							kind="empty"
							title="No PT sessions yet"
							message="Your requested, confirmed and recent PT appointments will appear here."
							actionLabel="Browse PT"
							onAction={() => setTab('book')}
						/>
					) : (
						appointments.data?.map(item => {
							const state = STATUS[item.status];
							return (
								<View key={item.id} style={styles.appointment}>
									<View style={styles.dateTile}>
										<Text style={styles.month}>
											{moment(item.start_at)
												.format('MMM')
												.toUpperCase()}
										</Text>
										<Text style={styles.day}>
											{moment(item.start_at).format('D')}
										</Text>
									</View>
									<View style={styles.copy}>
										<Text style={styles.serviceName}>
											{item.pt_appointment_types?.name ??
												'PT Session'}
										</Text>
										<Text style={styles.description}>
											{moment(item.start_at).format(
												'dddd, h:mm A',
											)}{' '}
											–{' '}
											{moment(item.end_at).format(
												'h:mm A',
											)}
										</Text>
										{item.location ? (
											<Text style={styles.meta}>
												{item.location}
											</Text>
										) : null}
									</View>
									<View
										style={[
											styles.status,
											{
												backgroundColor:
													state.background,
											},
										]}
									>
										<Text
											style={[
												styles.statusText,
												{ color: state.color },
											]}
										>
											{state.label}
										</Text>
									</View>
								</View>
							);
						})
					)}
				</>
			)}
		</ScrollView>
	);
};
const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	container: { padding: 16, paddingBottom: 48, gap: 14 },
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
	tabs: {
		flexDirection: 'row',
		padding: 4,
		borderRadius: 12,
		backgroundColor: trainingTheme.colors.surfaceMuted,
	},
	tab: {
		flex: 1,
		minHeight: 42,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 9,
	},
	tabSelected: { backgroundColor: trainingTheme.colors.surface },
	tabLabel: {
		color: trainingTheme.colors.textMuted,
		fontSize: 14,
		fontWeight: '600',
	},
	tabLabelSelected: { color: trainingTheme.colors.primary },
	sectionTitle: {
		color: trainingTheme.colors.text,
		fontSize: 17,
		fontWeight: '700',
	},
	serviceCard: {
		minHeight: 98,
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		padding: 14,
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	serviceIcon: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	copy: { flex: 1 },
	serviceName: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '700',
	},
	description: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 17,
		marginTop: 3,
	},
	metaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap',
		marginTop: 7,
	},
	meta: { color: trainingTheme.colors.textMuted, fontSize: 11 },
	dot: { color: trainingTheme.colors.textMuted, marginHorizontal: 5 },
	info: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 10,
		padding: 13,
		borderRadius: 14,
		backgroundColor: trainingTheme.colors.warningSoft,
	},
	infoText: { flex: 1, color: '#805000', fontSize: 12, lineHeight: 18 },
	appointment: {
		minHeight: 82,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		padding: 13,
		borderRadius: 16,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	dateTile: { width: 43, alignItems: 'center' },
	month: {
		color: trainingTheme.colors.primary,
		fontSize: 10,
		fontWeight: '700',
	},
	day: { color: trainingTheme.colors.text, fontSize: 22, fontWeight: '700' },
	status: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
	statusText: { fontSize: 10, fontWeight: '700' },
});
export default PersonalTraining;
