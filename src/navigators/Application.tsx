import {
	Calendar,
	Dashboard,
	Example,
	Inbox,
	Landing,
	Menu,
	Startup,
} from '@/screens';
import { useTheme } from '@/theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import {
	CardStyleInterpolators,
	createStackNavigator,
} from '@react-navigation/stack';

import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

import { config } from '@/theme/_config';
import type {
	ApplicationStackParamList,
	MainTabParamList,
} from '@/types/navigation';

const icons: Record<keyof MainTabParamList, string> = {
	Dashboard: 'home',
	Calendar: 'calendar-month-outline',
	Inbox: 'chat',
	Menu: 'menu',
};

const tabBarIconRender = ({
	route,
	color,
	size,
}: {
	route: keyof MainTabParamList;
	color: string;
	size: number;
}) => <Ionicons name={icons[route]} size={size} color={color} />;

const Tab = createBottomTabNavigator<MainTabParamList>();
const MainTabNavigator = () => {
	const { variant, colors } = useTheme();

	return (
		<Tab.Navigator
			key={variant}
			screenOptions={({ route }) => ({
				tabBarIcon: options =>
					tabBarIconRender({
						route: route.name,
						...options,
					}),
				tabBarActiveTintColor: colors.brand,
				tabBarInactiveTintColor: colors.gray50,
				tabBarStyle: {
					backgroundColor: colors.gray800,
				},
				tabBarLabel: () => null,
				headerShown: true,
				headerStyle: {
					backgroundColor: colors.brand,
				},
				headerTitleAlign: 'center',
			})}
		>
			<Tab.Screen
				name="Dashboard"
				component={Dashboard}
				options={{ headerShown: false }}
			/>
			<Tab.Screen name="Calendar" component={Calendar} />
			<Tab.Screen name="Inbox" component={Inbox} />
			<Tab.Screen name="Menu" component={Menu} />
		</Tab.Navigator>
	);
};

const Stack = createStackNavigator<ApplicationStackParamList>();
const ApplicationNavigator = () => {
	const { variant, navigationTheme } = useTheme();

	return (
		<NavigationContainer theme={navigationTheme}>
			<Stack.Navigator
				key={variant}
				screenOptions={{
					headerShown: false,
					headerStyle: { backgroundColor: config.colors.brand },
					cardStyleInterpolator:
						CardStyleInterpolators.forScaleFromCenterAndroid,
				}}
			>
				<Stack.Screen name="Startup" component={Startup} />
				<Stack.Screen name="Landing" component={Landing} />
				<Stack.Screen name="Example" component={Example} />
				<Stack.Screen name="Main" component={MainTabNavigator} />
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default ApplicationNavigator;
