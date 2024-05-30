import {
	AboutUs,
	AcceptedWaiversScreen,
	HealthCaptureScreen,
	HelpScreen,
	Menu,
	MyDetails,
	PDFViewerScreen,
	PaymentInformation,
	PaymentUpdate,
	ProfileMenu,
	StripeSuccess,
	Subscription,
	SubscriptionDetails,
	SubscriptionSetup,
} from '@/screens';
import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import { MenuStackParamList } from '@/types/navigation';
import {
	CardStyleInterpolators,
	createStackNavigator,
} from '@react-navigation/stack';

const Stack = createStackNavigator<MenuStackParamList>();
const MenuStackNavigator = () => {
	const { variant } = useTheme();

	return (
		<Stack.Navigator
			key={variant}
			screenOptions={{
				headerStyle: { backgroundColor: config.colors.brand },
				headerTitleAlign: 'center',
				cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
				headerTintColor: 'white',
				headerBackTitleVisible: false,
			}}
			initialRouteName="Menu"
		>
			<Stack.Screen name="Menu" component={Menu} />
			<Stack.Screen name="ProfileMenu" component={ProfileMenu} />
			<Stack.Screen name="AboutUs" component={AboutUs} />
			<Stack.Screen name="MyDetails" component={MyDetails} />
			<Stack.Screen
				name="Subscription"
				component={Subscription}
				options={{
					title: 'Membership Information',
				}}
			/>
			<Stack.Screen
				name="SubscriptionDetails"
				component={SubscriptionDetails}
				options={{
					title: 'Membership Information',
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
					title: 'Payment Information',
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
				options={{ title: 'Heath Capture', headerLeft: () => null }}
			/>
		</Stack.Navigator>
	);
};

export default MenuStackNavigator;
