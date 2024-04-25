import { deletePushToken, login } from '@/services/auth';
import { LoginResponseSchema } from '@/types/schemas/response';
import { UserSchemaType } from '@/types/schemas/user';
import { PropsWithChildren, createContext, useMemo } from 'react';
import type { MMKV } from 'react-native-mmkv';
import { z } from 'zod';

type User = z.infer<typeof LoginResponseSchema>;

type Context = {
	signIn: (email: string, password: string) => Promise<any>;
	signOut: () => void;
	user: User | null;
	updateUser: (user: UserSchemaType) => boolean;
	isLoggedIn: () => boolean;
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

	const updateUser = (user: UserSchemaType): boolean => {
		const userData = storage.getString('user') as string;
		const userObj = JSON.parse(userData) as User;

		// merge the user data
		const updatedUser = {
			...userObj.user_data,
			...user,
		};

		// update the user data
		const updatedUserData = {
			...userObj,
			user_data: updatedUser,
		};

		// store the updated user data
		storage.set('user', JSON.stringify(updatedUserData));

		return true;
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

	const isLoggedIn = () => !!storage.getString('apiToken');

	const value = useMemo(() => {
		return {
			signIn,
			signOut,
			user: getUser(),
			updateUser,
			isLoggedIn,
		};
	}, [storage]);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};

export default AuthProvider;
