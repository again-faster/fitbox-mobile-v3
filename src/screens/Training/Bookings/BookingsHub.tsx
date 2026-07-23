/* eslint-disable no-nested-ternary */
import { useMemo, useState } from 'react';
import {
	Alert,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import {
	bookingApi,
	type BookingProvider,
	type BookingResource,
	type BookingService,
	type MemberBooking,
} from '@/services/workoutStudio/bookings';
import { trainingTheme } from '@/theme/training';
import SkeletonCard from '../components/SkeletonCard';
import TrainingState from '../components/TrainingState';
import BookingComposer from './BookingComposer';

type Tab = 'pt' | 'treatment' | 'resource' | 'mine';
type BookingSelection = {
	service: BookingService;
	provider?: BookingProvider;
	resource?: BookingResource;
	booking?: MemberBooking;
};
const TABS: Array<{ key: Tab; label: string }> = [
	{ key: 'pt', label: 'PT' },
	{ key: 'treatment', label: 'Treatments' },
	{ key: 'resource', label: 'Resources' },
	{ key: 'mine', label: 'My Bookings' },
];

const BookingsHub = () => {
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const [tab, setTab] = useState<Tab>('pt');
	const [selection, setSelection] = useState<BookingSelection | null>(null);
	const services = useQuery({
		queryKey: ['ws-bookable-service-types', tenantId],
		queryFn: () => bookingApi.services(tenantId!),
		enabled: !!tenantId,
		staleTime: 300_000,
	});
	const ptProviders = useQuery({
		queryKey: ['ws-booking-providers', tenantId, 'pt'],
		queryFn: () => bookingApi.providers(tenantId!, 'pt'),
		enabled: !!tenantId,
		staleTime: 300_000,
	});
	const treatmentProviders = useQuery({
		queryKey: ['ws-booking-providers', tenantId, 'treatment'],
		queryFn: () => bookingApi.providers(tenantId!, 'treatment'),
		enabled: !!tenantId,
		staleTime: 300_000,
	});
	const resources = useQuery({
		queryKey: ['ws-bookable-resources', tenantId],
		queryFn: () => bookingApi.resources(tenantId!),
		enabled: !!tenantId,
		staleTime: 300_000,
	});
	const bookings = useQuery({
		queryKey: ['ws-member-bookings', uid],
		queryFn: () => bookingApi.mine('all', 100),
		enabled: !!uid,
		staleTime: 60_000,
	});
	const refresh = () => {
		void services.refetch();
		void ptProviders.refetch();
		void treatmentProviders.refetch();
		void resources.refetch();
		void bookings.refetch();
	};
	const typeMap = useMemo(
		() => new Map((services.data ?? []).map(type => [type.id, type])),
		[services.data],
	);
	const providerRows =
		tab === 'treatment' ? treatmentProviders.data : ptProviders.data;
	const providers = useMemo(
		() =>
			(providerRows ?? [])
				.map(provider => ({
					...provider,
					offered: provider.serviceTypeIds
						.map(id => typeMap.get(id))
						.filter(
							(type): type is BookingService =>
								!!type && type.service_kind === tab,
						),
				}))
				.filter(row => row.offered.length > 0),
		[providerRows, typeMap, tab],
	);
	const loading =
		tab === 'mine'
			? bookings.isLoading
			: tab === 'resource'
				? services.isLoading || resources.isLoading
				: services.isLoading ||
					(tab === 'pt'
						? ptProviders.isLoading
						: treatmentProviders.isLoading);
	const hasError =
		tab === 'mine'
			? bookings.isError
			: tab === 'resource'
				? services.isError || resources.isError
				: services.isError ||
					(tab === 'pt'
						? ptProviders.isError
						: treatmentProviders.isError);
	const activeError =
		tab === 'mine'
			? bookings.error
			: tab === 'resource'
				? (resources.error ?? services.error)
				: (services.error ??
					(tab === 'pt'
						? ptProviders.error
						: treatmentProviders.error));
	const beginReschedule = (booking: MemberBooking) => {
		const service = booking.serviceType
			? typeMap.get(booking.serviceType.id)
			: undefined;
		const provider = booking.provider
			? [
					...(ptProviders.data ?? []),
					...(treatmentProviders.data ?? []),
				].find(item => item.providerId === booking.provider?.id)
			: undefined;
		const resource = booking.resource
			? (resources.data ?? []).find(
					item => item.id === booking.resource?.id,
				)
			: undefined;

		if (!service || (!provider && !resource)) {
			Alert.alert(
				'Reschedule unavailable',
				'This booking no longer has an active bookable service.',
			);
			return;
		}
		setSelection({ service, provider, resource, booking });
	};

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
			refreshControl={
				<RefreshControl
					refreshing={
						services.isRefetching ||
						ptProviders.isRefetching ||
						treatmentProviders.isRefetching ||
						resources.isRefetching ||
						bookings.isRefetching
					}
					onRefresh={refresh}
					tintColor={trainingTheme.colors.primary}
				/>
			}
		>
			<View>
				<Text style={styles.title}>Bookings</Text>
				<Text style={styles.subtitle}>
					Book personal training, treatments and gym resources.
				</Text>
			</View>
			{selection ? (
				<BookingComposer
					service={selection.service}
					provider={selection.provider}
					resource={selection.resource}
					booking={selection.booking}
					onClose={() => setSelection(null)}
					onBooked={() => {
						setSelection(null);
						setTab('mine');
					}}
				/>
			) : (
				<>
					<View style={styles.tabs}>
						{TABS.map(item => (
							<TouchableOpacity
								key={item.key}
								accessibilityRole="tab"
								accessibilityState={{
									selected: tab === item.key,
								}}
								onPress={() => setTab(item.key)}
								style={[
									styles.tab,
									tab === item.key && styles.tabSelected,
								]}
							>
								<Text
									style={[
										styles.tabText,
										tab === item.key &&
											styles.tabTextSelected,
									]}
								>
									{item.label}
								</Text>
							</TouchableOpacity>
						))}
					</View>
					{loading ? (
						<>
							<SkeletonCard />
							<SkeletonCard />
						</>
					) : hasError ? (
						<TrainingState
							kind="error"
							title="Bookings couldn't load"
							message={
								__DEV__ && activeError instanceof Error
									? activeError.message
									: 'Check your connection and try again.'
							}
							actionLabel="Try again"
							onAction={refresh}
						/>
					) : tab === 'resource' ? (
						<ResourceList
							resources={resources.data ?? []}
							serviceTypes={services.data ?? []}
							onSelect={(resource, service) =>
								setSelection({ resource, service })
							}
						/>
					) : tab === 'mine' ? (
						<BookingList
							bookings={bookings.data ?? []}
							onReschedule={beginReschedule}
						/>
					) : (
						<ProviderList
							providers={providers}
							kind={tab}
							onSelect={(provider, service) =>
								setSelection({ provider, service })
							}
						/>
					)}
				</>
			)}
		</ScrollView>
	);
};

const ProviderList = ({
	providers,
	kind,
	onSelect,
}: {
	providers: Array<BookingProvider & { offered: BookingService[] }>;
	kind: 'pt' | 'treatment';
	onSelect: (provider: BookingProvider, service: BookingService) => void;
}) =>
	providers.length === 0 ? (
		<TrainingState
			kind="empty"
			title={`No ${kind === 'pt' ? 'PT providers' : 'treatments'} available`}
			message="Your gym has not made any providers bookable yet."
		/>
	) : (
		<>
			{providers.map(row => (
				<View key={row.providerId} style={styles.card}>
					<View style={styles.avatar}>
						<Text style={styles.avatarText}>
							{row.name.charAt(0).toUpperCase()}
						</Text>
					</View>
					<View style={styles.copy}>
						<Text style={styles.cardTitle}>{row.name}</Text>
						{row.bio ? (
							<Text style={styles.body}>{row.bio}</Text>
						) : null}
						{row.offered.map(type => (
							<TouchableOpacity
								key={type.id}
								onPress={() => onSelect(row, type)}
								style={styles.serviceRow}
								accessibilityRole="button"
							>
								<View style={styles.copy}>
									<Text style={styles.serviceName}>
										{type.name}
									</Text>
									<Text style={styles.meta}>
										{type.duration_minutes} min ·{' '}
										{type.payment_model === 'pt_credit'
											? 'PT credit'
											: type.payment_model ===
												  'paid_external'
												? 'Paid at reception'
												: 'Free'}
									</Text>
								</View>
								<Ionicons
									name="chevron-right"
									size={19}
									color={trainingTheme.colors.textMuted}
								/>
							</TouchableOpacity>
						))}
					</View>
				</View>
			))}
		</>
	);
const ResourceList = ({
	resources,
	serviceTypes,
	onSelect,
}: {
	resources: BookingResource[];
	serviceTypes: BookingService[];
	onSelect: (resource: BookingResource, service: BookingService) => void;
}) =>
	resources.length === 0 ? (
		<TrainingState
			kind="empty"
			title="No resources available"
			message="Your gym has not made any resources bookable yet."
		/>
	) : (
		<>
			{resources.map(resource => {
				const types = serviceTypes.filter(
					type =>
						type.service_kind === 'resource' &&
						type.resource_id === resource.id,
				);
				return (
					<View key={resource.id} style={styles.card}>
						<View style={styles.resourceIcon}>
							<Ionicons
								name="calendar-clock"
								size={22}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<View style={styles.copy}>
							<Text style={styles.cardTitle}>
								{resource.name}
							</Text>
							<Text style={styles.meta}>
								{resource.capacity > 1
									? `${resource.capacity} seats`
									: 'Exclusive slot'}{' '}
								· {resource.kind}
							</Text>
							{resource.notes ? (
								<Text style={styles.body}>
									{resource.notes}
								</Text>
							) : null}
							{types.map(type => (
								<TouchableOpacity
									key={type.id}
									accessibilityRole="button"
									onPress={() => onSelect(resource, type)}
									style={styles.serviceRow}
								>
									<View style={styles.copy}>
										<Text style={styles.serviceName}>
											{type.name}
										</Text>
										<Text style={styles.meta}>
											{type.duration_minutes} min
										</Text>
									</View>
									<Ionicons
										name="chevron-right"
										size={19}
										color={trainingTheme.colors.textMuted}
									/>
								</TouchableOpacity>
							))}
						</View>
					</View>
				);
			})}
		</>
	);
const BookingList = ({
	bookings,
	onReschedule,
}: {
	bookings: MemberBooking[];
	onReschedule: (booking: MemberBooking) => void;
}) => {
	const client = useQueryClient();
	const cancel = useMutation({
		mutationFn: (appointmentId: string) => bookingApi.cancel(appointmentId),
		onSuccess: async () => {
			await client.invalidateQueries({
				queryKey: ['ws-member-bookings'],
			});
		},
		onError: error => {
			Alert.alert(
				'Cancellation failed',
				error instanceof Error ? error.message : 'Please try again.',
			);
		},
	});
	const requestCancel = (item: MemberBooking) => {
		Alert.alert(
			'Cancel booking?',
			`${item.serviceType?.name ?? item.resource?.name ?? 'This booking'} on ${moment(item.startAt).format('dddd, D MMMM [at] h:mm A')}`,
			[
				{ text: 'Keep booking', style: 'cancel' },
				{
					text: 'Cancel booking',
					style: 'destructive',
					onPress: () => cancel.mutate(item.id),
				},
			],
		);
	};
	return bookings.length === 0 ? (
		<TrainingState
			kind="empty"
			title="No bookings yet"
			message="Your upcoming and past bookings will appear here."
		/>
	) : (
		<>
			{bookings.map(item => (
				<View key={item.id} style={styles.booking}>
					<View style={styles.bookingMain}>
						<View style={styles.date}>
							<Text style={styles.month}>
								{moment(item.startAt)
									.format('MMM')
									.toUpperCase()}
							</Text>
							<Text style={styles.day}>
								{moment(item.startAt).format('D')}
							</Text>
						</View>
						<View style={styles.copy}>
							<Text style={styles.cardTitle}>
								{item.serviceType?.name ??
									item.resource?.name ??
									'Booking'}
							</Text>
							<Text style={styles.body}>
								{moment(item.startAt).format('dddd, h:mm A')} –{' '}
								{moment(item.endAt).format('h:mm A')}
							</Text>
							{item.provider ? (
								<Text style={styles.meta}>
									{item.provider.name}
								</Text>
							) : item.resource ? (
								<Text style={styles.meta}>
									{item.resource.name}
								</Text>
							) : null}
						</View>
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{item.status}</Text>
						</View>
					</View>
					{item.canCancel || item.canReschedule ? (
						<View style={styles.bookingActions}>
							{item.canReschedule ? (
								<TouchableOpacity
									accessibilityRole="button"
									onPress={() => onReschedule(item)}
									style={styles.rescheduleButton}
								>
									<Text style={styles.rescheduleText}>
										Reschedule
									</Text>
								</TouchableOpacity>
							) : null}
							{item.canCancel ? (
								<TouchableOpacity
									accessibilityRole="button"
									onPress={() => requestCancel(item)}
									disabled={cancel.isPending}
									style={styles.cancelButton}
								>
									<Text style={styles.cancelText}>
										{cancel.isPending &&
										cancel.variables === item.id
											? 'Cancelling…'
											: 'Cancel'}
									</Text>
								</TouchableOpacity>
							) : null}
						</View>
					) : null}
				</View>
			))}
		</>
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
		marginTop: 4,
	},
	tabs: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	tab: {
		flexBasis: '48%',
		flexGrow: 1,
		minHeight: 42,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15,
		borderRadius: 999,
		backgroundColor: trainingTheme.colors.surfaceMuted,
	},
	tabSelected: { backgroundColor: trainingTheme.colors.primary },
	tabText: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		fontWeight: '600',
	},
	tabTextSelected: { color: '#FFFFFF' },
	card: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		padding: 14,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		backgroundColor: trainingTheme.colors.surface,
	},
	avatar: {
		width: 46,
		height: 46,
		borderRadius: 23,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primary,
	},
	avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
	resourceIcon: {
		width: 46,
		height: 46,
		borderRadius: 23,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	copy: { flex: 1 },
	cardTitle: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '700',
	},
	body: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 17,
		marginTop: 3,
	},
	meta: {
		color: trainingTheme.colors.textMuted,
		fontSize: 11,
		marginTop: 4,
		textTransform: 'capitalize',
	},
	serviceRow: {
		minHeight: 48,
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: trainingTheme.colors.border,
	},
	serviceName: {
		color: trainingTheme.colors.primary,
		fontSize: 13,
		fontWeight: '600',
		marginTop: 7,
	},
	booking: {
		minHeight: 82,
		padding: 13,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		backgroundColor: trainingTheme.colors.surface,
	},
	bookingMain: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	bookingActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: trainingTheme.spacing.sm,
		marginTop: trainingTheme.spacing.md,
		paddingTop: trainingTheme.spacing.md,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: trainingTheme.colors.border,
	},
	date: { width: 42, alignItems: 'center' },
	month: {
		color: trainingTheme.colors.primary,
		fontSize: 10,
		fontWeight: '700',
	},
	day: { color: trainingTheme.colors.text, fontSize: 22, fontWeight: '700' },
	badge: {
		paddingHorizontal: 8,
		paddingVertical: 5,
		borderRadius: 999,
		backgroundColor: trainingTheme.colors.surfaceMuted,
	},
	badgeText: {
		color: trainingTheme.colors.textMuted,
		fontSize: 10,
		fontWeight: '700',
		textTransform: 'capitalize',
	},
	cancelButton: {
		paddingHorizontal: 10,
		paddingVertical: 7,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: trainingTheme.colors.danger,
	},
	cancelText: {
		color: trainingTheme.colors.danger,
		fontSize: 12,
		fontWeight: '700',
	},
	rescheduleButton: {
		paddingHorizontal: 10,
		paddingVertical: 7,
		borderRadius: 10,
		borderWidth: 1,
		borderColor: trainingTheme.colors.primary,
	},
	rescheduleText: {
		color: trainingTheme.colors.primary,
		fontSize: 12,
		fontWeight: '700',
	},
});
export default BookingsHub;
