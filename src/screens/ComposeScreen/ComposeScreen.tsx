import useAuth from '@/auth/hooks/useAuth';
import { Row, Spacer, Text } from '@/components/atoms';
import { sendConversationMessage } from '@/services/message';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ComposeParams, ComposeScreenProps } from '@/types/navigation';
import { ContactMembersType, GIFItemType } from '@/types/schemas/message';
import { SearchGIFResponseType } from '@/types/schemas/response';
import { Constant, Say } from '@/utils';
import useStore from '@/zustand/Store';
import { debounce } from 'lodash';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	FlatList,
	Image,
	Platform,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

type State = {
	message: string;
	subject: string;
	recipients: string | ContactMembersType[];
	recipientIds: number[];
	sending: boolean;
	disable_reply: boolean;
	isStaff: boolean;
	to: string;
};

const ComposeScreen = ({ navigation, route }: ComposeScreenProps) => {
	// TODO: Navigate to BrowseMedia. Attachment Icon not yet working

	const { setAppState, storeMessage, storeSubject } = useStore(state => ({
		setAppState: state.setAppState,
		storeMessage: state.message,
		storeSubject: state.subject,
	}));
	const { user } = useAuth();
	const { contacts } = route.params as ComposeParams;
	const [replyDisabled, setDisableReply] = useState(false);
	const [state, setState] = useState<State>({
		message: storeMessage || '',
		to: '',
		recipients: '',
		recipientIds: [],
		subject: storeSubject || '',
		disable_reply: false,
		sending: false,
		isStaff: !!user?.user_data.is_staff,
	});
	const [gifList, setGifList] = useState<GIFItemType[]>([]);
	const [toggleGif, setToggleGif] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const gifRef = useRef<FlatList | null>(null);

	useEffect(() => {
		const debouncedEffect = debounce(async (query: string) => {
			const searchUrl = `https://tenor.googleapis.com/v2/search?q=${
				query || 'trending'
			}&key=${Constant.TENOR_API_KEY}&client_key=${
				user?.token as string
			}&limit=30`;
			try {
				const searchRes = await fetch(searchUrl);
				const data: SearchGIFResponseType =
					(await searchRes.json()) as SearchGIFResponseType;
				setGifList(data.results);
				gifRef.current?.scrollToIndex({ animated: true, index: 0 });
			} catch (e) {
				Say.err(e as string);
			}
		}, 500);

		void debouncedEffect(searchQuery);

		return () => {
			debouncedEffect.cancel();
		};
	}, [searchQuery]);

	const renderHeaderCancelButton = () => (
		<TouchableOpacity
			style={{ paddingHorizontal: config.metrics.lg }}
			onPress={handleCancelButton}
		>
			<Text color="info">Cancel</Text>
		</TouchableOpacity>
	);

	const handleCancelButton = () => {
		setAppState('message', '');
		setAppState('subject', '');
		navigation.navigate('Main');
	};

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: renderHeaderCancelButton,
		});
	});

	useEffect(() => {
		if (state.recipients !== contacts) {
			const recipients = contacts
				.map(c => c.fullname + (c.role === 'staff' ? ' (staff)' : ''))
				.join(', ');
			const recipientIds = contacts.map(c => c.id);

			setState(prevState => ({ ...prevState, recipients, recipientIds }));
		}
	}, []);

	const handleEnterMessage = (message: string) =>
		setState(prevState => ({ ...prevState, message }));
	const handleEnterSubject = (subject: string) =>
		setState(prevState => ({ ...prevState, subject }));

	const handleSendMessage = async () => {
		try {
			let { subject, message } = state;

			const {
				recipients,
				recipientIds,
				disable_reply: disableReply,
				sending,
			} = state;
			// TODO: get attachedfiles from props

			if (sending) return false;

			subject = subject.trim();
			message = message.trim();

			if (!recipients) Alert.alert('Please add a recipient');
			else if (!subject) Alert.alert('Subject is required');
			// TODO: add attachedfiles.length > 0 in condition
			else if (message) {
				setState(prevState => ({ ...prevState, sending: true }));

				const payload = {
					subject,
					message,
					recipients: recipientIds.join(','),
					disable_reply: !!disableReply,
				};

				// TODO: add attachedFiles.length logic here

				await sendConversationMessage(payload).catch(e =>
					Say.err(e as string),
				);

				setState(prevState => ({ ...prevState, message: '' }));
				navigation.navigate('Main');
			}
		} catch (e) {
			return Alert.alert('Something went wrong');
		}

		return setState(prevState => ({ ...prevState, sending: false }));
	};

	const handlePressRecipients = () => {
		setAppState('message', state.message);
		setAppState('subject', state.subject);
		navigation.navigate('Contacts');
	};

	const handleSendGIF = async (url: string) => {
		try {
			let { subject } = state;

			const {
				recipients,
				recipientIds,
				disable_reply: disableReply,
				sending,
			} = state;
			// TODO: get attachedfiles from props

			if (sending) return false;

			subject = subject.trim();

			if (!recipients) Alert.alert('Please add a recipient');
			else if (!subject) Alert.alert('Subject is required');
			// TODO: add attachedfiles.length > 0 in condition
			else if (url) {
				setState(prevState => ({ ...prevState, sending: true }));

				const payload = {
					subject,
					message: url,
					recipients: recipientIds.join(','),
					disable_reply: !!disableReply,
				};

				// TODO: add attachedFiles.length logic here

				await sendConversationMessage(payload).catch(e =>
					Say.err(e as string),
				);

				setState(prevState => ({ ...prevState, message: '' }));
				navigation.navigate('Main');
			}
		} catch (e) {
			return Alert.alert('Something went wrong');
		}

		return setState(prevState => ({ ...prevState, sending: false }));
	};

	const renderGIFTile = ({ item }: { item: GIFItemType }) => {
		const tinyGIF = item.media_formats.tinygif;

		return (
			<TouchableOpacity
				style={styles.gifContainer}
				// TODO: change url if GIF is too large to display in the Conversation component
				onPress={() =>
					void handleSendGIF(item.media_formats.mediumgif.url)
				}
			>
				<Image
					source={{
						uri: tinyGIF.url,
					}}
					style={styles.gifStyle}
				/>
			</TouchableOpacity>
		);
	};

	return (
		<View style={layout.flex_1}>
			<View style={styles.recipientContainer}>
				<Row
					style={{
						paddingHorizontal: config.metrics.md,
						paddingVertical: config.metrics.rg,
					}}
					align="center"
				>
					<Text>To</Text>
					<Spacer horizontal />
					<TouchableOpacity
						style={layout.flex_1}
						onPress={handlePressRecipients}
					>
						<Text color="mute" numberOfLines={2}>
							{(state.recipients as string) || 'Recipients'}
						</Text>
					</TouchableOpacity>
				</Row>
			</View>

			<View
				style={{
					padding: config.metrics.md,
					borderBottomWidth: StyleSheet.hairlineWidth,
					borderColor: config.borders.colors.gray,
				}}
			>
				<TextInput
					value={state.subject}
					onChangeText={handleEnterSubject}
					placeholder="Subject"
					underlineColorAndroid="transparent"
					keyboardType="twitter"
				/>
			</View>
			<View style={styles.footerContainer}>
				<Row
					spacing="space-between"
					style={{
						padding: config.metrics.rg,
						backgroundColor: config.backgrounds.dark,
					}}
					align="center"
				>
					<Row style={layout.flex_1} align="center">
						<Icon
							name="attach-outline"
							size={config.metrics.lg}
							color={config.backgrounds.light}
							style={{ marginRight: config.metrics.md }}
						/>
						<Text color="light" numberOfLines={1}>
							File Name
						</Text>
					</Row>
					<TouchableOpacity>
						<Icon
							name="close-outline"
							size={config.metrics.lg}
							color={config.backgrounds.light}
							style={styles.closeAttachmentIcon}
						/>
					</TouchableOpacity>
				</Row>
				{user?.user_data.is_staff && (
					<TouchableOpacity
						style={styles.disableReplyButtonStyle}
						onPress={() => setDisableReply(!replyDisabled)}
					>
						<Row
							style={{ paddingHorizontal: config.metrics.rg }}
							spacing="space-between"
						>
							<Text>Disable replies</Text>
							<View style={styles.checkboxInput}>
								{replyDisabled ? (
									<Icon
										name="checkmark-outline"
										size={config.metrics.md}
										color={config.borders.colors.mute}
										style={styles.disableIcon}
									/>
								) : null}
							</View>
						</Row>
					</TouchableOpacity>
				)}

				{toggleGif && (
					<View style={styles.searchGIFContainer}>
						<TouchableOpacity
							style={styles.closeGIF}
							onPress={() => setToggleGif(false)}
						>
							<Icon
								name="close-outline"
								size={config.metrics.lg}
								color={config.backgrounds.darkgray}
								style={styles.closeAttachmentIcon}
							/>
						</TouchableOpacity>
						<Searchbar
							placeholder="Search Tenor"
							style={styles.searchGIF}
							value={searchQuery}
							onChangeText={text => setSearchQuery(text)}
							inputStyle={styles.searchInputGIF}
						/>
						<FlatList
							horizontal
							data={gifList}
							renderItem={renderGIFTile}
							showsHorizontalScrollIndicator={false}
							ref={gifRef}
						/>
					</View>
				)}

				<Row style={styles.footerInnerWrapper} align="center">
					{/* if attachedfiles === 0 */}
					<TouchableOpacity>
						<Icon
							name="attach-outline"
							size={config.metrics.xl}
							color={config.colors.brand}
						/>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => setToggleGif(true)}>
						<MIcon
							name="file-gif-box"
							size={config.metrics.xl}
							color={config.colors.brand}
						/>
					</TouchableOpacity>

					<TextInput
						value={state.message}
						onChangeText={handleEnterMessage}
						style={styles.msgInput}
						placeholder="Type your message here..."
						underlineColorAndroid="transparent"
						multiline
					/>

					{!state.sending && (
						<TouchableOpacity
							onPress={() => void handleSendMessage()}
						>
							<Icon
								name="send"
								size={config.metrics.lg}
								color={config.colors.brand}
							/>
						</TouchableOpacity>
					)}

					{state.sending && <ActivityIndicator />}
				</Row>
				<View style={styles.extraFooterStyle} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	recipientContainer: {
		minHeight: 34,
		borderColor: config.borders.colors.gray,
		borderWidth: StyleSheet.hairlineWidth,
	},
	disableReplyButtonStyle: {
		paddingVertical: config.metrics.rg,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderColor: '#DDD',
	},
	checkboxInput: {
		borderRadius: 5,
		borderWidth: 1,
		borderColor: config.borders.colors.mute,
		alignItems: 'center',
		width: 20,
		height: 20,
		justifyContent: 'center',
	},
	footerInnerWrapper: {
		backgroundColor: config.backgrounds.gray,
		paddingHorizontal: config.metrics.md,
		paddingVertical: config.metrics.sm,
	},
	msgInput: {
		flex: 1,
		padding: config.metrics.rg,
		backgroundColor: config.backgrounds.light,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: config.borders.colors.mute,
		marginHorizontal: config.metrics.rg,
		minHeight: 40,
		maxHeight: 300,
	},
	extraFooterStyle: {
		height: '8%',
		backgroundColor: config.backgrounds.gray,
	},
	disableIcon: {
		alignSelf: 'center',
	},
	closeAttachmentIcon: {
		marginLeft: config.metrics.md,
		alignSelf: 'center',
	},
	footerContainer: {
		flex: 1,
		justifyContent: 'flex-end',
		maxHeight: '100%',
	},
	gifStyle: {
		width: 100,
		height: 100,
	},
	gifContainer: {
		paddingHorizontal: 2,
	},
	searchGIFContainer: {
		minHeight: 104,
		borderColor: config.backgrounds.gray,
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		borderTopWidth: 1,
		borderLeftWidth: 1,
		borderRightWidth: 1,
	},
	closeGIF: {
		alignSelf: 'flex-end',
		marginHorizontal: 8,
		paddingTop: config.metrics.sm,
	},
	searchGIF: {
		height: Platform.OS === 'ios' ? 30 : 33,
		margin: 5,
		justifyContent: 'center',
		marginBottom: config.metrics.rg,
	},
	searchInputGIF: {
		paddingBottom: Platform.OS === 'ios' ? 25 : 29,
		fontSize: config.fonts.metrics.rg,
	},
});

export default ComposeScreen;
