import useAuth from '@/auth/hooks/useAuth';
import { HR, Row, Text } from '@/components/atoms';
import { ChatMessage, MessageInput, Modal } from '@/components/molecules';
import HeaderButtonGroup from '@/components/template/Header/HeaderButtonGroup';
import {
	checkConversationReplyStatus,
	deleteConversationMessage,
	getConversationMessages,
	sendConversationMessage,
} from '@/services/message';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ConversationParams, InboxScreenProps } from '@/types/navigation';
import {
	MessageItemUserType,
	SendMessageDataType,
} from '@/types/schemas/message';
import { Say } from '@/utils';
import Clipboard from '@react-native-clipboard/clipboard';
import { sortBy } from 'lodash';
import moment from 'moment';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

type State = {
	list: SendMessageDataType[];
	recipientIds: string[];
	subject: string;
	message: string;
	page: number;
	convoId: number;
	loading: boolean;
	refreshing: boolean;
	inputReady: boolean;
	allowReply: boolean;
	userList: MessageItemUserType[];
	showList: boolean;
	selectedMessage: unknown;
	sending: boolean;
};

const longPressOptions = [
	{
		id: 'copy',
		text: 'Copy',
		icon: 'content-copy',
		color: config.backgrounds.darkgray,
	},
	{
		id: 'delete',
		text: 'Delete',
		icon: 'trash-can-outline',
		color: config.colors.danger,
	},
];

const ConversationScreen = ({ route, navigation }: InboxScreenProps) => {
	const { conversation } = route.params as ConversationParams;
	const { user } = useAuth();
	const [state, setState] = useState<State>({
		list: [],
		recipientIds: [],
		subject: conversation.subject,
		message: '',
		page: 0,
		convoId: conversation.convo_id,
		loading: true,
		refreshing: false,
		inputReady: false,
		allowReply: true,
		userList: [],
		showList: false,
		selectedMessage: null,
		sending: false,
	});

	const handleEnterMessage = (message: string) =>
		setState(prevState => ({ ...prevState, message }));

	const handleSendMessage = async () => {
		try {
			let { message, list } = state;
			const { subject, convoId, sending } = state;

			if (sending) return false;
			message = message.trim();

			/// TODO: include length of attachedFiles
			if (message) {
				setState(prevState => ({ ...prevState, sending: true }));
				list = list.slice();

				const payload = {
					subject,
					message,
					convo_id: convoId,
					mediaAttachments: [],
				};

				const res = await sendConversationMessage(payload);

				list.unshift({
					id: res.data.id,
					sender_id: user?.user_data?.user_id || 0,
					message: payload.message,
					firstname: res.data.firstname,
					lastname: res.data.lastname,
					profile_image: res.data.profile_image,
					attached_files: res.data.attached_files,
					created_at: moment.utc().format('YYYY-MM-DD HH:mm'),
				});

				// TODO: clear attached files

				setState(prevState => ({ ...prevState, message: '', list }));
			}
		} catch (e) {
			Say.err(e as string);
		}
		return setState(prevState => ({ ...prevState, sending: false }));
	};

	const handleSendGIF = async (url: string) => {
		try {
			let { list } = state;
			const { subject, convoId, sending } = state;

			if (sending) return false;

			/// TODO: include length of attachedFiles
			if (url) {
				setState(prevState => ({ ...prevState, sending: true }));
				list = list.slice();

				const payload = {
					subject,
					message: url,
					convo_id: convoId,
					mediaAttachments: [],
				};

				const res = await sendConversationMessage(payload);

				list.unshift({
					id: res.data.id,
					sender_id: user?.user_data.user_id || 0,
					message: payload.message,
					firstname: res.data.firstname,
					lastname: res.data.lastname,
					profile_image: res.data.profile_image,
					attached_files: res.data.attached_files,
					created_at: moment.utc().format('YYYY-MM-DD HH:mm'),
				});

				// TODO: clear attached files

				setState(prevState => ({ ...prevState, message: '', list }));
			}
		} catch (e) {
			Say.err(e as string);
		}
		return setState(prevState => ({ ...prevState, sending: false }));
	};

	const handleDelete = (index: number, messageId: number) => {
		Alert.alert(
			'Delete Message',
			'Are you sure',
			[
				{
					text: 'Ok',
					onPress: () => {
						void (async () => {
							await deleteConversationMessage(messageId);
						})();

						const list = state.list.slice();
						list.splice(index, 1);

						setState(prevState => ({
							...prevState,
							list,
							selectedMessage: null,
						}));
					},
				},
				{
					text: 'Cancel',
					style: 'cancel',
				},
			],
			{
				cancelable: true,
			},
		);
	};

	const handleCopy = (message: string) => {
		Clipboard.setString(message);
		setState(prevState => ({ ...prevState, selectedMessage: null }));
	};

	const renderInfoButton = () => {
		return (
			<HeaderButtonGroup>
				<Ionicons
					name="information-outline"
					onPress={toggleViewUsers}
					size={24}
					color="white"
				/>
			</HeaderButtonGroup>
		);
	};

	const toggleViewUsers = () => {
		const usersList = conversation.user_list.map(
			userData => `${userData.firstname} ${userData.lastname}`,
		);
		const message = sortBy(usersList).join('\n');
		Say.ok(message, 'List of users');
	};

	useLayoutEffect(() => {
		let users = conversation.user_list;

		if (users.length > 1) {
			users = users.filter(
				userData => userData.id !== user?.user_data.user_id,
			);
		}

		let screenTitle = `${users[0]?.firstname as string} ${
			users[0]?.lastname as string
		}`;

		if (users.length > 1) {
			screenTitle += ` and ${users.length - 1} others `;
		}

		setState(prevState => ({ ...prevState, userList: users }));

		// TODO: handle notifications

		navigation.setOptions({
			title: screenTitle,
			headerRight: renderInfoButton,
		});
	}, []);

	const handleActionPress = (action: string) => {
		const { selectedMessage, list } = state;
		const { message, id } = list[
			selectedMessage as number
		] as SendMessageDataType;

		switch (action) {
			case 'copy':
				handleCopy(message);
				break;
			case 'delete':
				handleDelete(selectedMessage as number, id);
				break;
			default:
				break;
		}
	};

	const handleEndReach = async () => {
		setState(prevState => ({ ...prevState, page: prevState.page + 1 }));
		await getData(state.page);
	};

	useEffect(() => {
		void (async () => {
			// TODO: handle push notifications
			await getData();

			// TODO: show modal notification
			// TODO: check if switch to gym is set on navigation params

			const res = await checkConversationReplyStatus(
				conversation.convo_id,
			);
			const { disable_reply: displayReply } = res.data;
			setState(prevState => ({
				...prevState,
				allowReply: !displayReply,
				inputReady: true,
			}));
		})();
	}, []);

	const getData = async (page?: number) => {
		let list: SendMessageDataType[] = [];
		try {
			const { convo_id: conversationId } = conversation;
			const res = await getConversationMessages({
				conversationId,
				page: page || 0,
			});

			list = res.data;
		} catch (e) {
			Say.err(e as string);
		}

		setState(prevState => ({
			...prevState,
			list: [...prevState.list, ...list],
			loading: false,
			refreshing: false,
		}));
	};

	const renderItem = ({
		item,
		index,
	}: {
		item: SendMessageDataType;
		index: number;
	}) => {
		const dontDisplayTime =
			moment.utc(item.created_at).local().format('MMM DD h:mm a') ===
			moment
				.utc(state.list[index + 1]?.created_at)
				.local()
				.format('MMM DD h:mm a');

		return (
			<ChatMessage
				key={item.id}
				index={index}
				data={item}
				messageOnly={
					!(
						index === 0 ||
						state.list[index - 1]?.sender_id !== item.sender_id
					)
				}
				onLongPress={() =>
					setState(prevState => ({
						...prevState,
						selectedMessage: index,
					}))
				}
				dontDisplayTime={dontDisplayTime}
			/>
		);
	};

	const renderConversation = () => {
		if (state.loading || state.refreshing) {
			return <ActivityIndicator color={config.colors.brand} />;
		}
		if (state.list.length > 0) {
			return (
				<FlatList
					inverted
					data={state.list}
					renderItem={renderItem}
					refreshing={state.refreshing}
					onEndReached={void handleEndReach}
					onEndReachedThreshold={0.5}
				/>
			);
		}
		return (
			<View style={styles.alignSelfCenter}>
				<Text size="md" color="darkgray">
					No Conversations
				</Text>
			</View>
		);
	};

	const renderOptions = (msg: SendMessageDataType) => {
		if (msg) {
			const isFromUser = msg.sender_id === user?.user_data.user_id;
			const isAttachment = msg.attached_files.length;
			const isGifUrl = /\.(gif)$/i.test(msg.message);

			return longPressOptions.map((item, index) => {
				if (!isFromUser && item.id === 'delete') return null;
				if (isAttachment && item.id === 'copy') return null;
				if (isGifUrl && item.id === 'copy') return null;

				return (
					<TouchableOpacity
						key={index}
						style={styles.optionItemStyle}
						onPress={() => handleActionPress(item.id)}
					>
						<Row spacing="space-between">
							<Text size="md" style={{ color: item.color }}>
								{item.text}
							</Text>
							<Ionicons
								name={item.icon}
								size={config.metrics.lg}
								color={item.color}
							/>
						</Row>
					</TouchableOpacity>
				);
			});
		}
		return null;
	};

	return (
		<View style={layout.flex_1}>
			<View
				style={{
					paddingTop: config.metrics.rg,
					paddingHorizontal: config.metrics.md,
				}}
			>
				<Text bold size="lg">
					{state.subject}
				</Text>
				<HR noMarginBottom />
			</View>
			<View style={styles.conversationContainer}>
				{renderConversation()}
			</View>
			{/* TODO: render attached files */}
			{state.allowReply && state.inputReady && (
				<MessageInput
					message={state.message}
					sending={state.sending}
					handleEnterMessage={handleEnterMessage}
					handleSendMessage={handleSendMessage}
					handleSendGIF={handleSendGIF}
				/>
			)}

			{!state.allowReply && state.inputReady && (
				<View style={styles.inputErrorDisplay}>
					<Text>Replies to this conversation have been disabled</Text>
				</View>
			)}
			<Modal
				visible={state.selectedMessage !== null}
				onDismiss={() =>
					setState(prevState => ({
						...prevState,
						selectedMessage: null,
					}))
				}
			>
				{renderOptions(
					state.list[
						state.selectedMessage as number
					] as SendMessageDataType,
				)}
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	optionItemStyle: {
		borderBottomWidth: 1,
		borderBottomColor: '#EEEEEE',
		paddingVertical: 10,
	},
	conversationContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	alignSelfCenter: {
		alignSelf: 'center',
	},
	inputErrorDisplay: {
		alignItems: 'center',
		paddingVertical: 15,
		width: '100%',
	},
});

export default ConversationScreen;
