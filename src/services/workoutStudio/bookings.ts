import { Constant } from '@/utils';
import { getValidWSToken } from './auth';

export type BookingServiceKind = 'pt' | 'treatment' | 'resource';
export type BookingService = {
	id: string;
	name: string;
	description: string | null;
	duration_minutes: number;
	service_kind: BookingServiceKind;
	payment_model: 'pt_credit' | 'free' | 'paid_external';
	resource_id: string | null;
	cancellation_window_hours: number;
	buffer_before_minutes: number;
	buffer_after_minutes: number;
};
export type BookingProvider = {
	providerId: string;
	name: string;
	avatarUrl: string | null;
	bio: string | null;
	serviceTypeIds: string[];
};
export type BookingResource = {
	id: string;
	name: string;
	kind: string;
	capacity: number;
	notes: string | null;
	color: string | null;
};
export type BookingSlot = {
	startAt: string;
	endAt: string;
	remainingCapacity: number;
};
export type MemberBooking = {
	id: string;
	startAt: string;
	endAt: string;
	status: 'requested' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
	cancellationWindowHours: number;
	serviceType: {
		id: string;
		name: string;
		serviceKind: BookingServiceKind;
		paymentModel: string;
	} | null;
	provider: { id: string; name: string; avatarUrl: string | null } | null;
	resource: { id: string; name: string; kind: string } | null;
	canCancel: boolean;
	canReschedule: boolean;
};
export type BookingErrorCode =
	| 'unauthorized'
	| 'forbidden'
	| 'invalid_input'
	| 'not_found'
	| 'conflict'
	| 'cancellation_window'
	| 'credit_unavailable'
	| 'server_misconfigured'
	| 'internal';

export class BookingApiError extends Error {
	constructor(
		readonly code: BookingErrorCode,
		message: string,
		readonly status: number,
	) {
		super(message);
		this.name = 'BookingApiError';
	}
}

type Envelope<T> =
	| { ok: true; data: T }
	| { ok: false; error: { code: BookingErrorCode; message: string } };
const request = async <T>(
	path: string,
	options?: {
		method?: 'GET' | 'POST';
		query?: Record<string, string | undefined>;
		body?: unknown;
	},
): Promise<T> => {
	const token = await getValidWSToken();
	if (!token)
		throw new BookingApiError(
			'unauthorized',
			'Your Training session has expired.',
			401,
		);
	const query = Object.entries(options?.query ?? {})
		.filter((entry): entry is [string, string] => entry[1] !== undefined)
		.map(
			([key, value]) =>
				`${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
		)
		.join('&');
	const url = `${Constant.WS_MOBILE_API_URL}/bookings/${path}${query ? `?${query}` : ''}`;
	const response = await fetch(url, {
		method: options?.method ?? 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		...(options?.body !== undefined
			? { body: JSON.stringify(options.body) }
			: {}),
	});
	let envelope: Envelope<T>;
	try {
		envelope = (await response.json()) as Envelope<T>;
	} catch {
		throw new BookingApiError(
			'internal',
			'Workout Studio returned an invalid response.',
			response.status,
		);
	}
	if (!response.ok || !envelope.ok) {
		const error = envelope.ok
			? { code: 'internal' as const, message: 'Booking request failed.' }
			: envelope.error;
		throw new BookingApiError(error.code, error.message, response.status);
	}
	return envelope.data;
};

export const bookingApi = {
	services: (tenantId: string, serviceKind?: BookingServiceKind) =>
		request<BookingService[]>('services', {
			query: { tenantId, serviceKind },
		}),
	providers: (tenantId: string, serviceKind: 'pt' | 'treatment') =>
		request<BookingProvider[]>('providers', {
			query: { tenantId, serviceKind },
		}),
	resources: (tenantId: string) =>
		request<BookingResource[]>('resources', { query: { tenantId } }),
	slots: (params: {
		tenantId: string;
		serviceTypeId: string;
		providerId?: string;
		resourceId?: string;
		dateFromIso: string;
		dateToIso: string;
	}) => request<BookingSlot[]>('slots', { query: params }),
	mine: (scope: 'upcoming' | 'past' | 'all' = 'all', limit = 100) =>
		request<MemberBooking[]>('mine', {
			query: { scope, limit: String(limit) },
		}),
	create: (body: {
		tenantId: string;
		serviceTypeId: string;
		providerId?: string;
		resourceId?: string;
		startAtIso: string;
		capacityUsed: number;
		timezone: string;
		location?: string;
	}) =>
		request<{ appointmentId: string }>('create', { method: 'POST', body }),
	cancel: (appointmentId: string, reason?: string) =>
		request<{ cancelled: boolean }>('cancel', {
			method: 'POST',
			body: { appointmentId, reason },
		}),
	reschedule: (appointmentId: string, newStartAtIso: string) =>
		request<{ appointmentId: string; startAt: string; endAt: string }>(
			'reschedule',
			{ method: 'POST', body: { appointmentId, newStartAtIso } },
		),
};
