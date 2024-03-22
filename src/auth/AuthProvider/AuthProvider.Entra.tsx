import { createContext, PropsWithChildren, useMemo } from 'react';

import {
	authorize,
	AuthorizeResult,
	refresh,
	RefreshResult,
} from 'react-native-app-auth';
import type { MMKV } from 'react-native-mmkv';
import authConfig from '../_authConfig';

type Context = {
	signIn: () => Promise<AuthorizeResult>;
	signOut: () => void;
	getToken: () => Promise<string | null>;
};
export const AuthContext = createContext<Context | undefined>(undefined);

type Props = PropsWithChildren<{
	storage: MMKV;
}>;

const AuthProvider = ({ children, storage }: Props) => {
	/**
	 * setStorageAuth - Store the access token, refresh token, and expiration time in storage
	 * @param {AuthorizeResult | RefreshResult} param0
	 * @returns {void}
	 * @example
	 */
	const setStorageAuth = ({
		accessToken,
		refreshToken,
		accessTokenExpirationDate,
	}: AuthorizeResult | RefreshResult) => {
		// Store the access token, refresh token, and expiration time in storage
		storage.set('userToken', accessToken);
		storage.set('refreshToken', refreshToken || '');
		storage.set('expireTime', accessTokenExpirationDate);
	};

	/**
	 * signIn - Sign in using the Microsoft identity platform
	 */
	const signIn = async (): Promise<AuthorizeResult> => {
		const result = await authorize(authConfig);

		console.log(result.accessToken);

		// Store the access token, refresh token, and expiration time in storage
		setStorageAuth(result);

		return result;
	};

	/**
	 * signOut - Sign out of the Microsoft identity platform
	 */
	const signOut = () => {
		// remove all tokens from storage
		storage.delete('userToken');
		storage.delete('refreshToken');
		storage.delete('expireTime');
	};

	/**
	 * getToken -` Get the access token from storage
	 */
	const getToken = async (): Promise<string | null> => {
		const expireTime = storage.getString('expireTime');

		if (expireTime !== null && expireTime !== undefined) {
			// Get expiration time - 5 minutes
			// If it's <= 5 minutes before expiration, then refresh
			const expire = new Date(expireTime).getTime() - 5 * 60 * 1000;
			const now = new Date().getTime();

			if (now >= expire) {
				// Expired, refresh
				console.log('Refreshing token..');

				const refreshToken = storage.getString(
					'refreshToken',
				) as string;

				console.log(`Refresh token: ${refreshToken}`);

				const result: RefreshResult = await refresh(authConfig, {
					refreshToken: refreshToken || '',
				});

				// Store the new access token, refresh token, and expiration time in storage
				setStorageAuth(result);

				return result.accessToken;
			}

			// Not expired, just return saved access token
			const accessToken = storage.getString('userToken') as string;
			return accessToken;
		}

		return null;
	};

	const value = useMemo(() => {
		return {
			signIn,
			signOut,
			getToken,
		};
	}, [storage]);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};

export default AuthProvider;
