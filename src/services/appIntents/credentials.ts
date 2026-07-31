import { getApiToken, getApiUrl } from '@/services/instance';
import { Constant } from '@/utils';
import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

const SERVICE = 'com.againfaster.fitbox.app-intents';
const ACCOUNT = 'fitbox-app-intents';

export type AppIntentSession = {
	access_token: string;
	refresh_token: string;
	expires_at: number;
	user: {
		id: string;
		active_tenant_id: string;
	};
};

type AppIntentCredentials = {
	version: 1;
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
	userId: string;
	tenantId: string;
	fitboxApiKey: string;
	fitboxApiBase: string;
	mobileApiUrl: string;
	supabaseUrl: string;
	supabaseAnonKey: string;
};

const isCredentials = (value: unknown): value is AppIntentCredentials => {
	if (!value || typeof value !== 'object') return false;
	const candidate = value as Partial<AppIntentCredentials>;
	return (
		candidate.version === 1 &&
		typeof candidate.accessToken === 'string' &&
		typeof candidate.refreshToken === 'string' &&
		typeof candidate.expiresAt === 'number' &&
		typeof candidate.userId === 'string' &&
		typeof candidate.tenantId === 'string' &&
		typeof candidate.fitboxApiKey === 'string' &&
		typeof candidate.fitboxApiBase === 'string' &&
		typeof candidate.mobileApiUrl === 'string' &&
		typeof candidate.supabaseUrl === 'string' &&
		typeof candidate.supabaseAnonKey === 'string'
	);
};

export const clearAppIntentCredentials = async (): Promise<void> => {
	if (Platform.OS !== 'ios') return;
	await Keychain.resetGenericPassword({ service: SERVICE });
};

export const syncAppIntentCredentials = async (
	session: AppIntentSession,
): Promise<void> => {
	if (Platform.OS !== 'ios') return;

	const fitboxApiKey = getApiToken();
	const fitboxApiBase = getApiUrl() || Constant.API_URL;
	if (
		!fitboxApiKey ||
		!fitboxApiBase ||
		!Constant.WS_MOBILE_API_URL ||
		!Constant.WS_SUPABASE_URL ||
		!Constant.WS_SUPABASE_ANON_KEY
	) {
		await clearAppIntentCredentials();
		return;
	}

	const credentials: AppIntentCredentials = {
		version: 1,
		accessToken: session.access_token,
		refreshToken: session.refresh_token,
		expiresAt: session.expires_at,
		userId: session.user.id,
		tenantId: session.user.active_tenant_id,
		fitboxApiKey,
		fitboxApiBase,
		mobileApiUrl: Constant.WS_MOBILE_API_URL,
		supabaseUrl: Constant.WS_SUPABASE_URL,
		supabaseAnonKey: Constant.WS_SUPABASE_ANON_KEY,
	};

	await Keychain.setGenericPassword(ACCOUNT, JSON.stringify(credentials), {
		service: SERVICE,
		accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
	});
};

export const readAppIntentSession =
	async (): Promise<AppIntentSession | null> => {
		if (Platform.OS !== 'ios') return null;
		try {
			const stored = await Keychain.getGenericPassword({
				service: SERVICE,
			});
			if (!stored) return null;
			const parsed = JSON.parse(stored.password) as unknown;
			if (!isCredentials(parsed)) return null;
			return {
				access_token: parsed.accessToken,
				refresh_token: parsed.refreshToken,
				expires_at: parsed.expiresAt,
				user: {
					id: parsed.userId,
					active_tenant_id: parsed.tenantId,
				},
			};
		} catch {
			return null;
		}
	};
