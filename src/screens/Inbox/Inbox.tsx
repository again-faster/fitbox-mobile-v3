import { Loader } from '@/components/molecules';
import { config } from '@/theme/_config';

import {
	GiphyContent,
	GiphyGridView,
	GiphyMediaType,
} from '@giphy/react-native-sdk';
import { useState } from 'react';
import {
	Dimensions,
	Image,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { TextInput } from 'react-native-paper';

const defaultGif = 'https://media.giphy.com/media/wNyqCUODGgnLa0KBPy/giphy.gif';

const { width, height } = Dimensions.get('window');
const gifSize = width / 1.5;

const Inbox = () => {
	const [gif, setGif] = useState(defaultGif);
	const [gifLoaded, setLoaded] = useState(true);
	const [isSearchGif, setSearchGif] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	return (
		<View style={styles.container}>
			{isSearchGif ? (
				<View style={{ padding: config.metrics.md }}>
					<TextInput
						mode="outlined"
						value={searchQuery}
						placeholder="Type something"
						onChangeText={setSearchQuery}
						right={<TextInput.Icon icon="magnify" />}
					/>

					<GiphyGridView
						content={GiphyContent.search({
							searchQuery,
							mediaType: GiphyMediaType.Gif,
						})}
						cellPadding={3}
						style={{
							height: height / 1.4,
							marginTop: config.metrics.lg,
						}}
						onMediaSelect={e => {
							setLoaded(false);
							setGif(e.nativeEvent.media.url);
							setSearchGif(false);
						}}
					/>
				</View>
			) : (
				<View style={styles.gifContainer}>
					<TouchableOpacity onPress={() => setSearchGif(true)}>
						<Image
							source={{ uri: gif }}
							onLoad={() => setLoaded(true)}
							style={gifLoaded ? styles.gif : {}}
						/>
						{gifLoaded ? null : <Loader size={50} />}
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	gifContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	gif: {
		width: gifSize,
		height: gifSize,
	},
});

export default Inbox;
