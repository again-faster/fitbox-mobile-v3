import { Row } from '@/components/atoms';
import { GIFList } from '@/screens/ScoreCommentsScreen/components';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import useStore from '@/zustand/Store';
import { Dispatch, SetStateAction, useState } from 'react';
import {
	ActivityIndicator,
	Platform,
	StyleSheet,
	TextInput,
	TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

type MessageInputProps = {
	message: string;
	handleEnterMessage: (message: string) => void;
	sending: boolean;
	handleSendMessage: () => Promise<false | void>;
	setGIFUrl: Dispatch<SetStateAction<string>>;
	handleBrowseFiles?: () => void;
};

const MessageInput = (props: MessageInputProps) => {
	const {
		message,
		handleEnterMessage,
		sending,
		handleSendMessage,
		setGIFUrl,
		handleBrowseFiles,
	} = props;
	const [toggleGif, setToggleGif] = useState<boolean>(false);

	const { attachedFiles } = useStore(state => ({
		attachedFiles: state.attachedFiles,
	}));

	return (
		<>
			{toggleGif && (
				<GIFList setGIFUrl={setGIFUrl} setToggleGIF={setToggleGif} />
			)}

			<Row style={styles.footerInnerWrapper} align="center">
				{attachedFiles.length === 0 && (
					<TouchableOpacity onPress={handleBrowseFiles}>
						<Icon
							name="attach-outline"
							size={config.metrics.xl}
							color={config.colors.brand}
						/>
					</TouchableOpacity>
				)}
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
					allowFontScaling={false}
				/>

				{!sending && (
					<TouchableOpacity
						onPress={() => {
							void handleSendMessage();
							setToggleGif(false);
						}}
					>
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
		...layout.fontMontserratRegular,
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
		...layout.fontMontserratRegular,
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
