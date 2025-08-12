import {
	AboutUs,
	AcceptedWaiversScreen,
	HealthCaptureScreen,
	HelpScreen,
	Menu,
	MyDetails,
	NotificationScreen,
	PDFViewerScreen,
	PaymentInformation,
	PaymentUpdate,
	StripeSuccess,
	Subscription,
	SubscriptionDetails,
	SubscriptionSetup,
} from '@/screens';
import { useTheme } from '@/theme';
import { MenuStackParamList } from '@/types/navigation';
import { createStackNavigator } from '@react-navigation/stack';
import PerformanceSummaryStack from './PerformanceSummaryStack';
import { CommonHeaderOptions } from './utils/options';

const Stack = createStackNavigator<MenuStackParamList>();
const MenuStackNavigator = () => {
	const { variant } = useTheme();

	return (
		<Stack.Navigator
			key={variant}
			screenOptions={CommonHeaderOptions}
			initialRouteName="Menu"
		>
			<Stack.Screen name="Menu" component={Menu} />
			<Stack.Screen name="AboutUs" component={AboutUs} />
			<Stack.Screen name="MyDetails" component={MyDetails} />
			<Stack.Screen
				name="Subscription"
				component={Subscription}
				options={{
					title: 'Memberships',
				}}
			/>
			<Stack.Screen
				name="SubscriptionDetails"
				component={SubscriptionDetails}
				options={{
					title: 'Memberships',
				}}
			/>
			<Stack.Screen
				name="SubscriptionSetup"
				component={SubscriptionSetup}
			/>
			<Stack.Screen
				name="PaymentInformation"
				component={PaymentInformation}
				options={{
					title: 'Payment Details',
				}}
			/>
			<Stack.Screen
				name="PaymentUpdate"
				component={PaymentUpdate}
				options={{
					title: 'Add/Update Payment Details',
				}}
			/>
			<Stack.Screen
				name="PerformanceSummary"
				component={PerformanceSummaryStack}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="StripeSuccess"
				component={StripeSuccess}
				options={{
					title: 'Select User',
				}}
			/>
			<Stack.Screen
				name="AcceptedWaivers"
				component={AcceptedWaiversScreen}
				options={{ title: 'Accepted Waivers' }}
			/>
			<Stack.Screen name="PDFViewerScreen" component={PDFViewerScreen} />
			<Stack.Screen
				name="HelpScreen"
				component={HelpScreen}
				options={{ title: 'Help' }}
			/>
			<Stack.Screen
				name="HealthCapture"
				component={HealthCaptureScreen}
				options={{ title: 'Health Capture', headerLeft: () => null }}
			/>
			<Stack.Screen
				name="Notifications"
				component={NotificationScreen}
				options={{
					title: 'Notification Setting',
				}}
			/>
		</Stack.Navigator>
	);
};

export default MenuStackNavigator;
