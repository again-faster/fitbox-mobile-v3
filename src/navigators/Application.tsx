import {
	Auth,
	BillingAgreementScreen,
	BrowseMediaScreen,
	Calendar,
	Camera,
	ComposeScreen,
	ContactsScreen,
	ConversationScreen,
	EULAScreen,
	Example,
	FitboxGalleryScreen,
	GymWaiverScreen,
	HealthCaptureScreen,
	Inbox,
	InviteCodeScreen,
	Landing,
	Login,
	MyDetails,
	PDFViewerScreen,
	PaymentInformation,
	ResetPassword,
	ScoreCommentsScreen,
	Session,
	SessionScoringScreen,
	Shop,
	SignUp,
	Startup,
	Subscription,
	SubscriptionDetails,
	SubscriptionSetup,
	WebView,
} from '@/screens';
import { useTheme } from '@/theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import {
	CardStyleInterpolators,
	createStackNavigator,
} from '@react-navigation/stack';

import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import VersionCheck from 'react-native-version-check';

import { SwitchGym, SwitchUser, WODAddAttendance } from '@/modals';

import CalendarHeaderLeftComponent from '@/screens/Calendar/components/CalendarHeaderLeftComponent';
import CalendarHeaderRightComponent from '@/screens/Calendar/components/CalendarHeaderRightComponent';
import ShopHeaderRightComponent from '@/screens/Shop/components/ShopHeaderRightComponent';

import useAuth from '@/auth/hooks/useAuth';
import {
	Loader,
	NotificationDialog,
	UpdateDialog,
} from '@/components/molecules';
import MovementHistory from '@/screens/PerformanceSummary/MovementHistory';
import WorkoutHistory from '@/screens/PerformanceSummary/WorkoutHistory';
import ResultTypesModal from '@/screens/PerformanceSummary/components/ResultTypesModal';
import { minVersion } from '@/services/auth';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import type {
	ApplicationStackParamList,
	ComposeStackParamsList,
	InboxParamList,
	MainTabParamList,
} from '@/types/navigation';
import { Constant, Func } from '@/utils';
import useStore from '@/zustand/Store';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Badge } from 'react-native-paper';
import DashboardStackNavigator, { ResetToDashboard } from './DashboardStack';
import MenuStackNavigator from './MenuStack';
import { navigationRef } from './NavigationRef';
import HeaderCloseButton from './components/HeaderCloseButton';
import { CommonHeaderOptions, TabHeaderOptions } from './utils/options';

const linking: LinkingOptions<ApplicationStackParamList> = {
	prefixes: ['appfitbox://', 'https://fitbox.iq', 'http://fitbox.iq'],
	config: {
		initialRouteName: 'Landing',
		screens: {
			Login: {
				path: 'auth/login/:emailFromSignin',
			},
			SignUp: {
				path: 'auth/signup/:gymCode',
			},
			Invite: {
				path: 'auth/invite/:inviteCode',
			},
			// TODO: Still need to implement this
			// SignupWithSub: {
			// 	path: 'auth/signup/:gymCode/:subscriptionId',
			// },
		},
	},
};

const icons: Record<keyof MainTabParamList, string> = {
	DashboardStack: 'home',
	Calendar: 'calendar-month-outline',
	InboxStack: 'chat',
	Shop: 'cart',
	MenuTab: 'menu',
};

const tabBarIconRender = ({
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

const Tab = createBottomTabNavigator<MainTabParamList>();
const MainTabNavigator = () => {
	const { variant, colors } = useTheme();
	const { shopUrl, activeMonth, headerTitle, clearClasses, unreadMessages } =
		useStore(state => ({
			shopUrl: state.shopUrl,
			activeMonth: state.activeMonth,
			headerTitle: state.headerTitle,
			clearClasses: state.clearClasses,
			unreadMessages: state.unreadMessages,
		}));
	const [currentTab, setCurrentTab] = useState<string>('DashboardStack');
	const [loadingCalendar, setLoadingCalendar] = useState<boolean>(false);

	const handleRefreshCalendar = () => {
		if (loadingCalendar) return;
		setLoadingCalendar(true);
		clearClasses();
		setTimeout(() => setLoadingCalendar(false), 1500);
	};

	return (
		<Tab.Navigator
			key={variant}
			detachInactiveScreens={false}
			screenOptions={({ route }) => ({
				tabBarIcon: options =>
					tabBarIconRender({
						loading: route.name === 'Calendar' && loadingCalendar,
						route: route.name,
						unreadMessages,
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
			screenListeners={({ route: slRoute }) => ({
				tabPress: () => {
					setCurrentTab(slRoute.name);

					if (
						slRoute.name === 'Calendar' &&
						currentTab === 'Calendar'
					) {
						handleRefreshCalendar();
					}
					// reset dashboard stack if home tab is pressed
					if (slRoute.name === 'DashboardStack') {
						ResetToDashboard();
					}
				},
			})}
		>
			<Tab.Screen
				name="DashboardStack"
				component={DashboardStackNavigator}
				options={{ headerShown: false }}
			/>
			<Tab.Screen
				name="Calendar"
				component={Calendar}
				options={{
					headerLeft: CalendarHeaderLeftComponent,
					headerRight: CalendarHeaderRightComponent,
					title: headerTitle || activeMonth || 'Calendar',
				}}
			/>
			<Tab.Screen
				name="InboxStack"
				component={InboxStackNavigator}
				options={{
					headerShown: false,
				}}
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
			<InboxStack.Group screenOptions={CommonHeaderOptions}>
				<InboxStack.Screen name="Inbox" component={Inbox} />
				<InboxStack.Screen
					name="Conversation"
					component={ConversationScreen}
				/>
				<InboxStack.Screen
					name="BrowseMedia"
					component={BrowseMediaScreen}
				/>
				<InboxStack.Screen
					name="fitboxGallery"
					component={FitboxGalleryScreen}
				/>
				<InboxStack.Screen name="Camera" component={Camera} />
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
				headerTitleStyle: layout.fontMontserratRegular,
			}}
		>
			<ComposeStack.Screen
				name="Compose"
				component={ComposeScreen}
				options={{ title: 'Compose Message', headerLeft: () => null }}
			/>
			<ComposeStack.Screen
				name="Contacts"
				component={ContactsScreen}
				options={{ headerLeft: () => null }}
			/>
			<ComposeStack.Screen
				name="BrowseMedia"
				component={BrowseMediaScreen}
				options={{
					title: 'Browse Media',
					headerLeftLabelVisible: false,
				}}
			/>
			<ComposeStack.Screen
				name="Camera"
				component={Camera}
				options={{ title: 'Camera', headerLeftLabelVisible: false }}
			/>
			<ComposeStack.Screen
				name="fitboxGallery"
				component={FitboxGalleryScreen}
				options={{
					title: 'fitbox Gallery',
					headerLeftLabelVisible: false,
				}}
			/>
		</ComposeStack.Navigator>
	);
};

const Stack = createStackNavigator<ApplicationStackParamList>();
const ApplicationNavigator = () => {
	const { variant, navigationTheme, colors } = useTheme();
	const { getApiUrl } = useAuth();

	const { notifications, showModalNotification } = useStore(state => ({
		notifications: state.notifications,
		showModalNotification: state.showModalNotification,
	}));

	const [showUpdateDialog, setShowUpdateDialog] = useState<boolean>(false);

	const url = getApiUrl();
	const getKeyBasedOnEnv = () => {
		if (url.includes('dev.fitbox.iq')) {
			return Constant.STRIPE_PUBLISHABLE_KEY.TEST;
		}
		if (url.includes('staging.fitbox.iq')) {
			return Constant.STRIPE_PUBLISHABLE_KEY.TEST;
		}
		if (url.includes('fitbox.iq')) {
			return Constant.STRIPE_PUBLISHABLE_KEY.LIVE;
		}
		return '';
	};

	useEffect(() => {
		const checkIfUpdateNeeded = async () => {
			const needUpdateConfig: Record<string, string | number> = {
				depth: 2,
			};

			if (Constant.MIN_VERSION_URL) {
				try {
					const res = await minVersion();
					if (res.minVersion) {
						needUpdateConfig.minVersion = res.minVersion;
					} else if (res.depth) {
						needUpdateConfig.depth = res.depth;
					}
				} catch (error) {
					// eslint-disable-next-line no-console
					console.log('Error fetching minVersion:', error);
					// Handle error if necessary
				}
			}

			if (needUpdateConfig.minVersion) {
				const currentVersion = DeviceInfo.getVersion();
				const useMinVersion = needUpdateConfig.minVersion as string;

				if (Func.isVersionOutdated(currentVersion, useMinVersion)) {
					setShowUpdateDialog(true);
				}
				return;
			}

			const res = await VersionCheck.needUpdate(needUpdateConfig);
			setShowUpdateDialog(res?.isNeeded);
		};

		void checkIfUpdateNeeded();
	}, []);

	return (
		<StripeProvider
			publishableKey={getKeyBasedOnEnv()}
			merchantIdentifier="merchant.com.af.fitbox"
		>
			<>
				<NavigationContainer
					linking={linking}
					ref={navigationRef}
					theme={navigationTheme}
					fallback={<Loader cover />}
				>
					<Stack.Navigator key={variant} initialRouteName="Startup">
						<Stack.Group
							screenOptions={{
								headerShown: false, // hide header by default but when screen needs it, it will be shown with corresponding options below
								headerTintColor: 'white',
								headerTitleAlign: 'center',
								headerStyle: {
									backgroundColor: config.colors.brand,
								},
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
									...TabHeaderOptions,
									headerBackTitleVisible: false,
								}}
							/>
							<Stack.Screen
								name="ResetPassword"
								component={ResetPassword}
								options={{
									title: 'Forgot Password',
									...TabHeaderOptions,
									headerBackTitleVisible: false,
								}}
							/>
							<Stack.Screen
								name="Main"
								component={MainTabNavigator}
							/>
							<Stack.Screen
								name="Session"
								component={Session}
								options={({ route }) => ({
									title: route.params.title,
									...TabHeaderOptions,
								})}
							/>
							<Stack.Screen
								name="ScoreComments"
								component={ScoreCommentsScreen}
								options={{
									title: 'Class Results',
									...TabHeaderOptions,
								}}
							/>
							<Stack.Screen
								name="Eula"
								component={EULAScreen}
								options={{
									title: 'End User License Agreement',
									...TabHeaderOptions,
								}}
							/>
							<Stack.Screen
								name="BillingAgreement"
								component={BillingAgreementScreen}
								options={{
									title: 'Billing Agreement',
									...TabHeaderOptions,
								}}
							/>
							<Stack.Screen
								name="GymWaiver"
								component={GymWaiverScreen}
								options={{
									title: 'Gym Waiver',
									...TabHeaderOptions,
								}}
							/>
							<Stack.Screen
								name="PDFViewer"
								component={PDFViewerScreen}
								options={{
									...TabHeaderOptions,
									headerBackTitleVisible: false,
								}}
							/>
							<Stack.Screen
								name="HealthCapture"
								component={HealthCaptureScreen}
								options={{
									...TabHeaderOptions,
									headerBackTitleVisible: false,
								}}
							/>
							<Stack.Screen
								name="SignUp"
								component={SignUp}
								options={{
									...TabHeaderOptions,
									headerBackTitleVisible: false,
									title: 'Sign Up',
								}}
							/>
							<Stack.Screen
								name="Scoring"
								component={SessionScoringScreen}
								options={() => ({
									...TabHeaderOptions,
									title: 'Add Result',
								})}
							/>
							<Stack.Screen
								name="Invite"
								component={InviteCodeScreen}
								options={() => ({
									...TabHeaderOptions,
									title: 'Invite Code',
								})}
							/>
							<Stack.Screen
								name="SubscriptionSetup"
								component={SubscriptionSetup}
								options={{
									...TabHeaderOptions,
									headerBackTitleVisible: false,
									title: 'Setup Subscription',
								}}
								initialParams={{ setupSubscription: true }}
							/>
							<Stack.Screen
								name="PaymentSetup"
								component={PaymentInformation}
								options={{
									...TabHeaderOptions,
									headerBackTitleVisible: false,
									title: 'Payment Setup',
								}}
							/>
							<Stack.Screen
								name="MyDetails"
								component={MyDetails}
								options={{
									...TabHeaderOptions,
									headerBackTitleVisible: false,
								}}
							/>
							<Stack.Screen
								name="Subscription"
								component={Subscription}
								options={{
									title: 'Memberships',
									...TabHeaderOptions,
									headerBackTitleVisible: false,
								}}
							/>
							<Stack.Screen
								name="SubscriptionDetails"
								component={SubscriptionDetails}
								options={{
									title: 'Memberships',
									...TabHeaderOptions,
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
							<Stack.Screen
								name="PaymentInformationModal"
								component={PaymentInformation}
								options={{
									title: 'Payment Details',
									headerRight: HeaderCloseButton,
									headerLeft: () => null,
								}}
							/>
							<Stack.Screen
								name="BuyNow"
								component={SubscriptionSetup}
								options={{ title: 'Buy Subscription' }}
							/>
							<Stack.Screen
								name="ResultTypesModal"
								component={ResultTypesModal}
								options={{
									title: 'Add new result',
								}}
							/>
							<Stack.Screen
								name="MovementHistory"
								component={MovementHistory}
								options={{ title: 'Past Performance' }}
							/>
							<Stack.Screen
								name="WorkoutHistory"
								component={WorkoutHistory}
								options={{ title: 'Past Performance' }}
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

				{showModalNotification && (
					<NotificationDialog notification={notifications} />
				)}

				{showUpdateDialog && <UpdateDialog />}
			</>
		</StripeProvider>
	);
};

const styles = StyleSheet.create({
	badgeStyle: {
		position: 'absolute',
		top: 10,
		right: Platform.OS === 'ios' && Platform.isPad ? -5 : 23,
		backgroundColor: config.colors.brand,
	},
});

export default ApplicationNavigator;
