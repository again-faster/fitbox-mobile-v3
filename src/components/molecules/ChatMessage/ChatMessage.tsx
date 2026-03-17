import useAuth from '@/auth/hooks/useAuth';
import { Avatar, LinkPreview, Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { SendMessageDataType } from '@/types/schemas/message';
import { Func } from '@/utils';
import { isEmpty } from 'lodash';
import moment from 'moment';
import React from 'react';
import {
	Image,
	ImageSourcePropType,
	ImageStyle,
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import HTMLView from 'react-native-htmlview';
import ImagePop from '../ImagePop/ImagePop';

type ChatMessageProps = {
	data: SendMessageDataType;
	messageOnly: boolean;
	onLongPress: () => void;
	dontDisplayTime: boolean;
	index: number;
};

const MemoizedImage = React.memo(
	({
		source,
		style,
	}: {
		source: ImageSourcePropType;
		style: StyleProp<ImageStyle>;
	}) => <Image source={source} style={style} />,
);

const ChatMessage = (props: ChatMessageProps) => {
	const { user } = useAuth();

	const { data, messageOnly, onLongPress, dontDisplayTime, index } = props;
	const isFromUser = data.sender_id === user?.user_data.user_id;

	const isGifUrl = (url: string) => {
		return /\.(gif)$/i.test(url);
	};

	const lines = data.message.split('\n');
	const hasGIF = isGifUrl(lines[lines.length - 1] as string);
	let combinedString =
		lines.length > 1 && hasGIF
			? lines.slice(0, -1).join('\n')
			: lines.join('\n');

	let link: string | null = null;
	if (combinedString.substring(0, 4).toLowerCase() === 'http') {
		const splitString = combinedString.split(' ');
		link = splitString.shift() as string;
		combinedString = splitString.join(' ');
	}

	const flexDirection = isFromUser ? 'row-reverse' : 'row';
	const alignItems = isFromUser ? 'flex-end' : 'flex-start';
	const textColor = isFromUser ? 'white' : 'black';
	const messageBubble = isFromUser
		? { borderBottomRightRadius: 0 }
		: { borderBottomLeftRadius: 0 };
	const messageBackground = {
		paddingHorizontal: hasGIF ? config.metrics.md : config.metrics.rg,
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

	const isHTML = Func.isHTML(combinedString);

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
					{!isEmpty(combinedString) &&
						(isHTML ? (
							<HTMLView
								value={combinedString}
								stylesheet={{
									p: {
										color: isFromUser ? 'white' : 'black',
										fontSize: config.fonts.metrics.md,
										fontFamily: 'Montserrat-Regular',
									},
								}}
							/>
						) : (
							<Text size="md" style={{ color: textColor }}>
								{combinedString}
							</Text>
						))}
					{hasGIF && (
						<MemoizedImage
							source={{
								uri: lines[lines.length - 1],
							}}
							style={styles.gif}
						/>
					)}
					{data.attached_files.length > 0 && (
						<>
							{data.attached_files.map(f => {
								if (f.type === 'image')
									return (
										<ImagePop
											key={f.id}
											source={f.public_url}
										/>
									);
								return (
									<LinkPreview
										key={f.id}
										link={f.public_url}
										filename={Func.getAttachmentDisplayName(
											{
												name: f.name,
												public_url: f.public_url,
											},
										)}
									/>
								);
							})}
						</>
					)}

					{link && <LinkPreview link={link} />}
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
