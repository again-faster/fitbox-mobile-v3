import { Platform } from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import { syncNow } from './healthKitService';

const BG_TASK_ID = 'com.wa.fitbox.dev.healthsync';

export const configureBgSync = async (): Promise<void> => {
	if (Platform.OS !== 'ios') return;

	await BackgroundFetch.configure(
		{
			minimumFetchInterval: 120, // 2 hours in minutes
			stopOnTerminate: false,
			startOnBoot: false,
			enableHeadless: false,
		},
		(taskId: string) => {
			void syncNow()
				.catch((e: unknown) => {
					// eslint-disable-next-line no-console
					console.error('[HealthSync] bg sync error', e);
				})
				.finally(() => {
					BackgroundFetch.finish(taskId);
				});
		},
		(taskId: string) => {
			BackgroundFetch.finish(taskId);
		},
	);

	await BackgroundFetch.scheduleTask({
		taskId: BG_TASK_ID,
		delay: 7200, // 2 hours in seconds
		periodic: true,
		requiresNetworkConnectivity: true,
	});
};

export const stopBgSync = (): void => {
	if (Platform.OS !== 'ios') return;
	void BackgroundFetch.stop(BG_TASK_ID);
};
