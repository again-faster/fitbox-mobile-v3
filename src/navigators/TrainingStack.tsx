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
import TrainingDay, {
	trainingDayTitle,
} from '@/screens/Training/Day/TrainingDay';
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
import ShareWorkoutComposer from '@/screens/Training/Sharing/ShareWorkoutComposer';
import TrainingProfile from '@/screens/Training/Profile/TrainingProfile';
import Benchmarks from '@/screens/Training/Benchmarks/Benchmarks';
import Progress from '@/screens/Training/Progress/Progress';
import Wearables from '@/screens/Training/Wearables/Wearables';
import WeeklyRecap from '@/screens/Training/Recap/WeeklyRecap';
import TrainingMore from '@/screens/Training/More/TrainingMore';
import BookingsHub from '@/screens/Training/Bookings/BookingsHub';
import { MemberFeatureGate } from '@/screens/Training/components/MemberFeatureGate';
import { useCustomWorkouts } from '@/screens/Training/hooks/useCustomWorkouts';
import { useWorkoutResultCleanupQueue } from '@/screens/Training/hooks/useWorkoutResultCleanupQueue';

const Stack = createStackNavigator<TrainingStackParamList>();

const TrainingStackNavigator = () => {
	const { colors } = useTheme();
	const { data: hasCustomWorkouts } = useCustomWorkouts();
	useWorkoutResultCleanupQueue();

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
				name="TrainingDay"
				component={TrainingDay}
				options={({ route }) => ({
					title: trainingDayTitle(route.params.date),
				})}
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
				options={({ route }) => ({
					title: route.params.workoutName,
					headerBackTitle: 'Exit',
				})}
			>
				{props => (
					<MemberFeatureGate feature="results">
						<RunWorkout {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingBenchmarks"
				options={{ title: 'Benchmarks' }}
			>
				{props => (
					<MemberFeatureGate feature="benchmarks">
						<Benchmarks {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingWorkoutComplete"
				options={{ headerShown: false, gestureEnabled: false }}
			>
				{props => (
					<MemberFeatureGate feature="results">
						<WorkoutComplete {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingResults"
				options={{ title: 'My Results' }}
			>
				{() => (
					<MemberFeatureGate feature="results">
						<Results />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingResultDetail"
				options={{ title: 'Workout result' }}
			>
				{props => (
					<MemberFeatureGate feature="results">
						<ResultDetail {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingShareWorkout"
				options={{ title: 'Share workout' }}
			>
				{props => (
					<MemberFeatureGate feature="results">
						<ShareWorkoutComposer {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingGymFeed"
				options={{ title: 'Gym Feed' }}
			>
				{() => (
					<MemberFeatureGate feature="feed">
						<GymFeed />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingWellness"
				component={Wellness}
				options={{ title: 'Wellness' }}
			/>
			<Stack.Screen
				name="TrainingMaxes"
				options={{ title: 'My Maxes' }}
			>
				{() => (
					<MemberFeatureGate feature="my_maxes">
						<Maxes />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingPRs"
				options={{ title: 'Personal Records' }}
			>
				{() => (
					<MemberFeatureGate feature="prs">
						<PRs />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingCoachNotes"
				options={{ title: 'Coach Notes' }}
			>
				{() => (
					<MemberFeatureGate feature="coach_notes">
						<CoachNotes />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
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
				options={{ title: 'Weekly Recap' }}
			>
				{props => (
					<MemberFeatureGate feature="digest">
						<WeeklyRecap {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
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
				options={{ title: 'Training Profile' }}
			>
				{props => (
					<MemberFeatureGate feature="training_profile">
						<TrainingProfile {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingAppleHealth"
				options={{ headerShown: false }}
			>
				{props => (
					<MemberFeatureGate feature="wearables">
						<AppleHealthScreen {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingWearables"
				options={{ headerShown: false }}
			>
				{props => (
					<MemberFeatureGate feature="wearables">
						<Wearables {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingBuildList"
				options={{ headerShown: false }}
			>
				{() => (
					<MemberFeatureGate
						feature="custom_workouts"
						allow={hasCustomWorkouts}
					>
						<BuildList />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingBuildEditor"
				options={{ headerShown: false }}
			>
				{props => (
					<MemberFeatureGate
						feature="custom_workouts"
						allow={hasCustomWorkouts}
					>
						<WorkoutEditor {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingBuildSchedule"
				options={{ headerShown: false }}
			>
				{props => (
					<MemberFeatureGate
						feature="custom_workouts"
						allow={hasCustomWorkouts}
					>
						<BuildSchedule {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingCustomWorkoutsUpsell"
				component={CustomWorkoutsUpsell}
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="TrainingInjuryList"
				options={{ headerShown: false }}
			>
				{props => (
					<MemberFeatureGate feature="pain_reports">
						<InjuryList {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingInjuryLog"
				options={{ headerShown: false }}
			>
				{props => (
					<MemberFeatureGate feature="pain_reports">
						<InjuryLog {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
			<Stack.Screen
				name="TrainingInjuryDailyUpdate"
				options={{ headerShown: false }}
			>
				{props => (
					<MemberFeatureGate feature="pain_reports">
						<InjuryDailyUpdate {...props} />
					</MemberFeatureGate>
				)}
			</Stack.Screen>
		</Stack.Navigator>
	);
};

export default TrainingStackNavigator;
