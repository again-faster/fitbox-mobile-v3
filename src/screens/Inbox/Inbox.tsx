import useAuth from '@/auth/hooks/useAuth';
import { Row, Spacer, Text } from '@/components/atoms';
import { FlatList, Loader } from '@/components/molecules';
import {
	getConversationArchivedList,
	getConversationList,
} from '@/services/message';
import { getUserGyms } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { InboxScreenProps } from '@/types/navigation';
import { Gym } from '@/types/schemas/gym';
import {
	ConversationArchivedListDataType,
	MessageItemType,
} from '@/types/schemas/message';
import { NotificationsType } from '@/types/schemas/notifications';
import { Constant, Say } from '@/utils';
import useStore from '@/zustand/Store';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { useFocusEffect } from '@react-navigation/native';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from 'react';
import {
	ActivityIndicator,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import GymItem from './components/GymItem';
import InboxItem from './components/InboxItem';
import InboxSelectGymModal from './modals/InboxSelectGymModal';

const { fonts } = config;

const Inbox = ({ navigation }: InboxScreenProps) => {
	const { user } = useAuth();

	const userId = user?.id;

	const { teamId, setAppState, notifications } = useStore(state => ({
		teamId: state.teamId,
		setAppState: state.setAppState,
		notifications: state.notifications,
		showModalNotification: state.showModalNotification,
	}));

	const renderCreateButton = () => (
		<TouchableOpacity onPress={() => navigation.navigate('ComposeStack')}>
			<View
				style={{
					paddingHorizontal: config.metrics.rg,
				}}
			>
				<Icon
					name="create-outline"
					size={25}
					color="white"
					style={{ paddingBottom: config.metrics.sm }}
				/>
			</View>
		</TouchableOpacity>
	);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: renderCreateButton,
		});
	}, []);

	const [view] = useState('');
	const [list, setList] = useState<
		MessageItemType[] | ConversationArchivedListDataType[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [gyms, setGyms] = useState<Gym[]>([]);
	const [activeGymId, setActiveGymId] = useState<number>(teamId);
	const [selectGymModal, setSelectGymModal] = useState(false);

	const removeBadgeNumber = () => {
		const newNotifications: NotificationsType[] = [];

		notifications.forEach(notif => {
			if (notif.type !== 'message') newNotifications.push(notif);
		});
		// close modal notif
		setAppState('showModalNotification', false);
		// set notifications
		setAppState('notifications', newNotifications);
		if (Constant.IS_ANDROID) {
			// Set icon badge for android
		} else {
			// Set icon badge for IOS
			PushNotificationIOS.setApplicationIconBadgeNumber(0);
		}
	};

	const fetchGyms = async () => {
		const res = await getUserGyms();

		if (res && !res.error) {
			// after set gyms fetchData
			setGyms(res.data);
		} else {
			// Show error
			Say.err('Something went wrong!');
		}

		setLoading(false);
	};

	const fetchMessages = async () => {
		let finalList: MessageItemType[] | ConversationArchivedListDataType[] =
			[];

		if (view === '') {
			const res = await getConversationList(activeGymId, { page });
			if (!res.error) {
				finalList = [...list, ...res.data];

				if (res.data.length) {
					setPage(page + 1);
				}
				if (res.total_items === finalList.length) {
					setHasMore(false);
				}
			}
		} else if (view === 'archived') {
			// OBSOLETE: Archiving feature is disabled for now since its not working
			const archivedRes = await getConversationArchivedList();
			if (!archivedRes.error) {
				finalList = archivedRes.data;
				setHasMore(false);
			}
		}

		removeBadgeNumber();
		setList(finalList);
		setLoadingMore(false);
		setLoading(false);
		setRefreshing(false);
	};

	const handlePress = (item: MessageItemType, index: number) => {
		const updatedList = list as MessageItemType[];
		(updatedList[index] as MessageItemType).num_of_unread_messages = 0;
		setList(updatedList);
		navigation.navigate('Conversation', { conversation: item, index });
	};

	const handleRefresh = async (reset = true) => {
		setRefreshing(true);
		setList([]);
		setPage(0);
		setHasMore(true);

		if (reset) {
			await fetchGyms();
		} else {
			await fetchMessages();
		}
	};

	const handleOnEndReach = () => {
		setLoadingMore(!!hasMore);
		if (hasMore) {
			void fetchMessages(); // run this when loadingMore is done
		}
	};

	useFocusEffect(
		useCallback(() => {
			const fetchData = async () => {
				if (gyms.length === 0) {
					void fetchGyms();
				} else {
					await handleRefresh(false);
				}
			};
			void fetchData();
		}, [gyms]),
	);

	useEffect(() => {
		setAppState('inboxTeamId', activeGymId);
	}, [activeGymId]);

	const renderInboxItem = (item: MessageItemType, index: number) => {
		const itemData = {
			...item,
			userId: Number(userId),
		};

		return (
			<InboxItem index={index} data={itemData} onPress={handlePress} />
		);
	};

	const renderGymSelect = useCallback(() => {
		// get active gym
		const activeGym = gyms.find(g => g.id === activeGymId) as Gym;

		// move the active gym to first index
		const gymList = gyms.filter(g => g.id !== activeGymId);
		gymList.unshift(activeGym);

		if (!activeGym || !gymList.length || gymList.length === 1) {
			return null;
		}

		return (
			<View style={[layout.shadowLight, layout.z10]}>
				<GymItem
					onPress={() => setSelectGymModal(true)}
					gym={activeGym}
					right={
						<MIcon
							name="chevron-down"
							color={fonts.colors.info}
							size={fonts.metrics.xl}
						/>
					}
				/>
			</View>
		);
	}, [gyms, activeGymId]);

	const renderPlaceholder = (
		<View
			style={[
				layout.flex_1,
				layout.itemsCenter,
				layout.justifyCenter,
				{ marginTop: fonts.metrics.xxl * 2 },
			]}
		>
			<Icon
				name="chatbubbles"
				color={fonts.colors.brand}
				size={fonts.metrics.xxl * 2}
			/>
			<Spacer size="xs" />
			<Text>{`No ${view ? `${view} ` : ''}conversations yet`}</Text>
		</View>
	);

	const selectGymItems = useMemo(() => {
		return gyms.slice().sort((g1, g2) => {
			if (g1.id === activeGymId) return -1;
			if (g2.id === activeGymId) return 1;
			return 0;
		});
	}, [gyms, activeGymId]);

	return (
		<>
			{renderGymSelect()}

			<InboxSelectGymModal
				gyms={selectGymItems}
				visible={selectGymModal}
				onSelect={({ id }: Gym) => {
					setActiveGymId(id);
					setSelectGymModal(false);
					setList([]);
					void handleRefresh();
				}}
			/>

			{refreshing ? (
				<View style={styles.inboxLoader}>
					<ActivityIndicator
						size="large"
						color={config.colors.brand}
					/>
				</View>
			) : (
				<FlatList
					data={list}
					style={layout.flex_1}
					loading={loading}
					refreshing={refreshing}
					onRefresh={() => void handleRefresh()}
					placeholder={renderPlaceholder}
					onEndReached={handleOnEndReach}
					onEndReachedThreshold={0.01}
					extractor={(
						{ id, convo_id }: MessageItemType,
						index: number,
					) => `${id}-${convo_id}-${index}`}
					renderItem={({ item, index }) =>
						renderInboxItem(item as MessageItemType, index)
					}
				/>
			)}

			{loadingMore && (
				<Row spacing="center" align="center">
					<View style={styles.loaderContainer}>
						<Loader size="xs" />
					</View>
					<Spacer horizontal size="xs" />
					<Text size="sm">Loading More..</Text>
				</Row>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	loaderContainer: {
		paddingVertical: 15,
	},
	inboxLoader: {
		flex: 1,
		justifyContent: 'center',
	},
});

export default Inbox;
