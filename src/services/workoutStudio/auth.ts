import { mmkvStorage } from '@/storage';
import { Constant } from '@/utils';
import {
	clearAppIntentCredentials,
	readAppIntentSession,
	syncAppIntentCredentials,
} from '@/services/appIntents/credentials';
import ky, { HTTPError } from 'ky';

const KEYS = {
	ACCESS_TOKEN: 'ws_access_token',
	REFRESH_TOKEN: 'ws_refresh_token',
	EXPIRES_AT: 'ws_expires_at',
	USER: 'ws_user',
} as const;

export type WSPersona = 'member' | 'solo' | 'coach' | 'gym_admin';

export type WSUser = {
	id: string;
	email: string;
	full_name: string;
	persona: WSPersona;
	active_tenant_id: string;
	tenant_role: string;
};

export type WSSession = {
	access_token: string;
	refresh_token: string;
	expires_at: number;
	user: WSUser;
};

export type WSAuthError =
	| 'NOT_FOUND'
	| 'NO_MEMBERSHIP'
	| 'RATE_LIMITED'
	| 'BAD_KEY'
	| 'NETWORK_ERROR'
	| 'UNKNOWN_GYM'
	| 'PROVISION_FAILED';

export const getStoredWSSession = (): WSSession | null => {
	const token = mmkvStorage.getString(KEYS.ACCESS_TOKEN);
	const refreshToken = mmkvStorage.getString(KEYS.REFRESH_TOKEN);
	const expiresAt = mmkvStorage.getNumber(KEYS.EXPIRES_AT);
	const userStr = mmkvStorage.getString(KEYS.USER);
	if (!token || !refreshToken || !expiresAt || !userStr) return null;
	return {
		access_token: token,
		refresh_token: refreshToken,
		expires_at: expiresAt,
		user: JSON.parse(userStr) as WSUser,
	};
};

export const saveWSSession = (session: WSSession) => {
	mmkvStorage.set(KEYS.ACCESS_TOKEN, session.access_token);
	mmkvStorage.set(KEYS.REFRESH_TOKEN, session.refresh_token);
	mmkvStorage.set(KEYS.EXPIRES_AT, session.expires_at);
	mmkvStorage.set(KEYS.USER, JSON.stringify(session.user));
	void syncAppIntentCredentials(session).catch(() => undefined);
};

export const clearWSSession = () => {
	Object.values(KEYS).forEach(k => mmkvStorage.delete(k));
	void clearAppIntentCredentials().catch(() => undefined);
};

const isExpired = (expiresAt: number) => Date.now() / 1000 > expiresAt - 60;
let lastAppIntentReconcileAt = 0;

export const reconcileAppIntentSession = async (
	force = false,
): Promise<WSSession | null> => {
	const stored = getStoredWSSession();
	const now = Date.now();
	if (
		!force &&
		stored &&
		!isExpired(stored.expires_at) &&
		now - lastAppIntentReconcileAt < 60_000
	) {
		return stored;
	}
	lastAppIntentReconcileAt = now;
	const appIntentSession = await readAppIntentSession();
	if (!appIntentSession || !stored) {
		if (stored && !appIntentSession) {
			void syncAppIntentCredentials(stored).catch(() => undefined);
		}
		return stored;
	}

	if (appIntentSession.expires_at <= stored.expires_at) return stored;
	const reconciled: WSSession = {
		...stored,
		access_token: appIntentSession.access_token,
		refresh_token: appIntentSession.refresh_token,
		expires_at: appIntentSession.expires_at,
	};
	mmkvStorage.set(KEYS.ACCESS_TOKEN, reconciled.access_token);
	mmkvStorage.set(KEYS.REFRESH_TOKEN, reconciled.refresh_token);
	mmkvStorage.set(KEYS.EXPIRES_AT, reconciled.expires_at);
	return reconciled;
};

type ExchangeParams = {
	email: string;
	fitbox_gym_id?: string;
	fitbox_member_id?: string;
	full_name?: string;
};

export const exchangeForWSSession = async (
	params: ExchangeParams,
): Promise<{ session: WSSession } | { error: WSAuthError }> => {
	const attempt = () =>
		ky
			.post(Constant.WS_BRIDGE_URL, {
				headers: {
					'Content-Type': 'application/json',
					'x-mobile-bridge-key': Constant.WS_BRIDGE_KEY,
				},
				json: params,
				retry: 0,
			})
			.json<WSSession>();

	try {
		const session = await attempt();
		saveWSSession(session);
		return { session };
	} catch (err) {
		if (err instanceof HTTPError) {
			if (err.response.status === 404) {
				try {
					const body = await err.response.json<{
						error?: string;
					}>();
					if (body.error === 'unknown_gym')
						return { error: 'UNKNOWN_GYM' };
				} catch {
					/* body not JSON */
				}
				return { error: 'NOT_FOUND' };
			}
			if (err.response.status === 403) return { error: 'NO_MEMBERSHIP' };
			if (err.response.status === 429) return { error: 'RATE_LIMITED' };
			if (err.response.status === 401) return { error: 'BAD_KEY' };
			if (err.response.status === 500) {
				await new Promise<void>(r => {
					setTimeout(r, 1000);
				});
				try {
					const session = await attempt();
					saveWSSession(session);
					return { session };
				} catch {
					return { error: 'PROVISION_FAILED' };
				}
			}
		}
		return { error: 'NETWORK_ERROR' };
	}
};

const refreshWSToken = async (refreshToken: string): Promise<WSSession> => {
	const stored = getStoredWSSession();
	if (!stored) throw new Error('no stored session');

	const data = await ky
		.post(
			`${Constant.WS_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
			{
				headers: {
					'Content-Type': 'application/json',
					apikey: Constant.WS_SUPABASE_ANON_KEY,
				},
				json: { refresh_token: refreshToken },
				retry: 0,
			},
		)
		.json<{
			access_token: string;
			refresh_token: string;
			expires_at: number;
		}>();

	const newSession: WSSession = {
		access_token: data.access_token,
		refresh_token: data.refresh_token,
		expires_at: data.expires_at,
		user: stored.user,
	};
	saveWSSession(newSession);
	return newSession;
};

export const getValidWSToken = async (): Promise<string | null> => {
	const session = await reconcileAppIntentSession();
	if (!session) return null;
	if (!isExpired(session.expires_at)) return session.access_token;
	try {
		const refreshed = await refreshWSToken(session.refresh_token);
		return refreshed.access_token;
	} catch {
		clearWSSession();
		return null;
	}
};
