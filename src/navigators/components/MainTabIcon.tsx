import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

export type MainTabIconProps = {
	name: string;
	size: number;
	color: string;
};

const MainTabIcon = ({ name, size, color }: MainTabIconProps) => (
	<Ionicons name={name} size={size} color={color} />
);

export default MainTabIcon;
