/* eslint-disable no-nested-ternary */
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import {
	bookingApi,
	type BookingProvider,
	type BookingResource,
	type BookingService,
	type BookingSlot,
	type MemberBooking,
} from '@/services/workoutStudio/bookings';
import { trainingTheme } from '@/theme/training';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import moment from 'moment';
import { useMemo, useState } from 'react';
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import TrainingState from '../components/TrainingState';

type Props = {
	service: BookingService;
	provider?: BookingProvider;
	resource?: BookingResource;
	booking?: MemberBooking;
	onClose: () => void;
	onBooked: () => void;
};

const paymentLabel = (service: BookingService) => {
	if (service.payment_model === 'free') return 'Free';
	if (service.payment_model === 'paid_external') return 'Paid at reception';
	return 'PT credit';
};

const BookingComposer = ({
	service,
	provider,
	resource,
	booking,
	onClose,
	onBooked,
}: Props) => {
	const tenantId = getStoredWSSession()?.user.active_tenant_id;
	const client = useQueryClient();
	const [date, setDate] = useState(
		moment().add(1, 'day').format('YYYY-MM-DD'),
	);
	const [selected, setSelected] = useState<BookingSlot | null>(null);
	const from = useMemo(() => moment().startOf('day').toISOString(), []);
	const to = useMemo(
		() => moment().add(14, 'days').endOf('day').toISOString(),
		[],
	);
	const days = useMemo(
		() =>
			Array.from({ length: 14 }, (_, index) =>
				moment().add(index + 1, 'day'),
			),
		[],
	);
	const targetName = provider?.name ?? resource?.name ?? 'Your gym';
	const isRescheduling = !!booking;
	const heading = isRescheduling
		? 'Reschedule booking'
		: service.service_kind === 'pt'
			? 'Book PT'
			: service.service_kind === 'treatment'
				? 'Book treatment'
				: 'Book resource';

	const slots = useQuery({
		queryKey: [
			'ws-booking-slots',
			tenantId,
			service.id,
			provider?.providerId,
			resource?.id,
		],
		queryFn: () =>
			bookingApi.slots({
				tenantId: tenantId!,
				serviceTypeId: service.id,
				providerId: provider?.providerId,
				resourceId: resource?.id,
				dateFromIso: from,
				dateToIso: to,
			}),
		enabled: !!tenantId && (!!provider || !!resource),
		staleTime: 30_000,
	});
	const visible = useMemo(
		() =>
			(slots.data ?? []).filter(
				slot => moment(slot.startAt).format('YYYY-MM-DD') === date,
			),
		[date, slots.data],
	);
	const save = useMutation({
		mutationFn: () =>
			isRescheduling
				? bookingApi.reschedule(booking.id, selected!.startAt)
				: bookingApi.create({
						tenantId: tenantId!,
						serviceTypeId: service.id,
						providerId: provider?.providerId,
						resourceId: resource?.id,
						startAtIso: selected!.startAt,
						capacityUsed: 1,
						timezone: 'Australia/Sydney',
					}),
		onSuccess: async () => {
			await client.invalidateQueries({
				queryKey: ['ws-member-bookings'],
			});
			onBooked();
		},
	});

	return (
		<View style={styles.wrap}>
			<View style={styles.header}>
				<TouchableOpacity onPress={onClose} accessibilityRole="button">
					<Text style={styles.back}>‹ Back</Text>
				</TouchableOpacity>
				<Text style={styles.title}>{heading}</Text>
			</View>

			<View style={styles.summary}>
				<Text style={styles.service}>{service.name}</Text>
				<Text style={styles.meta}>
					{targetName} · {service.duration_minutes} min ·{' '}
					{paymentLabel(service)}
				</Text>
				{isRescheduling ? (
					<Text style={styles.currentBooking}>
						Currently{' '}
						{moment(booking.startAt).format('ddd, D MMM · h:mm A')}
					</Text>
				) : null}
			</View>

			<Text style={styles.label}>Choose a date</Text>
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.days}
			>
				{days.map(day => {
					const key = day.format('YYYY-MM-DD');
					const active = key === date;
					return (
						<TouchableOpacity
							key={key}
							onPress={() => {
								setDate(key);
								setSelected(null);
							}}
							style={[styles.day, active && styles.active]}
						>
							<Text
								style={[styles.small, active && styles.white]}
							>
								{day.format('ddd')}
							</Text>
							<Text
								style={[styles.number, active && styles.white]}
							>
								{day.format('D')}
							</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			<Text style={styles.label}>Available times</Text>
			{slots.isLoading ? (
				<ActivityIndicator color={trainingTheme.colors.primary} />
			) : slots.isError ? (
				<TrainingState
					kind="error"
					title="Times couldn't load"
					message={
						slots.error instanceof Error
							? slots.error.message
							: 'Try again.'
					}
					actionLabel="Try again"
					onAction={() => void slots.refetch()}
				/>
			) : visible.length === 0 ? (
				<TrainingState
					kind="empty"
					title="No times available"
					message="Choose another date."
				/>
			) : (
				<View style={styles.times}>
					{visible.map(slot => {
						const active = selected?.startAt === slot.startAt;
						return (
							<TouchableOpacity
								key={slot.startAt}
								onPress={() => setSelected(slot)}
								style={[styles.time, active && styles.active]}
							>
								<Text
									style={[
										styles.timeText,
										active && styles.white,
									]}
								>
									{moment(slot.startAt).format('h:mm A')}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			)}

			{selected ? (
				<View style={styles.review}>
					<Text style={styles.reviewTitle}>
						{isRescheduling ? 'Confirm new time' : 'Review booking'}
					</Text>
					<Text style={styles.meta}>
						{moment(selected.startAt).format(
							'dddd, D MMMM · h:mm A',
						)}
						–{moment(selected.endAt).format('h:mm A')}
					</Text>
					{save.isError ? (
						<Text style={styles.error}>
							{save.error instanceof Error
								? save.error.message
								: 'Booking failed.'}
						</Text>
					) : null}
					<TouchableOpacity
						disabled={save.isPending}
						onPress={() => save.mutate()}
						style={[
							styles.confirm,
							save.isPending && styles.disabled,
						]}
					>
						<Text style={styles.confirmText}>
							{save.isPending
								? isRescheduling
									? 'Rescheduling…'
									: 'Booking…'
								: isRescheduling
									? 'Confirm new time'
									: 'Confirm booking'}
						</Text>
					</TouchableOpacity>
				</View>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create({
	wrap: { gap: trainingTheme.spacing.md },
	header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
	back: {
		color: trainingTheme.colors.primary,
		fontSize: 16,
		fontWeight: '600',
	},
	title: {
		color: trainingTheme.colors.text,
		fontSize: 24,
		fontWeight: '700',
	},
	summary: {
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		...trainingTheme.shadow,
	},
	service: {
		color: trainingTheme.colors.text,
		fontSize: 18,
		fontWeight: '700',
	},
	meta: { color: trainingTheme.colors.textMuted, marginTop: 4 },
	currentBooking: {
		color: trainingTheme.colors.primary,
		fontSize: 12,
		fontWeight: '600',
		marginTop: trainingTheme.spacing.sm,
	},
	label: {
		color: trainingTheme.colors.text,
		fontSize: 16,
		fontWeight: '700',
	},
	days: { gap: trainingTheme.spacing.sm },
	day: {
		width: 58,
		height: 66,
		borderRadius: trainingTheme.radius.md,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.surfaceMuted,
	},
	active: { backgroundColor: trainingTheme.colors.primary },
	small: { color: trainingTheme.colors.textMuted, fontSize: 12 },
	number: {
		color: trainingTheme.colors.text,
		fontSize: 20,
		fontWeight: '700',
		marginTop: 3,
	},
	white: { color: '#FFFFFF' },
	times: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
	time: {
		minWidth: 92,
		padding: 11,
		borderRadius: trainingTheme.radius.sm,
		alignItems: 'center',
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	timeText: { color: trainingTheme.colors.text, fontWeight: '600' },
	review: {
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.successSoft,
	},
	reviewTitle: {
		color: trainingTheme.colors.text,
		fontSize: 17,
		fontWeight: '700',
	},
	confirm: {
		marginTop: trainingTheme.spacing.md,
		minHeight: 50,
		borderRadius: trainingTheme.radius.sm,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primary,
	},
	confirmText: { color: '#FFFFFF', fontWeight: '700' },
	error: { color: trainingTheme.colors.danger, marginTop: 8 },
	disabled: { opacity: 0.6 },
});

export default BookingComposer;
