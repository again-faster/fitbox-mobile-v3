/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ThemeProvider } from '@/theme';
import NotificationService from '@/utils/NotificationService';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-gesture-handler';
import { configureFonts, Provider } from 'react-native-paper';
import PushNotification from 'react-native-push-notification';
import 'react-native-reanimated';
import AuthProvider from './auth/AuthProvider/AuthProvider';
import KeyboardVisibilityProvider from './context/KeyboardProvider';
import ApplicationNavigator from './navigators/Application';
import { mmkvStorage } from './storage';
import './translations';
import { NotificationsType } from './types/schemas/notifications';

const queryClient = new QueryClient();

/**
 * Adding this here as per documentation
 *
 * DO NOT USE .configure() INSIDE A COMPONENT, EVEN App
 * If you do, notification handlers will not fire, because they are not loaded
 */
PushNotification.configure({
	onNotification: (notification: NotificationsType) => {
		if (notification.userInteraction) {
			void NotificationService.notificationHandler(notification);
			notification.finish(PushNotificationIOS.FetchResult.NoData);
		}
	},
	permissions: {
		alert: true,
		badge: false,
		sound: true,
	},
	popInitialNotification: true,
	requestPermissions: true,
});

// Create channel for session start notifications
PushNotification.createChannel({
	channelId: 'general-channel', // (
	channelName: 'General App Notifications',
	channelDescription: 'A channel for general app notifications',
});

// Create channel for session start notifications
PushNotification.createChannel({
	channelId: 'session-start', // (
	channelName: 'Session Start Notifications',
	channelDescription: 'A channel for session start',
});

// Initialize firebase listeners
NotificationService.initialize();

// Configure fonts
const customTheme = {
	fonts: configureFonts({
		config: {
			fontFamily: 'Montserrat-Regular',
		},
	}),
};

// eslint-disable-next-line react/function-component-definition
function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider storage={mmkvStorage}>
				<ThemeProvider storage={mmkvStorage}>
					<Provider theme={customTheme}>
						<KeyboardVisibilityProvider>
							<ApplicationNavigator />
						</KeyboardVisibilityProvider>
					</Provider>
				</ThemeProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default App;
