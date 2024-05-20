import HeaderButtonGroup from '@/components/template/Header/HeaderButtonGroup';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { goBack } from '../NavigationRef';

const HeaderCloseButton = () => {
	return (
		<HeaderButtonGroup>
			<Ionicons name="close" size={24} onPress={() => goBack()} />
		</HeaderButtonGroup>
	);
};

export default HeaderCloseButton;
