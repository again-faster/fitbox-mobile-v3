import {
	Auth,
	Calendar,
	Dashboard,
	Example,
	Inbox,
	Landing,
	Login,
	ResetPassword,
	Startup,
} from '@/screens';
import { useTheme } from '@/theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import {
	CardStyleInterpolators,
	createStackNavigator,
} from '@react-navigation/stack';

import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

import type {
	ApplicationStackParamList,
	MainTabParamList,
} from '@/types/navigation';
import MenuStackNavigator from './MenuStack';

const linking: LinkingOptions<ApplicationStackParamList> = {
	prefixes: ['com.fitbox://', 'https://fitbox.iq', 'http://fitbox.iq'],
	config: {
		initialRouteName: 'Main',
		screens: {
			Startup: {
				path: 'home',
			},
			Main: {
				path: 'main/:personId',
			},
			Auth: {
				path: 'auth',
			},
		},
	},
};

const icons: Record<keyof MainTabParamList, string> = {
	Dashboard: 'home',
	Calendar: 'calendar-month-outline',
	Inbox: 'chat',
	MenuTab: 'menu',
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
			detachInactiveScreens={false}
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
			<Tab.Screen
				name="MenuTab"
				component={MenuStackNavigator}
				options={{ headerShown: false }}
			/>
		</Tab.Navigator>
	);
};

const Stack = createStackNavigator<ApplicationStackParamList>();
const ApplicationNavigator = () => {
	const { variant, navigationTheme } = useTheme();

	return (
		<NavigationContainer theme={navigationTheme} linking={linking}>
			<Stack.Navigator
				key={variant}
				screenOptions={{
					headerShown: false,
					cardStyleInterpolator:
						CardStyleInterpolators.forScaleFromCenterAndroid,
				}}
				initialRouteName="Startup"
			>
				<Stack.Screen name="Startup" component={Startup} />
				<Stack.Screen name="Auth" component={Auth} />
				<Stack.Screen name="Landing" component={Landing} />
				<Stack.Screen name="Example" component={Example} />
				<Stack.Screen name="Login" component={Login} />
				<Stack.Screen name="ResetPassword" component={ResetPassword} />
				<Stack.Screen name="Main" component={MainTabNavigator} />
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default ApplicationNavigator;
