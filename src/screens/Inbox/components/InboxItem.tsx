import useAuth from '@/auth/hooks/useAuth';
import { Avatar, Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import {
	MessageItemAttachmentType,
	MessageItemType,
	MessageItemUserType,
} from '@/types/schemas/message';
import { Func } from '@/utils';
import { isArray } from 'lodash';
import moment from 'moment';
import { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Badge } from 'react-native-paper';

const { fonts } = config;

type InboxItemProps = {
	index: number;
	data: MessageItemType;
	onPress: (item: MessageItemType, index: number) => void;
};

const InboxItem = ({ index, data, onPress }: InboxItemProps) => {
	const { user: userFromAuth } = useAuth();
	// Prepare list of users in the conversation and filter userId
	let listOfUsers = data.user_list;

	const isGifUrl = (url: string) => {
		return /\.(gif)$/i.test(url);
	};

	const isFromUser = data.sender_id === userFromAuth?.user_data.user_id;
	const isGroup = data.group.length > 2;

	// Prepare sender info
	let senderInfo =
		listOfUsers.find(user => user.id === data.sender_id) ||
		(listOfUsers[0] as MessageItemUserType);

	// If there are more than 1 user in the conversation, filter out the current user
	// This is to prevent from showing undefined in the display name if there is an issue with the users list
	if (listOfUsers && listOfUsers.length > 1) {
		listOfUsers = data.user_list.filter(user => user.id !== data.userId);
	}

	// if sender id is current user, use the other user in the list
	if (data.sender_id === data.userId) {
		senderInfo = listOfUsers[0] as MessageItemUserType;
	}

	// Prepare message
	let { message } = data;
	if (message === '') {
		const attachedFiles =
			data.attached_files as MessageItemAttachmentType[];

		let attachments:
			| MessageItemAttachmentType[]
			| MessageItemAttachmentType = attachedFiles;

		if (
			typeof attachedFiles.length === 'undefined' &&
			Object.keys(attachedFiles).length > 0
		) {
			attachments = Object.values(
				attachedFiles,
			)[0] as MessageItemAttachmentType;
		}

		if (isArray(attachments) && attachments.length > 0) {
			if (attachments[0]?.type === 'image') {
				if (isFromUser) message = 'You sent an image';
				else message = `${data.firstname} sent an image`;
			} else if (attachments[0]?.type === 'video') {
				if (isFromUser) message = 'You sent a video';
				else message = `${data.firstname} sent a video`;
			} else if (isFromUser) message = 'You sent a file';
			else message = `${data.firstname} sent a file`;
		}
	} else if (isFromUser) {
		message = `You: ${message}`;
	} else if (isGroup) {
		if (isFromUser) {
			message = `You: ${message}`;
		} else {
			message = `${data.firstname}: ${message}`;
		}
	}

	if (isGifUrl(message)) {
		if (isFromUser) {
			message = 'You sent a GIF';
		} else {
			message = `${data.firstname} sent a GIF`;
		}
	}
	// Prepare display name
	const displayName = `${senderInfo?.firstname} ${senderInfo?.lastname}`;

	// Prepare others number
	const othersNumber =
		listOfUsers.length > 1 ? `${listOfUsers.length} members` : '';

	// Check if last reply is sender
	const lastReplyIsSender = data.sender_id === senderInfo.id;

	return (
		<View style={{ backgroundColor: fonts.colors.light }}>
			<TouchableOpacity onPress={() => onPress(data, index)}>
				<Row style={styles.itemStyle}>
					<View>
						<Avatar source={senderInfo.profile_image} size={60} />

						{!lastReplyIsSender ? (
							<View style={styles.lastReplyAvatarContainerStyle}>
								<Avatar
									size={30}
									source={data.profile_image}
									style={styles.lastReplyAvatarStyle}
								/>
							</View>
						) : null}

						{data.num_of_unread_messages > 0 && (
							<Badge
								size={fonts.metrics.md}
								style={styles.badgeStyle}
								allowFontScaling={false}
							/>
						)}
					</View>
					<Spacer horizontal size="sm" />
					<View style={layout.flex_1}>
						<Row spacing="space-between">
							<View style={styles.nameContainerStyle}>
								<Text size="md" numberOfLines={1}>
									{listOfUsers.length > 1
										? othersNumber
										: displayName}
								</Text>
							</View>
							<View style={layout.itemsEnd}>
								<Text size="xs" color="mute">
									{moment(data.created_at).format('DD MMM')}
								</Text>
								<Text size="xs" color="mute">
									{moment(data.created_at).format('YYYY')}
								</Text>
							</View>
						</Row>
						<Text size="md" bold numberOfLines={1}>
							{data.subject}
						</Text>
						<Text color="mute" numberOfLines={1}>
							{Func.stripHtmlTags(message)}
						</Text>
						<Spacer size="sm" />
					</View>
				</Row>
			</TouchableOpacity>
		</View>
	);
};

export default memo(InboxItem);

const styles = StyleSheet.create({
	itemStyle: {
		paddingHorizontal: fonts.metrics.md,
		paddingVertical: fonts.metrics.sm,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: fonts.colors.gray,
	},
	lastReplyAvatarContainerStyle: {
		position: 'absolute',
		right: 0,
		bottom: 0,
	},
	lastReplyAvatarStyle: {
		backgroundColor: 'white',
		borderColor: 'white',
		borderWidth: 2,
	},
	badgeStyle: {
		position: 'absolute',
		right: 2,
		top: 2,
		backgroundColor: fonts.colors.brand,
		color: fonts.colors.light,
	},
	nameContainerStyle: {
		flex: 1,
		marginRight: fonts.metrics.sm,
	},
});
