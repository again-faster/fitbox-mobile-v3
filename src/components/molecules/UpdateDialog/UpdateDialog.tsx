import { Button, ImageVariant, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import LogoImage from '@/theme/assets/images/logo.png';
import { Constant } from '@/utils';
import VersionCheck from 'react-native-version-check';
import {
	ImageProps,
	ImageSourcePropType,
	Linking,
	Modal,
	Platform,
	SafeAreaView,
	StyleProp,
	StyleSheet,
	View,
} from 'react-native';

const PREVIEW_PACKAGE_NAME = 'com.againfaster.fitbox.preview';
const PREVIEW_TESTFLIGHT_URL =
	'itms-beta://beta.itunes.apple.com/v1/app/6792605351';
const PREVIEW_INTERNAL_TEST_URL =
	'https://play.google.com/apps/internaltest/4701658175453440071';
const PRODUCTION_IOS_APP_ID = '1462002702';

export const getUpdateUrl = async (
	platform = Platform.OS,
	packageName = VersionCheck.getPackageName(),
) => {
	if (platform === 'android' && packageName === PREVIEW_PACKAGE_NAME) {
		return PREVIEW_INTERNAL_TEST_URL;
	}

	if (platform === 'ios') {
		if (packageName === PREVIEW_PACKAGE_NAME) {
			return PREVIEW_TESTFLIGHT_URL;
		}
		return VersionCheck.getAppStoreUrl({ appID: PRODUCTION_IOS_APP_ID });
	}

	return VersionCheck.getPlayStoreUrl({ packageName });
};

const UpdateDialog = () => {
	const openUpdateDestination = async () => {
		try {
			await Linking.openURL(await getUpdateUrl());
		} catch (error) {
			// eslint-disable-next-line no-console
			console.warn('Unable to open update destination:', error);
		}
	};

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
			<Button
				title="Update"
				style={styles.updateButton}
				onPress={() => void openUpdateDestination()}
			/>
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
