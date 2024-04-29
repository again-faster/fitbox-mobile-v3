import {
	AboutUs,
	Menu,
	ProfileMenu,
	Subscription,
	SubscriptionDetails,
} from '@/screens';
import MyDetails from '@/screens/MyDetails/MyDetails';
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
					title: 'Subscription Information',
				}}
			/>
			<Stack.Screen
				name="SubscriptionDetails"
				component={SubscriptionDetails}
			/>
		</Stack.Navigator>
	);
};

export default MenuStackNavigator;
