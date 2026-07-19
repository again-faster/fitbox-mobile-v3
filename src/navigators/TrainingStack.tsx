import { useTheme } from '@/theme';
import type { TrainingStackParamList } from '@/types/navigation';
import { createStackNavigator } from '@react-navigation/stack';
import layout from '@/theme/layout';
import Activate from '@/screens/Training/Activate';
import BuildList from '@/screens/Training/Build/BuildList';
import BuildSchedule from '@/screens/Training/Build/BuildSchedule';
import CustomWorkoutsUpsell from '@/screens/Training/Build/CustomWorkoutsUpsell';
import WorkoutEditor from '@/screens/Training/Build/WorkoutEditor';
import CoachNotes from '@/screens/Training/CoachNotes/CoachNotes';
import GymFeed from '@/screens/Training/GymFeed/GymFeed';
import Maxes from '@/screens/Training/Maxes/Maxes';
import NotificationsInbox from '@/screens/Training/Notifications/NotificationsInbox';
import PRs from '@/screens/Training/PRs/PRs';
import Results from '@/screens/Training/Results/Results';
import TrainingSettings from '@/screens/Training/Settings/TrainingSettings';
import Today from '@/screens/Training/Today/Today';
import TrainingRoot from '@/screens/Training/TrainingRoot';
import Wellness from '@/screens/Training/Wellness/Wellness';
import WorkoutDetail from '@/screens/Training/Workouts/WorkoutDetail';
import WorkoutList from '@/screens/Training/Workouts/WorkoutList';
import AppleHealthScreen from '@/screens/Training/AppleHealth/AppleHealthScreen';
import RunWorkout from '@/screens/Training/Workouts/RunWorkout';
import InjuryList from '@/screens/Training/Injuries/InjuryList';
import InjuryLog from '@/screens/Training/Injuries/InjuryLog';
import InjuryDailyUpdate from '@/screens/Training/Injuries/InjuryDailyUpdate';
import WorkoutComplete from '@/screens/Training/Workouts/WorkoutComplete';
import ResultDetail from '@/screens/Training/Results/ResultDetail';
import TrainingProfile from '@/screens/Training/Profile/TrainingProfile';
import Benchmarks from '@/screens/Training/Benchmarks/Benchmarks';
import Progress from '@/screens/Training/Progress/Progress';
import Wearables from '@/screens/Training/Wearables/Wearables';
import WeeklyRecap from '@/screens/Training/Recap/WeeklyRecap';
import TrainingMore from '@/screens/Training/More/TrainingMore';
import BookingsHub from '@/screens/Training/Bookings/BookingsHub';

const Stack = createStackNavigator<TrainingStackParamList>();

const TrainingStackNavigator = () => {
	const { colors } = useTheme();

	const headerStyle = {
		backgroundColor: colors.brand,
	};

	return (
		<Stack.Navigator
			initialRouteName="TrainingRoot"
			screenOptions={{
				headerStyle,
				headerTintColor: '#fff',
				headerTitleAlign: 'center',
				headerTitleStyle: layout.fontMontserratRegular,
			}}
		>
			<Stack.Screen
				name="TrainingRoot"
				component={TrainingRoot}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingActivate"
				component={Activate}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingToday"
				component={Today}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingWorkouts"
				component={WorkoutList}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingWorkoutDetail"
				component={WorkoutDetail}
				options={{ title: 'Workout' }}
			/>
			<Stack.Screen
				name="TrainingRunWorkout"
				component={RunWorkout}
				options={({ route }) => ({
					title: route.params.workoutName,
					headerBackTitle: 'Exit',
				})}
			/>
			<Stack.Screen
				name="TrainingBenchmarks"
				component={Benchmarks}
				options={{ title: 'Benchmarks' }}
			/>
			<Stack.Screen
				name="TrainingWorkoutComplete"
				component={WorkoutComplete}
				options={{ headerShown: false, gestureEnabled: false }}
			/>
			<Stack.Screen
				name="TrainingResults"
				component={Results}
				options={{ title: 'My Results' }}
			/>
			<Stack.Screen
				name="TrainingResultDetail"
				component={ResultDetail}
				options={{ title: 'Workout result' }}
			/>
			<Stack.Screen
				name="TrainingGymFeed"
				component={GymFeed}
				options={{ title: 'Gym Feed' }}
			/>
			<Stack.Screen
				name="TrainingWellness"
				component={Wellness}
				options={{ title: 'Wellness' }}
			/>
			<Stack.Screen
				name="TrainingMaxes"
				component={Maxes}
				options={{ title: 'My Maxes' }}
			/>
			<Stack.Screen
				name="TrainingPRs"
				component={PRs}
				options={{ title: 'Personal Records' }}
			/>
			<Stack.Screen
				name="TrainingCoachNotes"
				component={CoachNotes}
				options={{ title: 'Coach Notes' }}
			/>
			<Stack.Screen
				name="TrainingNotifications"
				component={NotificationsInbox}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingSettings"
				component={TrainingSettings}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingProgress"
				component={Progress}
				options={{ title: 'My Progress' }}
			/>
			<Stack.Screen
				name="TrainingWeeklyRecap"
				component={WeeklyRecap}
				options={{ title: 'Weekly Recap' }}
			/>
			<Stack.Screen
				name="TrainingMore"
				component={TrainingMore}
				options={{ title: 'More' }}
			/>
			<Stack.Screen
				name="TrainingPT"
				component={BookingsHub}
				options={{ title: 'Bookings' }}
			/>
			<Stack.Screen
				name="TrainingProfile"
				component={TrainingProfile}
				options={{ title: 'Training Profile' }}
			/>
			<Stack.Screen
				name="TrainingAppleHealth"
				component={AppleHealthScreen}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingWearables"
				component={Wearables}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingBuildList"
				component={BuildList}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingBuildEditor"
				component={WorkoutEditor}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingBuildSchedule"
				component={BuildSchedule}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingCustomWorkoutsUpsell"
				component={CustomWorkoutsUpsell}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingInjuryList"
				component={InjuryList}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingInjuryLog"
				component={InjuryLog}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingInjuryDailyUpdate"
				component={InjuryDailyUpdate}
				options={{ headerShown: false }}
			/>
		</Stack.Navigator>
	);
};

export default TrainingStackNavigator;
