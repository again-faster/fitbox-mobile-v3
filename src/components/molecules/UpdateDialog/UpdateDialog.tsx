import { Button, ImageVariant, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import LogoImage from '@/theme/assets/images/logo.png';
import { Constant } from '@/utils';
import {
	ImageProps,
	ImageSourcePropType,
	Modal,
	SafeAreaView,
	StyleProp,
	StyleSheet,
	View,
} from 'react-native';

const UpdateDialog = () => {
	const imageStyles: StyleProp<ImageProps> = {
		width: Constant.DEVICEWIDTH / 2,
		height: Constant.DEVICEWIDTH / 2,
	};

	return (
		<Modal visible>
			<SafeAreaView style={styles.container}>
				<View style={styles.content}>
					<ImageVariant
						source={LogoImage as ImageSourcePropType}
						style={{ ...imageStyles, ...styles.image }}
					/>
					<Spacer size="lg" />
					<Text size="xl" bold center>
						New update available
					</Text>
					<Spacer />
					<Text size="md" center>
						Your application is outdated. Please update to the
						latest version to continue using the app.
					</Text>
				</View>
			</SafeAreaView>
			<Button title="Update" style={styles.updateButton} />
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
	},
	content: {
		padding: config.metrics.lg,
		alignItems: 'center',
	},
	image: {
		resizeMode: 'contain',
	},
	updateButton: {
		margin: config.metrics.lg,
	},
});

export default UpdateDialog;
