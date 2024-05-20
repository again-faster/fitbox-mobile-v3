import TeamAvatar from '@/components/atoms/TeamAvatar/TeamAvatar';
import HeaderButtonGroup from '@/components/template/Header/HeaderButtonGroup';
import { ApplicationStackParamList } from '@/types/navigation';
import useStore from '@/zustand/Store';
import { NavigationProp, useNavigation } from '@react-navigation/native';

const CalendarHeaderLeftComponent = () => {
	const navigation: NavigationProp<ApplicationStackParamList> =
		useNavigation();

	const logo = useStore(state => state.logo);
	const handleAvatarPress = () => navigation.navigate('SwitchGym');

	return (
		<HeaderButtonGroup>
			<TeamAvatar
				rounded
				size="sm"
				logo={logo}
				onPress={handleAvatarPress}
			/>
		</HeaderButtonGroup>
	);
};

export default CalendarHeaderLeftComponent;
