import { deletePushToken, login } from '@/services/auth';
import { loginResponseSchema } from '@/types/schemas/response';
import { PropsWithChildren, createContext, useMemo } from 'react';
import type { MMKV } from 'react-native-mmkv';
import { z } from 'zod';

type User = z.infer<typeof loginResponseSchema>;

type Context = {
	signIn: (email: string, password: string) => Promise<any>;
	signOut: () => void;
	isLoggedIn: boolean;
};
export const AuthContext = createContext<Context | undefined>(undefined);

type Props = PropsWithChildren<{
	storage: MMKV;
}>;

const AuthProvider = ({ children, storage }: Props) => {
	const setStorageAuth = (data: User): void => {
		// Store the access token, refresh token, and expiration time in storage
		storage.set('apiToken', data.token);
		storage.set('user', JSON.stringify(data));
	};

	const getUser = (): User | null => {
		const userData = storage.getString('user');

		if (!userData) {
			return null;
		}

		return JSON.parse(userData) as User;
	};

	const signIn = async (email: string, password: string): Promise<User> => {
		// call login service
		const res = await login(email, password);

		// Store the access token, refresh token, and expiration time in storage
		setStorageAuth(res);

		// return the user
		return res;
	};

	const signOut = async () => {
		const { id, token } = getUser() as User;

		// remove push token from server
		try {
			await deletePushToken(token, id);

			// remove all tokens from storage
			storage.delete('apiToken');
			storage.delete('user');
		} catch (error) {
			console.error('@error', error);
		}
	};

	const value = useMemo(() => {
		return {
			signIn,
			signOut,
			isLoggedIn: getUser() !== null,
		};
	}, [storage]);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};

export default AuthProvider;
