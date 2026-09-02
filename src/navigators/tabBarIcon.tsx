import Loader from '@/components/molecules/Loader/Loader';
import { config } from '@/theme/_config';
import type { MainTabParamList } from '@/types/navigation';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Badge } from 'react-native-paper';
import { Platform, StyleSheet } from 'react-native';

const icons: Record<keyof MainTabParamList, string> = {
	DashboardStack: 'home',
	Calendar: 'calendar-month-outline',
	InboxStack: 'chat',
	Shop: 'cart',
	MenuTab: 'menu',
	TrainingStack: 'dumbbell',
};

export const tabBarIconRender = ({
	route,
	color,
	size,
	loading,
	unreadMessages,
}: {
	route: keyof MainTabParamList;
	color: string;
	size: number;
	loading: boolean;
	unreadMessages?: number;
}) => {
	if (loading) return <Loader size="xl" />;

	if (route === 'InboxStack') {
		return (
			<>
				<Ionicons name={icons[route]} size={size} color={color} />
				<Badge
					visible={Number(unreadMessages) > 0}
					size={14}
					style={styles.badgeStyle}
					allowFontScaling={false}
				>
					{unreadMessages}
				</Badge>
			</>
		);
	}

	return <Ionicons name={icons[route]} size={size} color={color} />;
};

const styles = StyleSheet.create({
	badgeStyle: {
		position: 'absolute',
		top: 10,
		right: Platform.OS === 'ios' && Platform.isPad ? -5 : 23,
		backgroundColor: config.colors.brand,
	},
});
