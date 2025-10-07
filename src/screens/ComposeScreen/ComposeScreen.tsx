import useAuth from '@/auth/hooks/useAuth';
import { KeyboardSpacer, Row, Spacer, Text } from '@/components/atoms';
import { MessageInput } from '@/components/molecules';
import { sendConversationMessage } from '@/services/message';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ComposeParams, ComposeScreenProps } from '@/types/navigation';
import { ContactMembersType } from '@/types/schemas/message';
import { Func, Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import { isEmpty } from 'lodash';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
	Alert,
	Platform,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
	const {
		setAppState,
		storeMessage,
		storeSubject,
		attachedFiles,
		inboxTeamId,
		teamId,
	} = useStore(state => ({
		setAppState: state.setAppState,
		storeMessage: state.message,
		storeSubject: state.subject,
		attachedFiles: state.attachedFiles,
		inboxTeamId: state.inboxTeamId,
		teamId: state.teamId,
	}));
	const { user } = useAuth();
	const { contacts, defaultSubject, navigateToSession } =
		route.params as ComposeParams;
	const [replyDisabled, setDisableReply] = useState(false);
	const [state, setState] = useState<State>({
		message: storeMessage || '',
		to: '',
		recipients: '',
		recipientIds: [],
		subject: storeSubject || defaultSubject || '',
		disable_reply: false,
		sending: false,
		isStaff: !!user?.user_data.is_staff,
	});
	const [gifUrl, setGIFUrl] = useState<string>('');

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
		setAppState('attachedFiles', []);
		navigation.goBack();
	};

	const handleClearFiles = () => {
		setAppState('attachedFiles', []);
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
	}, [contacts]);

	const handleEnterMessage = (message: string) =>
		setState(prevState => ({ ...prevState, message }));
	const handleEnterSubject = (subject: string) =>
		setState(prevState => ({ ...prevState, subject }));

	const handleBrowseFiles = () => navigation.navigate('BrowseMedia');

	const handleSendMessage = async () => {
		try {
			let { subject, message } = state;

			const { recipients, recipientIds, sending } = state;

			if (sending) return false;

			subject = subject.trim();
			message = message.trim();
			const composeMessage = !isEmpty(gifUrl)
				? `${message}\n${gifUrl}`
				: message;

			if (!recipients) {
				return Alert.alert('Please add a recipient');
			}

			if (!subject) {
				return Alert.alert('Subject is required');
			}

			if (composeMessage || attachedFiles.length > 0) {
				setState(prevState => ({ ...prevState, sending: true }));

				let payload: {
					subject: string;
					message: string;
					recipients?: string;
					disable_reply?: boolean;
					convo_id?: number;
					mediaAttachments?: string[];
					team_id: number;
				} = {
					subject,
					message: composeMessage,
					recipients: recipientIds.join(','),
					disable_reply: !!replyDisabled,
					team_id: defaultSubject ? teamId : inboxTeamId,
				};

				if (attachedFiles.length > 0) {
					if (attachedFiles[0]?.from === 'fitbox_gallery') {
						payload.message = `${attachedFiles[0].url} ${payload.message}`;
					} else {
						payload = {
							...payload,
							mediaAttachments: [
								attachedFiles[0]?.base64 as string,
							],
						};
					}
				}

				await sendConversationMessage(payload).catch(e =>
					Say.err(e as ICatchError),
				);

				setState(prevState => ({ ...prevState, message: '' }));
				setGIFUrl('');
				setAppState('attachedFiles', []);
				if (navigateToSession || defaultSubject) {
					navigation.goBack();
				} else {
					navigation.navigate('Inbox');
				}
			}
		} catch (e) {
			return Alert.alert('Something went wrong');
		}

		return setState(prevState => ({ ...prevState, sending: false }));
	};

	const handlePressRecipients = () => {
		setAppState('message', state.message);
		setAppState('subject', state.subject);
		if (defaultSubject) {
			navigation.navigate('Contacts', { defaultRecipients: contacts });
		} else {
			navigation.navigate('Contacts', {});
		}
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
					style={layout.fontMontserratRegular}
					keyboardType="twitter"
					allowFontScaling={false}
				/>
			</View>
			<View style={styles.footerContainer}>
				{attachedFiles.length > 0 && (
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
								{attachedFiles[0]?.fileName}
							</Text>
						</Row>
						<TouchableOpacity onPress={handleClearFiles}>
							<Icon
								name="close-outline"
								size={config.metrics.lg}
								color={config.backgrounds.light}
								style={styles.closeAttachmentIcon}
							/>
						</TouchableOpacity>
					</Row>
				)}
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
							<View style={styles.disableReplyIcon}>
								<MaterialIcons
									name={
										!replyDisabled
											? 'checkbox-blank-outline'
											: 'checkbox-outline'
									}
									color={config.backgrounds.mute}
									size={20}
								/>
							</View>
						</Row>
					</TouchableOpacity>
				)}

				<MessageInput
					message={state.message}
					handleEnterMessage={handleEnterMessage}
					sending={state.sending}
					handleSendMessage={handleSendMessage}
					setGIFUrl={setGIFUrl}
					handleBrowseFiles={handleBrowseFiles}
				/>
			</View>
			{(Func.isAndroid15OrLater() || Platform.OS === 'ios') && (
				<KeyboardSpacer
					heightDeduction={Func.isAndroid15OrLater() ? 50 : 80}
				/>
			)}
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
	disableReplyIcon: {
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default ComposeScreen;
