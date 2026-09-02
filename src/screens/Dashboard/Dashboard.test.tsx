import { fireEvent, render } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import useAuth from '@/auth/hooks/useAuth';
import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';
import useSwitchableUsers from '@/hooks/useSwitchableUsers';
import { navigate } from '@/navigators/NavigationRef';
import { useTheme } from '@/theme';
import type { ClassFiltersDataType } from '@/types/schemas/session';
import useStore from '@/zustand/Store';
import {
	useFocusEffect,
	useIsFocused,
	useNavigation,
} from '@react-navigation/native';

import Dashboard from './Dashboard';

jest.mock('@/auth/hooks/useAuth', () => ({
	__esModule: true,
	default: jest.fn(),
}));

jest.mock('@/context/WorkoutStudioProvider', () => ({
	useWorkoutStudio: jest.fn(),
}));

jest.mock('@/hooks/useSwitchableUsers', () => ({
	__esModule: true,
	default: jest.fn(),
}));

jest.mock('@/navigators/NavigationRef', () => ({
	navigate: jest.fn(),
}));

jest.mock('@/theme', () => ({
	useTheme: jest.fn(),
}));

jest.mock('@/zustand/Store', () => ({
	__esModule: true,
	default: jest.fn(),
}));

jest.mock('@/components/atoms', () => {
	const {
		ScrollView: NativeScrollView,
		Text: NativeText,
		View: NativeView,
	} = jest.requireActual<typeof import('react-native')>('react-native');

	const MockText = ({ children }: { children?: ReactNode }) => (
		<NativeText>{children}</NativeText>
	);
	const MockView = ({ children }: { children?: ReactNode }) => (
		<NativeView>{children}</NativeView>
	);
	const MockScrollView = ({ children }: { children?: ReactNode }) => (
		<NativeScrollView>{children}</NativeScrollView>
	);

	return {
		Avatar: MockView,
		Row: MockView,
		ScrollView: MockScrollView,
		SkeletonView: () => null,
		Spacer: () => null,
		Text: MockText,
	};
});

jest.mock('@/components/member', () => ({
	MemberProgressRing: () => null,
}));

jest.mock('@/storage', () => ({
	mmkvStorage: {
		getNumber: jest.fn(),
		set: jest.fn(),
	},
}));

jest.mock('@/utils/NotificationService', () => ({
	__esModule: true,
	default: {
		setGymFetcher: jest.fn(),
	},
}));

jest.mock('@/services/auth', () => ({
	__esModule: true,
	betaActive: jest.fn(),
	savePushToken: jest.fn(),
}));

jest.mock('@/services/gym', () => {
	const pending = () => new Promise<never>(() => undefined);

	return {
		getGymClasses: jest.fn(pending),
		getGymVenues: jest.fn(pending),
	};
});

jest.mock('@/services/leaderboards', () => ({
	getAttendanceReport: jest.fn(),
}));

jest.mock('@/services/leaderboards/getWorkouts', () => {
	const pending = () => new Promise<never>(() => undefined);

	return {
		__esModule: true,
		default: jest.fn(pending),
	};
});

jest.mock('@/services/message', () => ({
	getAnnouncements: jest.fn(),
	getConversationMessages: jest.fn(),
}));

jest.mock('@/services/session', () => ({
	getClassFilters: jest.fn(),
}));

jest.mock('@/services/users', () => ({
	getBookedSessions: jest.fn(),
	getFailedPayments: jest.fn(),
	getUserGymInfo: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => ({
	__esModule: true,
	default: Object.assign(
		jest.fn(() => ({
			requestPermission: () => new Promise<never>(() => undefined),
		})),
		{
			AuthorizationStatus: {
				AUTHORIZED: 'authorized',
				PROVISIONAL: 'provisional',
			},
		},
	),
	firebase: { app: jest.fn() },
}));

jest.mock('@react-navigation/native', () => {
	const actualNavigation = jest.requireActual<
		typeof import('@react-navigation/native')
	>('@react-navigation/native');

	return {
		...actualNavigation,
		useFocusEffect: jest.fn(),
		useIsFocused: jest.fn(),
		useNavigation: jest.fn(),
	};
});

jest.mock('react-i18next', () => ({
	useTranslation: jest.fn(),
}));

jest.mock('react-native-permissions', () => ({
	RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
	checkNotifications: jest.fn(),
}));

jest.mock('react-native-push-notification', () => ({
	__esModule: true,
	default: {
		cancelAllLocalNotifications: jest.fn(),
		localNotificationSchedule: jest.fn(),
	},
}));

jest.mock('react-native-safe-area-context', () => {
	const { View: NativeView } =
		jest.requireActual<typeof import('react-native')>('react-native');

	return {
		SafeAreaView: ({ children }: { children?: ReactNode }) => (
			<NativeView>{children}</NativeView>
		),
	};
});

jest.mock('react-native-vector-icons/FontAwesome5', () => 'Icon');
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

jest.mock('./components/DashboardHeader', () => () => null);
jest.mock('./components/LoggedInUserInfo', () => () => null);

const mockedUseAuth = useAuth as unknown as jest.Mock;
const mockedUseStore = useStore as unknown as jest.Mock;
const mockedUseTheme = useTheme as unknown as jest.Mock;
const mockedUseWorkoutStudio = useWorkoutStudio as unknown as jest.Mock;
const mockedUseSwitchableUsers = useSwitchableUsers as unknown as jest.Mock;
const mockedNavigate = navigate as jest.Mock;
const mockedUseFocusEffect = useFocusEffect as jest.Mock;
const mockedUseIsFocused = useIsFocused as jest.Mock;
const mockedUseNavigation = useNavigation as jest.Mock;
const mockedUseTranslation = require('react-i18next')
	.useTranslation as jest.Mock;

const user = {
	user_data: {
		dob: { timezone: 'Australia/Brisbane' },
		email: 'member@example.com',
		first_name: 'Test',
		last_name: 'Member',
		profile_image: 'https://example.com/member.png',
		user_id: 42,
	},
};

const classFilters = [
	{
		id: 101,
		is_selected: false,
		location: 'Main gym',
		name: 'Group Classes',
	},
	{ id: 102, is_selected: true, location: 'Main gym', name: 'Sauna' },
];

const venueFilters = [
	{ id: 201, is_selected: false, location: 'Brisbane', name: 'Main gym' },
	{ id: 202, is_selected: true, location: 'Brisbane', name: 'Recovery room' },
];

const classFiltersDataState: ClassFiltersDataType[] = [
	{
		classIds: [101],
		id: 1,
		isDefault: true,
		locationIds: [201],
		name: 'Group Classes',
	},
	{
		classIds: [102],
		id: 2,
		isDefault: false,
		locationIds: [202],
		name: 'Sauna',
	},
	{
		classIds: [],
		id: 3,
		isDefault: false,
		locationIds: [],
		name: 'Leaderboard',
	},
];

const setAppState = jest.fn();
const setClassFilters = jest.fn();
const setClassFiltersToApply = jest.fn();
const setHeaderTitle = jest.fn();
const setVenueFilters = jest.fn();
const setVenueFiltersToApply = jest.fn();
const setLoggedInUser = jest.fn();

const storeState = {
	attendanceReportState: {},
	classFilters,
	classFiltersDataState,
	emptyRequiredFields: [],
	joiningOtherGym: false,
	loggedInUser: user,
	notifSettings: { enabled: false, settings: {} },
	pushToken: '',
	setAppState,
	setClassFilters,
	setClassFiltersToApply,
	setDefaultClassFilter: jest.fn(),
	setHeaderTitle,
	setLoggedInUser,
	setVenueFilters,
	setVenueFiltersToApply,
	setWorkoutData: jest.fn(),
	teamId: 1,
	upcomingSessionsState: [],
	venueFilters,
};

const renderDashboard = () => render(<Dashboard />);

beforeEach(() => {
	jest.clearAllMocks();

	mockedUseAuth.mockReturnValue({
		getApiUrl: () => 'https://fitbox.iq',
		signOut: jest.fn(),
		updateUser: jest.fn(),
		user,
	});
	mockedUseIsFocused.mockReturnValue(true);
	mockedUseNavigation.mockReturnValue({
		navigate: jest.fn(),
		reset: jest.fn(),
	});
	mockedUseStore.mockImplementation(
		(selector: (state: typeof storeState) => unknown) =>
			selector(storeState),
	);
	mockedUseSwitchableUsers.mockReturnValue({
		fromParent: false,
		hasSwitchableUsers: false,
	});
	mockedUseTheme.mockReturnValue({ variant: 'light' });
	mockedUseTranslation.mockReturnValue({
		t: (key: string, options?: { name?: string }) =>
			key === 'dashboard:sessions.member.greeting'
				? `Hi ${options?.name ?? ''}`
				: key,
	});
	mockedUseWorkoutStudio.mockReturnValue({
		isEnabled: () => true,
	});
	mockedUseFocusEffect.mockImplementation(() => undefined);
});

describe('Dashboard explore interactions', () => {
	it('renders configured class filters and applies a selected filter before navigating to Calendar', () => {
		const screen = renderDashboard();

		expect(
			screen.getByRole('button', { name: 'Group Classes' }),
		).toBeTruthy();
		expect(screen.getByRole('button', { name: 'Sauna' })).toBeTruthy();

		fireEvent.press(screen.getByRole('button', { name: 'Group Classes' }));

		expect(setClassFilters).toHaveBeenCalledWith([
			{ ...classFilters[0], is_selected: true },
			{ ...classFilters[1], is_selected: false },
		]);
		expect(setClassFiltersToApply).toHaveBeenCalledWith([
			{ ...classFilters[0], is_selected: true },
			{ ...classFilters[1], is_selected: false },
		]);
		expect(setVenueFilters).toHaveBeenCalledWith([
			{ ...venueFilters[0], is_selected: true },
			{ ...venueFilters[1], is_selected: false },
		]);
		expect(setVenueFiltersToApply).toHaveBeenCalledWith([
			{ ...venueFilters[0], is_selected: true },
			{ ...venueFilters[1], is_selected: false },
		]);
		expect(setHeaderTitle).toHaveBeenCalledWith('Group Classes');
		expect(mockedNavigate).toHaveBeenCalledWith('Calendar');
	});

	it('routes Leaderboard to TrainingResults', () => {
		const screen = renderDashboard();

		expect(
			screen.getByRole('button', { name: 'Leaderboard' }),
		).toBeTruthy();

		fireEvent.press(screen.getByRole('button', { name: 'Leaderboard' }));

		expect(mockedNavigate).toHaveBeenCalledWith('Main', {
			params: { screen: 'TrainingResults' },
			screen: 'TrainingStack',
		});
	});

	it('does not render the obsolete Class filters section', () => {
		const screen = renderDashboard();

		expect(screen.queryByText(/class filters/i)).toBeNull();
	});
});
