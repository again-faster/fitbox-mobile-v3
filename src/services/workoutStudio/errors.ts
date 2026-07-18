import { HTTPError, TimeoutError } from 'ky';

export type WSFailureKind =
	| 'unauthorized'
	| 'forbidden'
	| 'not_found'
	| 'rate_limited'
	| 'timeout'
	| 'server'
	| 'network'
	| 'unknown';

export class WSApiError extends Error {
	readonly kind: WSFailureKind;

	readonly status?: number;

	constructor(kind: WSFailureKind, message: string, status?: number) {
		super(message);
		this.name = 'WSApiError';
		this.kind = kind;
		this.status = status;
	}
}

export const toWSApiError = async (error: unknown): Promise<WSApiError> => {
	if (error instanceof WSApiError) return error;
	if (error instanceof TimeoutError) {
		return new WSApiError(
			'timeout',
			'Workout Studio took too long to respond.',
		);
	}
	if (error instanceof HTTPError) {
		const { status } = error.response;
		let detail = '';
		try {
			const body = (await error.response.clone().json()) as {
				message?: string;
				error?: string;
			};
			detail = body.message ?? body.error ?? '';
		} catch {
			// Some platform responses intentionally have no JSON body.
		}
		if (status === 401)
			return new WSApiError(
				'unauthorized',
				detail || 'Your Training session has expired.',
				status,
			);
		if (status === 403)
			return new WSApiError(
				'forbidden',
				detail || 'You do not have access to this Training data.',
				status,
			);
		if (status === 404)
			return new WSApiError(
				'not_found',
				detail || 'The requested Training item was not found.',
				status,
			);
		if (status === 429)
			return new WSApiError(
				'rate_limited',
				detail || 'Too many requests. Please wait and try again.',
				status,
			);
		if (status >= 500)
			return new WSApiError(
				'server',
				detail || 'Workout Studio is temporarily unavailable.',
				status,
			);
		return new WSApiError(
			'unknown',
			detail || 'The Training request could not be completed.',
			status,
		);
	}
	if (error instanceof TypeError) {
		return new WSApiError(
			'network',
			'Check your internet connection and try again.',
		);
	}
	return new WSApiError(
		'unknown',
		error instanceof Error ? error.message : 'Something went wrong.',
	);
};
