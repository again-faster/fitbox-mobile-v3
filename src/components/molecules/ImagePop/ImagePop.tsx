import { Dimensions, Image, StyleSheet, View } from 'react-native';
import Lightbox from 'react-native-lightbox-v2';

const { width, height } = Dimensions.get('window');

const ImagePop = ({ source }: { source: string }) => {
	const renderContent = () => (
		<View style={styles.fullScreenContainer}>
			<Image
				style={styles.fullScreenImage}
				source={{ uri: source }}
				resizeMode="contain"
			/>
		</View>
	);

	return (
		<View>
			<Lightbox renderContent={renderContent} renderHeaderCancelButton>
				<Image
					style={styles.imageStyle}
					source={{ uri: source }}
					resizeMode="contain"
				/>
			</Lightbox>
		</View>
	);
};

const styles = StyleSheet.create({
	imageStyle: {
		width: 200,
		height: 170,
	},
	fullScreenContainer: {
		flex: 1,
		backgroundColor: 'black',
		justifyContent: 'center',
		alignItems: 'center',
	},
	fullScreenImage: {
		width,
		height,
	},
});

export default ImagePop;
