import TeamAvatar from '@/components/atoms/TeamAvatar/TeamAvatar';
import HeaderButtonGroup from '@/components/template/Header/HeaderButtonGroup';
import { Say } from '@/utils';
import useStore from '@/zustand/Store';

const CalendarHeaderLeftComponent = () => {
	const logo = useStore(state => state.logo);
	const handleAvatarPress = () => Say.ok('Openn switch gym modal!');

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
