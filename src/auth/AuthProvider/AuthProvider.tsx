import { deletePushToken, login } from '@/services/auth';
import { LoginResponseSchemaType } from '@/types/schemas/response';
import { UserSchemaType } from '@/types/schemas/user';
import { Constant, Func } from '@/utils';
import useStore from '@/zustand/Store';
import { PropsWithChildren, createContext, useMemo } from 'react';
import type { MMKV } from 'react-native-mmkv';

type Context = {
	signIn: (email: string, password: string) => Promise<unknown>;
	signOut: () => void;
	user: LoginResponseSchemaType | null;
	updateUser: (user: UserSchemaType) => boolean;
	isLoggedIn: boolean;
	setStorageAuth: (data: LoginResponseSchemaType) => void;
	setApiUrl: (url: string) => void;
	getApiUrl: () => string;
};
export const AuthContext = createContext<Context | undefined>(undefined);

type Props = PropsWithChildren<{
	storage: MMKV;
}>;

const AuthProvider = ({ children, storage }: Props) => {
	const {
		loggedInUser,
		setLoggedInUser,
		clearClasses,
		clearStates,
		clearFilters,
		pushToken,
	} = useStore(state => ({
		loggedInUser: state.loggedInUser,
		setLoggedInUser: state.setLoggedInUser,
		clearClasses: state.clearClasses,
		clearStates: state.clearAppState,
		clearFilters: state.clearFilters,
		pushToken: state.pushToken,
	}));

	const setStorageAuth = (data: LoginResponseSchemaType): void => {
		// Store the access token, refresh token, and expiration time in storage
		storage.set('apiToken', data.token);

		// set the logged in user
		setLoggedInUser(data);
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
		setLoggedInUser(updatedUserData);

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
		const { id } = loggedInUser as LoginResponseSchemaType;

		// remove push token from server
		try {
			if (pushToken) {
				await deletePushToken(
					pushToken,
					id,
					Func.getEnv(
						storage.getString('apiUrl') || Constant.API_URL,
					),
				);
			}

			// remove all tokens from storage
			storage.delete('apiToken');
			storage.delete('user');

			// remove the logged in user
			const timer = setTimeout(() => {
				// clear calendar state
				clearClasses();

				// clear global state
				clearStates();

				// clear filter state
				clearFilters();
				setLoggedInUser(null);
			}, 800);

			return () => clearTimeout(timer);
		} catch (error) {
			// console.error('@error', error);
			return null;
		}
	};

	const setApiUrl = (url: string) => {
		storage.set('apiUrl', url);
	};

	const getApiUrl = (): string => {
		return storage.getString('apiUrl') || Constant.API_URL; // default to Constant.API_URL if not set in storage
	};

	const value = useMemo(() => {
		return {
			signIn,
			signOut,
			updateUser,
			user: loggedInUser,
			isLoggedIn: !!loggedInUser,
			setStorageAuth,
			setApiUrl,
			getApiUrl,
		};
	}, [storage, loggedInUser]);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};

export default AuthProvider;
