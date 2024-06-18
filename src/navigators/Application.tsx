import {
	Auth,
	BillingAgreementScreen,
	Calendar,
	ComposeScreen,
	ContactsScreen,
	ConversationScreen,
	Dashboard,
	EULAScreen,
	Example,
	GymWaiverScreen,
	Inbox,
	Landing,
	Login,
	PDFViewerScreen,
	ResetPassword,
	Session,
	Shop,
	Startup,
	WebView,
} from '@/screens';
import { useTheme } from '@/theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import {
	CardStyleInterpolators,
	StackNavigationOptions,
	createStackNavigator,
} from '@react-navigation/stack';

import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

import { SwitchGym, SwitchUser, WODAddAttendance } from '@/modals';

import CalendarHeaderLeftComponent from '@/screens/Calendar/components/CalendarHeaderLeftComponent';
import CalendarHeaderRightComponent from '@/screens/Calendar/components/CalendarHeaderRightComponent';
import ShopHeaderRightComponent from '@/screens/Shop/components/ShopHeaderRightComponent';

import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import type {
	ApplicationStackParamList,
	ComposeStackParamsList,
	InboxParamList,
	MainTabParamList,
} from '@/types/navigation';
import { Constant } from '@/utils';
import useStore from '@/zustand/Store';
import MenuStackNavigator from './MenuStack';
import { navigationRef } from './NavigationRef';
import HeaderCloseButton from './components/HeaderCloseButton';

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
	InboxStack: 'chat',
	Shop: 'cart',
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
	const { shopUrl, activeMonth } = useStore(state => ({
		shopUrl: state.shopUrl,
		activeMonth: state.activeMonth,
	}));

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
				headerTitleStyle: layout.fontMontserratRegular,
			})}
		>
			<Tab.Screen
				name="Dashboard"
				component={Dashboard}
				options={{ headerShown: false }}
			/>
			<Tab.Screen
				name="Calendar"
				component={Calendar}
				options={{
					headerLeft: CalendarHeaderLeftComponent,
					headerRight: CalendarHeaderRightComponent,
					title: activeMonth ?? 'Calendar',
				}}
			/>
			<Tab.Screen
				name="InboxStack"
				component={InboxStackNavigator}
				options={{ headerShown: false }}
			/>
			<Tab.Screen
				name="Shop"
				component={Shop}
				options={{
					tabBarButton: !shopUrl ? () => null : undefined,
					headerRight: ShopHeaderRightComponent,
					title: 'Gym Shop',
				}}
			/>
			<Tab.Screen
				name="MenuTab"
				component={MenuStackNavigator}
				options={{ headerShown: false }}
			/>
		</Tab.Navigator>
	);
};

const InboxStack = createStackNavigator<InboxParamList>();
const InboxStackNavigator = () => {
	const { colors } = useTheme();
	return (
		<InboxStack.Navigator initialRouteName="Inbox">
			<InboxStack.Group
				screenOptions={{
					headerStyle: { backgroundColor: config.colors.brand },
					headerTitleAlign: 'center',
					cardStyleInterpolator:
						CardStyleInterpolators.forHorizontalIOS,
					headerTintColor: 'white',
					headerBackTitleVisible: false,
				}}
			>
				<InboxStack.Screen name="Inbox" component={Inbox} />
				<InboxStack.Screen
					name="Conversation"
					component={ConversationScreen}
				/>
			</InboxStack.Group>
			<InboxStack.Group
				screenOptions={{
					headerTintColor: colors.darkgray,
					headerRight: HeaderCloseButton,
					headerLeft: () => null,
					presentation: 'modal',
					headerShown: true,

					...(Constant.IS_ANDROID
						? {
								cardStyleInterpolator:
									CardStyleInterpolators.forModalPresentationIOS,
						  }
						: {}),
				}}
			>
				<InboxStack.Screen
					name="ComposeStack"
					component={ComposeStackNavigator}
					options={{ headerShown: false }}
				/>
			</InboxStack.Group>
		</InboxStack.Navigator>
	);
};

const ComposeStack = createStackNavigator<ComposeStackParamsList>();
const ComposeStackNavigator = () => {
	const { colors } = useTheme();
	return (
		<ComposeStack.Navigator
			initialRouteName="Contacts"
			screenOptions={{
				headerTintColor: colors.darkgray,
				cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
				headerMode: 'float',
				headerShadowVisible: false,
				headerLeft: () => null,
				headerTitleStyle: layout.fontMontserratRegular,
			}}
		>
			<ComposeStack.Screen
				name="Compose"
				component={ComposeScreen}
				options={{ title: 'Compose Message' }}
			/>
			<ComposeStack.Screen name="Contacts" component={ContactsScreen} />
		</ComposeStack.Navigator>
	);
};

const Stack = createStackNavigator<ApplicationStackParamList>();
const ApplicationNavigator = () => {
	const { variant, navigationTheme, colors } = useTheme();

	const CommonHeaderOptions: StackNavigationOptions = {
		headerShown: true,
		cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
	};

	return (
		<NavigationContainer
			linking={linking}
			ref={navigationRef}
			theme={navigationTheme}
		>
			<Stack.Navigator key={variant} initialRouteName="Startup">
				<Stack.Group
					screenOptions={{
						headerShown: false, // hide header by default but when screen needs it, it will be shown with corresponding options below
						headerTintColor: 'white',
						headerTitleAlign: 'center',
						headerStyle: { backgroundColor: config.colors.brand },
						headerTitleStyle: layout.fontMontserratRegular,
						cardStyleInterpolator:
							CardStyleInterpolators.forScaleFromCenterAndroid,
					}}
				>
					<Stack.Screen name="Startup" component={Startup} />
					<Stack.Screen name="Auth" component={Auth} />
					<Stack.Screen name="Landing" component={Landing} />
					<Stack.Screen name="Example" component={Example} />
					<Stack.Screen
						name="Login"
						component={Login}
						options={{
							...CommonHeaderOptions,
							headerBackTitleVisible: false,
						}}
					/>
					<Stack.Screen
						name="ResetPassword"
						component={ResetPassword}
						options={{
							title: 'Forgot Password',
							...CommonHeaderOptions,
							headerBackTitleVisible: false,
						}}
					/>
					<Stack.Screen name="Main" component={MainTabNavigator} />
					<Stack.Screen
						name="Session"
						component={Session}
						options={({ route }) => ({
							title: route.params.title,
							...CommonHeaderOptions,
						})}
					/>
					<Stack.Screen
						name="Eula"
						component={EULAScreen}
						options={{
							title: 'End User License Agreement',
							...CommonHeaderOptions,
						}}
					/>
					<Stack.Screen
						name="BillingAgreement"
						component={BillingAgreementScreen}
						options={{
							title: 'Billing Agreement',
							...CommonHeaderOptions,
						}}
					/>
					<Stack.Screen
						name="GymWaiver"
						component={GymWaiverScreen}
						options={{
							title: 'Gym Waiver',
							...CommonHeaderOptions,
						}}
					/>
					<Stack.Screen
						name="PDFViewer"
						component={PDFViewerScreen}
						options={{
							...CommonHeaderOptions,
							headerBackTitleVisible: false,
						}}
					/>
				</Stack.Group>

				<Stack.Group
					screenOptions={{
						headerTintColor: colors.darkgray,
						headerRight: HeaderCloseButton,
						headerLeft: () => null,
						presentation: 'modal',
						headerShown: true,

						...(Constant.IS_ANDROID
							? {
									cardStyleInterpolator:
										CardStyleInterpolators.forModalPresentationIOS,
							  }
							: {}),
					}}
				>
					<Stack.Screen
						name="SwitchGym"
						component={SwitchGym}
						options={{ title: 'Switch Gym' }}
					/>
					<Stack.Screen
						name="SwitchUser"
						component={SwitchUser}
						options={{ title: 'Switch User' }}
					/>
					<Stack.Screen
						name="AddAttendance"
						component={WODAddAttendance}
						options={{ title: 'Add Attendance' }}
					/>
				</Stack.Group>

				<Stack.Screen
					name="Webview"
					component={WebView}
					options={({ route }) => ({
						title: route.params.title,
						headerTintColor: colors.darkgray,
						presentation: 'modal',
						headerRight: HeaderCloseButton,
						headerLeft: () => null,
					})}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
};

export default ApplicationNavigator;
