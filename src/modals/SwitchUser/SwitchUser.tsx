import useAuth from '@/auth/hooks/useAuth';
import { RowSelectItem } from '@/components/molecules';
import { goBack, resetRoot } from '@/navigators/NavigationRef';
import { getChildInfo, getParentInfo, switchAccount } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { GetChildInfoType, GetParentInfoType } from '@/types/schemas/response';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

type Users = {
	id: number;
	image: string | undefined;
	firstName: string;
	lastName: string;
};

const SwitchUser = () => {
	const clearClasses = useStore(state => state.clearClasses);
	const clearFilters = useStore(state => state.clearFilters);
	const clearStates = useStore(state => state.clearAppState);
	const { user, setStorageAuth } = useAuth();
	const [users, setUsers] = useState<Users[]>();
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		void (async () => {
			const isParent = user?.user_data.is_parent;
			try {
				const res: GetChildInfoType | GetParentInfoType = isParent
					? await getChildInfo()
					: await getParentInfo();

				if (isParent) {
					const childRes = res as GetChildInfoType;
					const childrenData: Users[] = [];
					childRes.child_data[0]?.children.forEach(item => {
						childrenData.push({
							id: item.child_id,
							image: item.child_info.profile_image,
							firstName: item.child_info.firstname,
							lastName: item.child_info.lastname,
						});
					});

					setUsers(childrenData);
				} else {
					const parentRes = res as GetParentInfoType;
					const parentData: Users[] = [];
					parentRes.parent_data.forEach(item => {
						parentData.push({
							id: item.id,
							image: item.profile_image,
							firstName: item.firstname,
							lastName: item.lastname,
						});
					});
					setUsers(parentData);
				}

				setIsLoading(false);
			} catch (e) {
				Say.err(e as ICatchError);
				setIsLoading(false);
			}
		})();
	}, []);

	const handleSwitch = async (id: number) => {
		setIsLoading(true);
		try {
			const res = await switchAccount({ user_id: id });

			if (res.error) {
				Say.err(res.message);
				goBack();
				return false;
			}

			const userData = res;
			if (userData) {
				if (user?.user_data.is_parent)
					userData.user_data.from_parent = true;

				setStorageAuth(userData);

				clearClasses();

				clearStates();

				clearFilters();
				setIsLoading(false);
				resetRoot();
			}
			return true;
		} catch (e) {
			setIsLoading(false);
			return Say.err(e as ICatchError);
		}
	};

	const renderUsers = ({ item }: { item: Users }) => {
		const { id, image, firstName, lastName } = item;
		return (
			<RowSelectItem
				id={id}
				key={id}
				image={image || ''}
				onPress={() => void handleSwitch(id)}
				selected={false}
				text={`${firstName} ${lastName}`}
			/>
		);
	};
	return isLoading ? (
		<View style={styles.loadingStyle}>
			<ActivityIndicator size="large" color={config.colors.brand} />
		</View>
	) : (
		<View style={layout.flex_1}>
			<FlatList data={users} renderItem={renderUsers} />
		</View>
	);
};

const styles = StyleSheet.create({
	loadingStyle: {
		flex: 1,
		justifyContent: 'center',
	},
});

export default SwitchUser;
