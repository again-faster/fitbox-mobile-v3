import useAuth from '@/auth/hooks/useAuth';
import { Row, Spacer, Text } from '@/components/atoms';
import { FlatList, Loader } from '@/components/molecules';
import { getConversationList } from '@/services/message';
import { getUserGyms } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { InboxScreenProps } from '@/types/navigation';
import { Gym } from '@/types/schemas/gym';
import { MessageItemType } from '@/types/schemas/message';
import { Say } from '@/utils';
import useStore from '@/zustand/Store';
import { useFocusEffect } from '@react-navigation/native';
import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useState,
} from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import GymItem from './components/GymItem';
import InboxItem from './components/InboxItem';
import InboxSelectGymModal from './modals/InboxSelectGymModal';

const { fonts } = config;

const Inbox = ({ navigation }: InboxScreenProps) => {
	const { user } = useAuth();

	const userId = user?.id;

	const { teamId, setAppState } = useStore(state => ({
		teamId: state.teamId,
		setAppState: state.setAppState,
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
	const [list, setList] = useState<MessageItemType[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [gyms, setGyms] = useState<Gym[]>([]);
	const [activeGymId, setActiveGymId] = useState<number>(teamId);
	const [selectGymModal, setSelectGymModal] = useState(false);

	const removeBadgeNumber = () => {
		// TODO: Remove badge number reference below
		// const { notifications, setNotifications, showModalNotification } =
		// 	this.props;
		// let newNotifications = [];
		// notifications.map(notif => {
		// 	if (notif.type !== 'message') newNotifications.push(notif);
		// });
		// // close modal notif
		// showModalNotification(false);
		// // set notifications
		// setNotifications(newNotifications);
		// if (Consts.IS_ANDROID) {
		// 	// Set icon badge for android
		// } else {
		// 	// Set icon badge for IOS
		// 	PushNotificationIOS.setApplicationIconBadgeNumber(0);
		// }
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
		if (!hasMore) {
			return;
		}

		let finalList: MessageItemType[] = [];

		if (view === '') {
			const res = await getConversationList(activeGymId, { page });
			if (!res.error) {
				if (res.data.length) {
					setPage(page + 1);
				}

				if (res.total_items === list.length) {
					setHasMore(false);
				}

				finalList = [...list, ...res.data];
			}
		} else if (view === 'archived') {
			// TODO: Archived messages
			// finalList = (await RestService.getConversationArchivedList())
			// 	.data;
		}

		removeBadgeNumber();
		setList(finalList);
		setLoadingMore(false);
		setLoading(false);
		setRefreshing(false);
	};

	const handlePress = (item: MessageItemType, index: number) => {
		navigation.navigate('Conversation', { conversation: item, index });
	};

	const handleRefresh = (reset = true) => {
		setRefreshing(true);
		setList([]);
		setPage(1);

		if (reset) {
			setHasMore(true);
			void fetchGyms();
		} else {
			void fetchMessages();
		}
	};

	const handleOnEndReach = () => {
		setLoadingMore(!!hasMore);
		void fetchMessages(); // run this when loadingMore is done
	};

	useFocusEffect(
		useCallback(() => {
			if (gyms.length === 0) {
				void fetchGyms();
			}
		}, []),
	);

	useEffect(() => {
		setHasMore(true);
		handleRefresh(false);
		setAppState('teamId', activeGymId);
	}, [activeGymId]);

	useFocusEffect(
		useCallback(() => {
			handleRefresh();
		}, []),
	);

	const renderInboxItem = (item: MessageItemType, index: number) => {
		// const { sender_id: senderId, convo_id } = item;

		const itemData = {
			...item,
			userId: Number(userId),
		};

		return (
			<InboxItem index={index} data={itemData} onPress={handlePress} />
		);

		// TODO: Apply archived messages here
		// return null;
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
				}}
			/>

			<FlatList
				data={list}
				style={layout.flex_1}
				loading={loading}
				refreshing={refreshing}
				onRefresh={handleRefresh}
				placeholder={renderPlaceholder}
				onEndReached={handleOnEndReach}
				onEndReachedThreshold={0.01}
				extractor={({ id, convo_id }: MessageItemType, index: number) =>
					`${id}-${convo_id}-${index}`
				}
				renderItem={({ item, index }) =>
					renderInboxItem(item as MessageItemType, index)
				}
			/>

			{loadingMore && (
				<Row spacing="center" align="center">
					<View style={styles.loaderContainer}>
						<Loader color="brand" size="xs" />
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
});

export default Inbox;
