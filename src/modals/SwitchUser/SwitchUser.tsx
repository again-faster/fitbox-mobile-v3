import useAuth from '@/auth/hooks/useAuth';
import { Button, Text } from '@/components/atoms';
import { RowSelectItem } from '@/components/molecules';
import { goBack, resetRoot } from '@/navigators/NavigationRef';
import { getChildInfo, getParentInfo, switchAccount } from '@/services/users';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { GetChildInfoType, GetParentInfoType } from '@/types/schemas/response';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
	const [users, setUsers] = useState<Users[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [loadError, setLoadError] = useState(false);
	const [loadingMessage, setLoadingMessage] = useState('Loading profiles…');

	useEffect(() => {
		void (async () => {
			setLoadError(false);
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
				setUsers([]);
				setLoadError(true);
				setIsLoading(false);
			}
		})();
	}, []);

	const handleSwitch = async (id: number) => {
		setLoadingMessage('Switching profile…');
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
				subtitle={
					user?.user_data.is_parent
						? 'Child profile'
						: 'Parent profile'
				}
			/>
		);
	};

	const renderHeader = () => (
		<View style={styles.headerCard}>
			<View style={styles.headerIcon}>
				<Icon
					name="account-switch-outline"
					size={27}
					color={memberTheme.colors.primaryDeep}
				/>
			</View>
			<View style={styles.headerCopy}>
				<Text bold style={styles.headerTitle}>
					{user?.user_data.is_parent
						? 'Choose a child profile'
						: 'Return to your parent profile'}
				</Text>
				<Text style={styles.headerText}>
					You will see bookings, messages and activity for the
					selected profile.
				</Text>
			</View>
		</View>
	);

	const renderEmpty = () => (
		<View style={styles.emptyCard}>
			<Icon
				name={loadError ? 'cloud-alert-outline' : 'account-off-outline'}
				size={38}
				color={memberTheme.colors.textMuted}
			/>
			<Text bold style={styles.emptyTitle}>
				{loadError ? 'Profiles couldn’t load' : 'No linked profiles'}
			</Text>
			<Text center style={styles.emptyText}>
				{loadError
					? 'Close this screen and try again.'
					: 'Ask your gym to link the parent and child accounts.'}
			</Text>
			{loadError ? (
				<Button
					title="Close"
					style={styles.closeButton}
					onPress={goBack}
				/>
			) : null}
		</View>
	);

	return isLoading ? (
		<View style={styles.loadingStyle}>
			<ActivityIndicator
				size="large"
				color={memberTheme.colors.primaryDeep}
			/>
			<Text style={styles.loadingText}>{loadingMessage}</Text>
		</View>
	) : (
		<View style={styles.container}>
			<FlatList
				data={users}
				renderItem={renderUsers}
				ListHeaderComponent={renderHeader}
				ListEmptyComponent={renderEmpty}
				contentContainerStyle={styles.listContent}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	loadingStyle: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: memberTheme.colors.background,
	},
	loadingText: {
		color: memberTheme.colors.textMuted,
		fontSize: 13,
		marginTop: memberTheme.spacing.md,
	},
	container: {
		...layout.flex_1,
		backgroundColor: memberTheme.colors.background,
	},
	listContent: { flexGrow: 1, padding: memberTheme.spacing.lg },
	headerCard: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.lg,
		flexDirection: 'row',
		marginBottom: memberTheme.spacing.lg,
		padding: memberTheme.spacing.lg,
	},
	headerIcon: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.md,
		height: 50,
		justifyContent: 'center',
		width: 50,
	},
	headerCopy: { flex: 1, marginLeft: memberTheme.spacing.md },
	headerTitle: { color: memberTheme.colors.ink, fontSize: 18 },
	headerText: {
		color: memberTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 17,
		marginTop: 4,
	},
	emptyCard: { alignItems: 'center', padding: memberTheme.spacing.xxl },
	emptyTitle: {
		color: memberTheme.colors.ink,
		fontSize: 16,
		marginTop: memberTheme.spacing.md,
	},
	emptyText: {
		color: memberTheme.colors.textMuted,
		fontSize: 13,
		lineHeight: 18,
		marginTop: memberTheme.spacing.xs,
	},
	closeButton: {
		backgroundColor: memberTheme.colors.primaryDeep,
		borderRadius: memberTheme.radius.pill,
		marginTop: memberTheme.spacing.lg,
	},
});

export default SwitchUser;
