import { getChildInfo, getParentInfo } from '@/services/users';
import { QUERY_STALE_TIME } from '@/query/cachePolicy';
import queryClient from '@/query/queryClient';
import queryKeys from '@/query/queryKeys';
import { GetChildInfoType, GetParentInfoType } from '@/types/schemas/response';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import {
	createContext,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { ViewProps } from 'react-native';

type Context = {
	hasSwitchableUsers: boolean;
	isParent: boolean;
	fromParent: boolean;
	getSwitchableUsers: (force?: boolean) => Promise<void>;
};

export const SwitchableUserContext = createContext<Context | undefined>(
	undefined,
);

const SwitchableUserProvider = ({ children }: ViewProps) => {
	const loggedInUser = useStore(s => s.loggedInUser);
	const userId = loggedInUser?.id;
	const userIsParent = !!loggedInUser?.user_data.is_parent;
	const userIsFromParent = !!loggedInUser?.user_data.from_parent;
	const [hasSwitchableUsers, setHasSwitchableUsers] =
		useState<boolean>(false);
	const [isParent, setIsParent] = useState<boolean>(false);
	const [fromParent, setFromParent] = useState<boolean>(false);

	const getSwitchableUsers = useCallback(
		(force = false): Promise<void> => {
			if (!userId) {
				setHasSwitchableUsers(false);
				setIsParent(false);
				setFromParent(false);
				return Promise.resolve();
			}

			setIsParent(userIsParent);
			setFromParent(userIsFromParent);

			if (!userIsParent && !userIsFromParent) {
				setHasSwitchableUsers(false);
				return Promise.resolve();
			}

			const request = (async () => {
				const res = await queryClient.fetchQuery({
					queryKey: queryKeys.switchableUsers(
						userId,
						userIsParent,
					),
					queryFn: (): Promise<
						GetChildInfoType | GetParentInfoType
					> =>
						userIsParent ? getChildInfo() : getParentInfo(),
					staleTime: force ? 0 : QUERY_STALE_TIME.STANDARD,
				});
				const switchable = userIsParent
					? !!(res as GetChildInfoType).child_data[0]?.children
							?.length
					: !!(res as GetParentInfoType).parent_data?.length;

				const currentUser = useStore.getState().loggedInUser;
				if (
					currentUser?.id === userId &&
					!!currentUser.user_data.is_parent === userIsParent &&
					!!currentUser.user_data.from_parent === userIsFromParent
				) {
					setHasSwitchableUsers(switchable);
				}
			})()
				.catch(error => {
					Say.err(error as ICatchError);
				});

			return request;
		},
		[userId, userIsParent, userIsFromParent],
	);

	useEffect(() => {
		void getSwitchableUsers();
	}, [getSwitchableUsers]);

	const value = useMemo(
		() => ({
			hasSwitchableUsers,
			isParent,
			fromParent,
			getSwitchableUsers,
		}),
		[hasSwitchableUsers, isParent, fromParent, getSwitchableUsers],
	);

	return (
		<SwitchableUserContext.Provider value={value}>
			{children}
		</SwitchableUserContext.Provider>
	);
};

export default SwitchableUserProvider;
