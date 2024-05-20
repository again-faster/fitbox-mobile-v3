import { deletePushToken, login } from '@/services/auth';
import { LoginResponseSchemaType } from '@/types/schemas/response';
import { UserSchemaType } from '@/types/schemas/user';
import useStore from '@/zustand/Store';
import { PropsWithChildren, createContext, useMemo } from 'react';
import type { MMKV } from 'react-native-mmkv';

type Context = {
	signIn: (email: string, password: string) => Promise<unknown>;
	signOut: () => void;
	user: LoginResponseSchemaType | null;
	updateUser: (user: UserSchemaType) => boolean;
	isLoggedIn: boolean;
};
export const AuthContext = createContext<Context | undefined>(undefined);

type Props = PropsWithChildren<{
	storage: MMKV;
}>;

const AuthProvider = ({ children, storage }: Props) => {
	const loggedInUser = useStore(s => s.loggedInUser);
	const setAppState = useStore(s => s.setAppState);

	const setStorageAuth = (data: LoginResponseSchemaType): void => {
		// Store the access token, refresh token, and expiration time in storage
		storage.set('apiToken', data.token);

		// set the logged in user
		setAppState('loggedInUser', data);
	};

	const updateUser = (user: UserSchemaType): boolean => {
		const userObj = loggedInUser;
		if (!userObj) {
			return false;
		}

		// merge the user data
		const updatedUser = {
			...loggedInUser.user_data,
			...user,
		};

		// update the user data
		const updatedUserData = {
			...loggedInUser,
			user_data: updatedUser,
		};

		// store the updated user data
		storage.set('user', JSON.stringify(updatedUserData));

		// update the logged in user
		setAppState('loggedInUser', updatedUserData);

		return true;
	};

	const signIn = async (
		email: string,
		password: string,
	): Promise<LoginResponseSchemaType> => {
		// call login service
		const res = await login(email, password);

		// Store the access token, refresh token, and expiration time in storage
		setStorageAuth(res);

		// return the user
		return res;
	};

	const signOut = async () => {
		const { id, token } = loggedInUser as LoginResponseSchemaType;

		// remove push token from server
		try {
			await deletePushToken(token, id);

			// remove all tokens from storage
			storage.delete('apiToken');
			storage.delete('user');

			// remove the logged in user
			setAppState('loggedInUser', null);
		} catch (error) {
			// console.error('@error', error);
		}
	};

	const value = useMemo(() => {
		return {
			signIn,
			signOut,
			updateUser,
			user: loggedInUser,
			isLoggedIn: !!loggedInUser,
		};
	}, [storage, loggedInUser]);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};

export default AuthProvider;
