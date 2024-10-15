/* eslint-disable consistent-return */
import { navigate } from '@/navigators/NavigationRef';
import { getUserGymInfo } from '@/services/users';
import {
	MessageNotificationsType,
	MessageType,
	NotificationsType,
} from '@/types/schemas/notifications';
import useStore from '@/zustand/Store';
import messaging, {
	FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import PushNotification from 'react-native-push-notification';
import Say, { ICatchError } from './Say';

let fetchGymAssets: (() => Promise<void>) | null = null;

const initialize = () => {
	messaging()
		.getInitialNotification()
		.then(remoteMessage => {
			if (remoteMessage) void notificationHandler(remoteMessage);
		})
		.catch(error => {
			Say.err(error as ICatchError);
		});

	messaging().onNotificationOpenedApp(message => {
		void notificationHandler(message);
	});

	messaging().onMessage(message => {
		void onMessageHandler(message);
	});

	// eslint-disable-next-line @typescript-eslint/require-await
	messaging().setBackgroundMessageHandler(async message => {
		void onMessageHandler(message, false);
	});
};

const notificationHandler = async (
	action:
		| FirebaseMessagingTypes.RemoteMessage
		| NotificationsType
		| MessageType,
) => {
	const { screen, type } = action.data as { screen: string; type: string };

	try {
		if (type === 'NEW_MESSAGE') {
			if (action.data?.user_list) {
				if (
					Platform.OS === 'android' &&
					!(action as NotificationsType).userInteraction
				)
					return false;

				const subject =
					(action as NotificationsType).title ||
					(action as MessageType).notification?.title;

				const userList = (action as NotificationsType).data.user_list;

				const navParams = {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					user_list: JSON.parse(userList as string),
					subject,
					convo_id: action.data.convo_id,
					reload: true,
				};

				const teamId = (action as MessageType).data.team_id;
				return navigate('InboxStack', {
					screen: 'Conversation',
					params: {
						conversation: navParams,
						switchToGym: teamId,
					},
					initial: false,
				});
			}
		}
		if (screen) {
			if (screen === 'ScoreComments') {
				let allowComments = false;
				const res = await getUserGymInfo();
				if (!res.error)
					allowComments = res.gym_info.allow_leaderboards_comment;

				const params = {
					showComments: allowComments,
					...action.data,
					fromOpenTrigger: true,
				};

				navigate(screen as string, params);
			} else {
				navigate(screen, { ...action.data });
			}
		}
	} catch (e) {
		Say.err(e as ICatchError);
	}
};

const onMessageHandler = (
	message: FirebaseMessagingTypes.RemoteMessage,
	fromBackground = false,
) => {
	const { title, body } = message.notification as MessageNotificationsType;

	// use 'localNotificationSchedule' bc userInfo won't work on 'localNotification'
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
	PushNotification.localNotificationSchedule({
		channelId: 'general-channel',
		priority: 'high',
		vibration: 300,
		ignoreInForeground: false,
		onlyAlertOnce: true,
		title,
		message: body,
		data: message.data,
		userInfo: message.data,
		playSound: false,
		soundName: 'default',
		date: new Date(Date.now() + 1000),
	});

	if (fromBackground) {
		if (message.data?.type !== 'NEW_MESSAGE') return false;

		const newNotifications = [];
		const { setAppState, notifications } = useStore.getState();

		notifications.forEach(data => {
			newNotifications.push(data);
		});

		const notifData = {
			title: message.notification?.title,
			message: message.notification?.body,
			type: 'message',
			data: message.data,
		};

		newNotifications.push(notifData);

		setAppState('showModalNotification', true);
		setAppState('notifications', newNotifications);

		if (typeof fetchGymAssets === 'function') {
			void fetchGymAssets();
		}

		return true;
	}
	return true;
};

const setGymFetcher = (fetcher: () => Promise<void>) => {
	if (fetcher) {
		fetchGymAssets = fetcher;
	}
};

export default {
	initialize,
	notificationHandler,
	onMessageHandler,
	setGymFetcher,
};
