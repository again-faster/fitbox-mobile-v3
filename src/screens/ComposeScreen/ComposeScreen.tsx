import useAuth from '@/auth/hooks/useAuth';
import { Row, Spacer, Text } from '@/components/atoms';
import { MessageInput } from '@/components/molecules';
import { sendConversationMessage } from '@/services/message';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ComposeParams, ComposeScreenProps } from '@/types/navigation';
import { ContactMembersType } from '@/types/schemas/message';
import { Say } from '@/utils';
import useStore from '@/zustand/Store';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
	Alert,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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
		navigation.navigate('Inbox');
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

			if (!recipients) {
				return Alert.alert('Please add a recipient');
			}

			if (!subject) {
				return Alert.alert('Subject is required');
			}
			// TODO: add attachedfiles.length > 0 in condition
			if (message) {
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
				navigation.navigate('Inbox');
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

			if (!recipients) {
				return Alert.alert('Please add a recipient');
			}
			if (!subject) {
				return Alert.alert('Subject is required');
			}
			// TODO: add attachedfiles.length > 0 in condition
			if (url) {
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
				navigation.navigate('Inbox');
			}
		} catch (e) {
			return Alert.alert('Something went wrong');
		}

		return setState(prevState => ({ ...prevState, sending: false }));
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

				<MessageInput
					message={state.message}
					handleEnterMessage={handleEnterMessage}
					sending={state.sending}
					handleSendGIF={handleSendGIF}
					handleSendMessage={handleSendMessage}
				/>
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
});

export default ComposeScreen;
