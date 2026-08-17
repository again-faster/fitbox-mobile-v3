import { useEffect, useMemo, useState } from 'react';
import {
	ImageSourcePropType,
	StyleSheet,
	useWindowDimensions,
	View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import useAuth from '@/auth/hooks/useAuth';
import { Button, ImageVariant, Row, Spacer, Text } from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { navigate } from '@/navigators/NavigationRef';
import { config } from '@/theme/_config';
import LogoImage from '@/theme/assets/images/logo_with_name.png';
import { ApplicationScreenProps } from '@/types/navigation';
import { Constant } from '@/utils';
import { useTranslation } from 'react-i18next';

const LandingScreen = ({ navigation }: ApplicationScreenProps) => {
	const { t } = useTranslation(['landing', 'common']);
	const { getApiUrl, setApiUrl } = useAuth();
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();

	// enable or disable the environment picker by setting the value in Constant.ts
	const enableEnvPicker = Constant.ENABLE_ENV_PICKER;

	const [optionsVisibility, setOptionsVisibility] = useState<boolean>(false);
	const [currentApi, setCurrentApi] = useState<string>(getApiUrl());

	const layoutStyles = useMemo(
		() => ({
			main: {
				paddingTop: insets.top,
				paddingBottom: insets.bottom,
			},
			container: {
				paddingBottom: width * 0.3,
			},
			logoImage: {
				top: width * 0.35,
				width: width * 0.6,
				height: width * 0.3,
			},
			changeEnvButton: {
				top: insets.top + width * 0.02,
			},
		}),
		[insets.bottom, insets.top, width],
	);

	const toggleOptionVisibility = () =>
		setOptionsVisibility(!optionsVisibility);

	const navigateToPage = (page: string) => {
		setOptionsVisibility(false);

		navigate(page);
	};

	const handleLogin = () => {
		navigation.push('Login', {});

		// Identity implementation
		// const res = await signIn();
		// if (res.accessToken) {
		// 	navigation.reset({
		// 		index: 0,
		// 		routes: [{ name: 'Main' }],
		// 	});
		// }
		// End of Identity implementation
	};

	useEffect(() => {
		if (!enableEnvPicker) {
			setApiUrl(Constant.API_URL);
		}
	}, []);

	const envList = Object.values(Constant.API_BASE_URLS);
	const onRotateEnv = () => {
		const currentIndex = envList.indexOf(getApiUrl());

		const newIndex =
			currentIndex + 1 >= envList.length ? 0 : currentIndex + 1;

		setApiUrl(String(envList[newIndex]));
		setCurrentApi(String(envList[newIndex]));
	};

	return (
		<View style={[styles.main, layoutStyles.main]}>
			<View style={[styles.container, layoutStyles.container]}>
				<ImageVariant
					source={LogoImage as ImageSourcePropType}
					style={[styles.logoImage, layoutStyles.logoImage]}
				/>

				<View style={styles.buttonGroup}>
					<Button
						title={t('landing:login')}
						variant="darkgray"
						onPress={handleLogin}
						style={{ width: width * 0.55 }}
					/>
					<Spacer size="rg" />
					<Button
						title={t('landing:register')}
						onPress={toggleOptionVisibility}
						style={{ width: width * 0.55 }}
					/>
					<Spacer size="rg" />
				</View>
			</View>

			{enableEnvPicker && (
				<View
					style={[
						styles.changeEnvButton,
						layoutStyles.changeEnvButton,
					]}
				>
					<Button
						title={currentApi
							.replace('https://', '')
							.replace('.fitbox', '')
							.replace('.iq', '')
							.replace('fitbox', 'PRODUCTION')
							.toUpperCase()}
						variant="darkgray"
						onPress={onRotateEnv}
						sm
					/>
				</View>
			)}

			<Modal
				visible={optionsVisibility}
				onDismiss={toggleOptionVisibility}
			>
				<View style={styles.card}>
					<Row spacing="space-between">
						<Text size="lg">{t('landing:modal.title')}</Text>
						<MIcon
							name="close"
							size={25}
							onPress={toggleOptionVisibility}
						/>
					</Row>
					<Spacer size="rg" />
					<Button
						title={t('landing:modal.button.gym')}
						onPress={() => navigateToPage('SignUp')}
						labelStyle={styles.optionLabelStyle}
					/>
					<Spacer size="sm" />
					<Button
						title={t('landing:modal.button.invite')}
						mode="outlined"
						onPress={() => navigateToPage('Invite')}
						labelStyle={styles.optionLabelStyle}
					/>
				</View>
			</Modal>
		</View>
	);
};

export default LandingScreen;

const styles = StyleSheet.create({
	main: {
		flex: 1,
		alignItems: 'center',
	},
	container: {
		flex: 1,
		justifyContent: 'space-between',
		width: '100%',
		paddingHorizontal: '10%',
	},
	logoImage: {
		alignSelf: 'center',
		resizeMode: 'contain',
	},
	buttonGroup: {
		width: '100%',
		alignItems: 'center',
	},
	mainContainer: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.3)',
		justifyContent: 'center',
	},
	modalBackground: {
		flex: 1,
		width: '100%',
		height: '100%',
		position: 'absolute',
	},
	card: {
		backgroundColor: 'white',
		borderRadius: config.metrics.md,
		padding: config.metrics.md,
		width: '90%',
		alignSelf: 'center',
	},
	optionLabelStyle: {
		paddingVertical: config.metrics.md,
	},
	changeEnvButton: {
		position: 'absolute',
		right: '5%',
	},
});
