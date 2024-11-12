import HeaderButtonGroup from '@/components/template/Header/HeaderButtonGroup';
import { config } from '@/theme/_config';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { goBack } from '../NavigationRef';

const HeaderCloseButton = () => {
	return (
		<HeaderButtonGroup>
			<Ionicons
				name="close"
				size={24}
				onPress={() => goBack()}
				color={config.fonts.colors.darkgray}
			/>
		</HeaderButtonGroup>
	);
};

export default HeaderCloseButton;
