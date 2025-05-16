import { navigate } from '@/navigators/NavigationRef';
import {
	AttendanceScreen,
	BookingScreen,
	ClassResultsScreen,
	Dashboard,
	ScoreCommentsScreen,
} from '@/screens';
import FailedInvoicesDetailsScreen from '@/screens/FailedInvoicesDetailsScreen/FailedInvoicesDetailsScreen';
import FailedInvoicesScreen from '@/screens/FailedInvoicesScreen/FailedInvoicesScreen';
import { DashboardParamList } from '@/types/navigation';
import { createStackNavigator } from '@react-navigation/stack';
import { CommonHeaderOptions } from './utils/options';

const Stack = createStackNavigator<DashboardParamList>();
const NavigateToDashboard = () => {
	navigate('Dashboard');
};

const DashboardStackNavigator = () => {
	return (
		<Stack.Navigator
			screenOptions={CommonHeaderOptions}
			initialRouteName="Dashboard"
		>
			<Stack.Screen
				name="Dashboard"
				component={Dashboard}
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="ClassResults"
				component={ClassResultsScreen}
				options={{
					title: 'Class Results',
				}}
			/>
			<Stack.Screen
				name="ScoreComments"
				component={ScoreCommentsScreen}
				options={{
					title: 'Class Results',
				}}
			/>
			<Stack.Screen
				name="Bookings"
				component={BookingScreen}
				options={{
					title: 'My Bookings',
				}}
			/>
			<Stack.Screen
				name="FailedInvoices"
				component={FailedInvoicesScreen}
				options={{
					title: 'Overdue Invoices',
				}}
			/>
			<Stack.Screen
				name="FailedInvoicesDetails"
				component={FailedInvoicesDetailsScreen}
				options={{
					title: 'Overdue Invoices',
				}}
			/>
			<Stack.Screen
				name="Attendance"
				component={AttendanceScreen}
				options={{
					title: 'Attendance',
				}}
			/>
		</Stack.Navigator>
	);
};

export default DashboardStackNavigator;
export { NavigateToDashboard as ResetToDashboard };
