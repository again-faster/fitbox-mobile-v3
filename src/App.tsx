/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ThemeProvider } from '@/theme';
import NotificationService from '@/utils/NotificationService';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import * as Sentry from '@sentry/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DeviceInfo from 'react-native-device-info';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureFonts, Provider } from 'react-native-paper';
import PushNotification from 'react-native-push-notification';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthProvider from './auth/AuthProvider/AuthProvider';
import KeyboardVisibilityProvider from './context/KeyboardProvider';
import SwitchableUserProvider from './context/SwitchableUser';
import ApplicationNavigator from './navigators/Application';
import { mmkvStorage } from './storage';
import layout from './theme/layout';
import './translations';
import { NotificationsType } from './types/schemas/notifications';

const version = DeviceInfo.getVersion();
const build = DeviceInfo.getBuildNumber();

Sentry.init({
	dsn: 'https://19b5c61b50338b655de3d662a7b7d995@o4503926725607424.ingest.us.sentry.io/4508237654982657',
	release: `fitbox@${version}+${build}`,
	debug: true,

	// start - disable this lines for HMD devices
	// _experiments: {
	// 	replaysOnErrorSampleRate: 1.0,
	// 	replaysSessionSampleRate: 1.0,
	// },
	// integrations: [Sentry.mobileReplayIntegration],
	// end - disable this lines for HMD devices

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// enableSpotlight: __DEV__,
});

const queryClient = new QueryClient();
const isPreviewIosBuild =
	Platform.OS === 'ios' &&
	DeviceInfo.getBundleId() === 'com.againfaster.fitbox.preview';

/**
 * Adding this here as per documentation
 *
 * DO NOT USE .configure() INSIDE A COMPONENT, EVEN App
 * If you do, notification handlers will not fire, because they are not loaded
 */
if (!isPreviewIosBuild) {
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

	// Initialize Firebase listeners only when push notifications are available.
	NotificationService.initialize();
}

if (Platform.OS === 'android') {
	PushNotification.createChannel({
		channelId: 'general-channel',
		channelName: 'General App Notifications',
		channelDescription: 'A channel for general app notifications',
	});

	PushNotification.createChannel({
		channelId: 'session-start',
		channelName: 'Session Start Notifications',
		channelDescription: 'A channel for session start',
	});
}

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
		<GestureHandlerRootView style={layout.flex_1}>
			<SafeAreaProvider>
				<QueryClientProvider client={queryClient}>
					<AuthProvider storage={mmkvStorage}>
						<ThemeProvider storage={mmkvStorage}>
							<Provider theme={customTheme}>
								<KeyboardVisibilityProvider>
									<SwitchableUserProvider>
										<ApplicationNavigator />
									</SwitchableUserProvider>
								</KeyboardVisibilityProvider>
							</Provider>
						</ThemeProvider>
					</AuthProvider>
				</QueryClientProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

export default App;
