import { useState } from 'react';
import {
	Alert,
	Dimensions,
	ImageSourcePropType,
	StyleSheet,
	View,
} from 'react-native';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// import useAuth from '@/auth/hooks/useAuth';
import { Button, ImageVariant, Row, Spacer, Text } from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { config } from '@/theme/_config';
import LogoImage from '@/theme/assets/images/logo_with_name.png';
import { ApplicationScreenProps } from '@/types/navigation';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const LandingScreen = ({ navigation }: ApplicationScreenProps) => {
	const { t } = useTranslation(['landing', 'common']);
	// const { signIn } = useAuth();

	const [optionsVisibility, setOptionsVisibility] = useState<boolean>(false);

	const toggleOptionVisibility = () =>
		setOptionsVisibility(!optionsVisibility);

	const navigateToPage = (page: string) => {
		setOptionsVisibility(false);

		// TODO: Temporary only remove once screens are implemented
		if (page === 'Main') {
			navigation.navigate(page);
		} else {
			Alert.alert(`${page} page coming soon!`);
		}
	};

	const handleLogin = () => {
		navigation.push('Login');

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

	return (
		<View style={styles.main}>
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
});
