import {
	AboutUs,
	Menu,
	PaymentInformation,
	ProfileMenu,
	Subscription,
	SubscriptionDetails,
	SubscriptionSetup,
} from '@/screens';
import AcceptedWaiversScreen from '@/screens/AcceptedWaiversScreen/AcceptedWaiversScreen';
import MyDetails from '@/screens/MyDetails/MyDetails';
import PDFViewerScreen from '@/screens/PDFViewerScreen/PDFViewerScreen';
import PaymentUpdate from '@/screens/PaymentUpdate/PaymentUpdate';
import StripeSuccess from '@/screens/StripeSuccess/StripeSuccess';
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
		</Stack.Navigator>
	);
};

export default MenuStackNavigator;
