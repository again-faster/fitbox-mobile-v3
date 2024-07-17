import useAuth from '@/auth/hooks/useAuth';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { GIFItemType } from '@/types/schemas/message';
import { SearchGIFResponseType } from '@/types/schemas/response';
import { Constant, Say } from '@/utils';
import { debounce, isEmpty } from 'lodash';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import {
	FlatList,
	Image,
	Platform,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';

const GIFList = ({
	setToggleGIF,
	setGIFUrl,
}: {
	setToggleGIF: Dispatch<SetStateAction<boolean>>;
	setGIFUrl: Dispatch<SetStateAction<string>>;
}) => {
	const { user } = useAuth();
	const [searchQuery, setSearchQuery] = useState<string>();
	const [gifList, setGifList] = useState<GIFItemType[]>([]);
	const gifRef = useRef<FlatList | null>(null);
	const [chosenGIF, setChosenGIF] = useState<string>();

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
				if (gifList.length > 0)
					gifRef.current?.scrollToIndex({ animated: true, index: 0 });
			} catch (e) {
				Say.err(e as string);
			}
		}, 500);

		void debouncedEffect(searchQuery as string);

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
				onPress={() => {
					setChosenGIF(item.media_formats.mediumgif.url);
					setGIFUrl(item.media_formats.mediumgif.url);
				}}
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
		<View style={styles.searchGIFContainer}>
			{isEmpty(chosenGIF) && (
				<>
					<Icon
						name="close-outline"
						size={config.metrics.lg}
						color={config.backgrounds.darkgray}
						style={styles.closeAttachmentIcon}
						onPress={() => {
							setToggleGIF(false);
							setChosenGIF('');
							setGIFUrl('');
						}}
					/>
					<Searchbar
						placeholder="Search Tenor"
						style={styles.searchGIF}
						value={searchQuery as string}
						onChangeText={text => setSearchQuery(text)}
						inputStyle={styles.searchInputGIF}
					/>
					<FlatList
						horizontal
						data={gifList}
						renderItem={renderGIFTile}
						showsHorizontalScrollIndicator={false}
						ref={gifRef}
						keyboardShouldPersistTaps="always"
					/>
				</>
			)}
			{!isEmpty(chosenGIF) && (
				<View style={styles.chosenGIFContainer}>
					<Icon
						name="close-outline"
						size={config.metrics.lg}
						color={config.backgrounds.darkgray}
						style={styles.closeAttachmentIcon}
						onPress={() => {
							setChosenGIF('');
							setGIFUrl('');
						}}
					/>
					<Image
						source={{
							uri: chosenGIF,
						}}
						style={styles.chosenGIFStyle}
					/>
				</View>
			)}
		</View>
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
	closeAttachmentIcon: {
		marginTop: config.metrics.sm,
		marginRight: config.metrics.sm,
		alignSelf: 'flex-end',
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
	gifContainer: {
		paddingHorizontal: 2,
	},
	gifStyle: {
		width: 100,
		height: 100,
	},
	chosenGIFStyle: {
		width: 170,
		height: 170,
	},
	chosenGIFContainer: {
		paddingTop: config.metrics.xs,
		paddingBottom: config.metrics.rg,
		alignItems: 'center',
	},
});
export default GIFList;
