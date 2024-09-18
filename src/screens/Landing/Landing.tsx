import { useEffect, useState } from 'react';
import {
	Alert,
	Dimensions,
	ImageSourcePropType,
	StyleSheet,
	View,
} from 'react-native';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// import useAuth from '@/auth/hooks/useAuth';
import useAuth from '@/auth/hooks/useAuth';
import { Button, ImageVariant, Row, Spacer, Text } from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { config } from '@/theme/_config';
import LogoImage from '@/theme/assets/images/logo_with_name.png';
import { ApplicationScreenProps } from '@/types/navigation';
import { Constant } from '@/utils';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const LandingScreen = ({ navigation }: ApplicationScreenProps) => {
	const { t } = useTranslation(['landing', 'common']);
	const { getApiUrl, setApiUrl } = useAuth();
  
	// enable or disable the environment picker by setting the value in Constant.ts
	const enableEnvPicker = Constant.ENABLE_ENV_PICKER;

	const [optionsVisibility, setOptionsVisibility] = useState<boolean>(false);
	const [currentApi, setCurrentApi] = useState<string>(getApiUrl());

	const toggleOptionVisibility = () =>
		setOptionsVisibility(!optionsVisibility);

	const navigateToPage = (page: string) => {
		setOptionsVisibility(false);

		// TODO: Temporary only remove once screens are implemented
		if (page === 'Main') {
			navigation.navigate(page);
		} else if (page === 'SignUp') {
			navigation.navigate(page);
		} else {
			Alert.alert(`${page} page coming soon!`);
		}
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
		<View style={styles.main}>
			{enableEnvPicker && (
				<View style={styles.changeEnvButton}>
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

			<View style={styles.container}>
				<ImageVariant
					source={LogoImage as ImageSourcePropType}
					height={50}
					style={styles.logoImage}
					width={50}
				/>

				<View>
					<Button
						title={t('landing:login')}
						variant="darkgray"
						onPress={handleLogin}
					/>
					<Spacer size="rg" />
					<Button
						title={t('landing:register')}
						onPress={toggleOptionVisibility}
					/>
					<Spacer size="rg" />
				</View>
			</View>

			{/* TODO: Think about making an organism component for this bit, depending if its useful for other screens */}
			<Modal
				visible={optionsVisibility}
				onDismiss={toggleOptionVisibility}
			>
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
		paddingBottom: width * 0.3,
	},
	logoImage: {
		top: width * 0.35,
		resizeMode: 'contain',
		width: width * 0.6,
		height: width * 0.3,
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
		top: '5%',
	},
});
