import useAuth from '@/auth/hooks/useAuth';
import { Row } from '@/components/atoms';
import { config } from '@/theme/_config';
import { GIFItemType } from '@/types/schemas/message';
import { SearchGIFResponseType } from '@/types/schemas/response';
import { Constant, Say } from '@/utils';
import { debounce } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
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

type MessageInputProps = {
	message: string;
	handleEnterMessage: (message: string) => void;
	sending: boolean;
	handleSendGIF: (url: string) => Promise<false | void>;
	handleSendMessage: () => Promise<false | void>;
};

const MessageInput = (props: MessageInputProps) => {
	const { user } = useAuth();
	const {
		message,
		handleEnterMessage,
		sending,
		handleSendGIF,
		handleSendMessage,
	} = props;
	const [toggleGif, setToggleGif] = useState<boolean>(false);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const gifRef = useRef<FlatList | null>(null);
	const [gifList, setGifList] = useState<GIFItemType[]>([]);

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
		<>
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
				{/* TODO: if attachedfiles === 0 */}
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
					value={message}
					onChangeText={handleEnterMessage}
					style={styles.msgInput}
					placeholder="Type your message here..."
					underlineColorAndroid="transparent"
					multiline
				/>

				{!sending && (
					<TouchableOpacity onPress={() => void handleSendMessage()}>
						<Icon
							name="send"
							size={config.metrics.lg}
							color={config.colors.brand}
						/>
					</TouchableOpacity>
				)}

				{sending && <ActivityIndicator />}
			</Row>
		</>
	);
};

const styles = StyleSheet.create({
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
	closeAttachmentIcon: {
		marginLeft: config.metrics.md,
		alignSelf: 'center',
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
	gifContainer: {
		paddingHorizontal: 2,
	},
	gifStyle: {
		width: 100,
		height: 100,
	},
});

export default MessageInput;
