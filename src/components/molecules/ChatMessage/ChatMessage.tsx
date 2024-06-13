import useAuth from '@/auth/hooks/useAuth';
import { Avatar, Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { SendMessageDataType } from '@/types/schemas/message';
import moment from 'moment';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

type ChatMessageProps = {
	data: SendMessageDataType;
	messageOnly: boolean;
	onLongPress: () => void;
	dontDisplayTime: boolean;
	index: number;
};

const ChatMessage = (props: ChatMessageProps) => {
	const { user } = useAuth();

	const { data, messageOnly, onLongPress, dontDisplayTime, index } = props;
	const isFromUser = data.sender_id === user?.user_data.user_id;

	const isGifUrl = (url: string) => {
		return /\.(gif)$/i.test(url);
	};

	const flexDirection = isFromUser ? 'row-reverse' : 'row';
	const alignItems = isFromUser ? 'flex-end' : 'flex-start';
	const textColor = isFromUser ? 'white' : 'black';
	const messageBubble = isFromUser
		? { borderBottomRightRadius: 0 }
		: { borderBottomLeftRadius: 0 };
	const messageBackground = isGifUrl(data.message)
		? { padding: 0 }
		: {
				backgroundColor: isFromUser
					? config.colors.info
					: config.backgrounds.gray,
		  };
	const messageContainer = {
		marginTop: dontDisplayTime ? 0 : config.metrics.rg,
	};

	const messageMarginTop = {
		marginTop: dontDisplayTime ? config.metrics.xs : config.metrics.sm,
		marginBottom: index === 0 ? config.metrics.rg : 0,
	};

	const renderMessage = () => (
		<Row
			style={[
				styles.container,
				{
					flexDirection,
				},
			]}
		>
			<View style={styles.senderContainer}>
				{!messageOnly && (
					<>
						<Avatar source={data.profile_image} />
						<View>
							<Text color="darkgray" size="xs" numberOfLines={1}>
								{data.firstname} {data.lastname}
							</Text>
						</View>
					</>
				)}
			</View>

			<Spacer size="sm" horizontal />

			<View
				style={{
					...layout.flex_1,
					alignItems,
					...messageContainer,
				}}
			>
				{!dontDisplayTime && (
					<Text center size="xs" color="darkgray">
						{moment.utc(data.created_at).local().format('MMM DD')}{' '}
						{moment.utc(data.created_at).local().format('h:mm a')}
					</Text>
				)}

				<View
					style={[
						styles.msg,
						messageBubble,
						messageBackground,
						messageMarginTop,
					]}
				>
					{isGifUrl(data.message) ? (
						<Image
							source={{
								uri: data.message,
							}}
							style={styles.gif}
						/>
					) : (
						<Text size="md" style={{ color: textColor }}>
							{data.message}
						</Text>
					)}
				</View>
			</View>
		</Row>
	);

	return (
		<TouchableOpacity
			activeOpacity={0.9}
			onLongPress={onLongPress}
			delayLongPress={1000}
		>
			{renderMessage()}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: config.metrics.md,
	},
	senderContainer: {
		width: 60,
		alignItems: 'center',
		paddingTop: config.metrics.rg,
		justifyContent: 'flex-end',
	},
	msg: {
		padding: config.metrics.rg,
		borderRadius: config.metrics.rg,
	},
	gif: {
		width: 150,
		height: 150,
	},
});

export default ChatMessage;
