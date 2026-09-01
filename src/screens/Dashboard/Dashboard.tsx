/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import useAuth from '@/auth/hooks/useAuth';
import {
	Avatar,
	Row,
	ScrollView,
	SkeletonView,
	Spacer,
	Text,
} from '@/components/atoms';
import { MemberProgressRing } from '@/components/member';
import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';
import useSwitchableUsers from '@/hooks/useSwitchableUsers';
import { navigate } from '@/navigators/NavigationRef';
import {
	filterMemberSurfaceEntries,
	shouldShowMemberSurface,
} from '@/screens/Training/features/memberFeatureRoutes';
import { betaActive, savePushToken } from '@/services/auth';
import { getGymClasses, getGymVenues } from '@/services/gym';
import { getAttendanceReport } from '@/services/leaderboards';
import getWorkouts from '@/services/leaderboards/getWorkouts';
import { getAnnouncements, getConversationMessages } from '@/services/message';
import { getClassFilters } from '@/services/session';
import {
	getBookedSessions,
	getFailedPayments,
	getUserGymInfo,
} from '@/services/users';
import { mmkvStorage } from '@/storage';
import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import resources from '@/theme/resources';
import { ApplicationStackParamList } from '@/types/navigation';
import { GymVenueType } from '@/types/schemas/gym';
import { AnnouncementsItemType } from '@/types/schemas/message';
import { NotificationSettingsState } from '@/types/schemas/notifications';
import { FailedInvoicesType } from '@/types/schemas/payment';
import { LoginResponseSchemaType } from '@/types/schemas/response';
import {
	ClassFiltersDataType,
	WorkoutSchemaType,
} from '@/types/schemas/session';
import { UserSchemaType } from '@/types/schemas/user';
import { Constant, Func, Say } from '@/utils';
import NotificationService from '@/utils/NotificationService';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import { ClassFilter, VenueFilter } from '@/zustand/interface/SessionInterface';
import messaging, { firebase } from '@react-native-firebase/messaging';
import {
	NavigationProp,
	useFocusEffect,
	useIsFocused,
	useNavigation,
} from '@react-navigation/native';
import { isArray, isEmpty } from 'lodash';
import moment from 'moment-timezone';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Alert,
	AppState,
	Dimensions,
	Image,
	Platform,
	StatusBar,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { RESULTS, checkNotifications } from 'react-native-permissions';
import PushNotification from 'react-native-push-notification';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { BookedSessionCardProps } from './components/BookedSessionCard';
import DashboardActionGrid, {
	getDashboardExploreActions,
	getDashboardExploreNavigation,
	type DashboardExploreAction,
} from './components/DashboardActionGrid';
import DashboardAttendanceRow from './components/DashboardAttendanceRow';
import DashboardAttendanceMetric from './components/DashboardAttendanceMetric';
import DashboardHeader from './components/DashboardHeader';
import DashboardUpcomingSection from './components/DashboardUpcomingSection';
import FailedInvoicesModal from './components/FailedInvoicesModal';
import LoggedInUserInfo from './components/LoggedInUserInfo';
import LoginNotification from './components/LoginNotification';
import RequiredFieldsModal from './components/RequiredFieldsModal';

const { height } = Dimensions.get('window');
const { metrics } = config;

// const isAndroid = Platform.OS === 'ios';

// interface DashboardProps { }

const Dashboard = () => {
	const { t } = useTranslation(['dashboard']);
	const isFocused = useIsFocused();
	const { user, getApiUrl, signOut, updateUser } = useAuth();
	const { isEnabled } = useWorkoutStudio();
	const timezone = user?.user_data.dob.timezone as string;
	const [attendanceFilter, setAttendanceFilter] = useState<string[]>([]);
	const [loginNotifications, setLoginNotifications] = useState<
		AnnouncementsItemType[]
	>([]);
	// const headerHeight = useHeaderHeight();
	const { variant } = useTheme();

	const headerMarginTop = Platform.OS === 'ios' && Platform.isPad ? 50 : 0;

	const url = getApiUrl();

	const navigationTest =
		useNavigation<NavigationProp<ApplicationStackParamList>>();

	const {
		setAppState,
		shopUrl,
		classFilters,
		venueFilters,
		pushToken,
		setVenueFilters,
		setClassFilters,
		setHeaderTitle,
		setDefaultClassFilter,
		notifSettings,
		setClassFiltersToApply,
		setVenueFiltersToApply,
		attendanceReportState,
		classFiltersDataState,
		upcomingSessionsState,
		setWorkoutData,
		joiningOtherGym,
		emptyRequiredFieldsState,
		loggedInUser,
		setLoggedInUser,
		teamId,
	} = useStore(state => ({
		setAppState: state.setAppState,
		shopUrl: state.shopUrl,
		classFilters: state.classFilters,
		venueFilters: state.venueFilters,
		setClassFilters: state.setClassFilters,
		setVenueFilters: state.setVenueFilters,
		setClassFiltersToApply: state.setClassFiltersToApply,
		setVenueFiltersToApply: state.setVenueFiltersToApply,
		setHeaderTitle: state.setHeaderTitle,
		setDefaultClassFilter: state.setDefaultClassFilter,
		pushToken: state.pushToken,
		notifSettings: state.notifSettings,
		attendanceReportState: state.attendanceReportState,
		classFiltersDataState: state.classFiltersDataState,
		upcomingSessionsState: state.upcomingSessionsState,
		setWorkoutData: state.setWorkoutData,
		joiningOtherGym: state.joiningOtherGym,
		emptyRequiredFieldsState: state.emptyRequiredFields,
		loggedInUser: state.loggedInUser,
		setLoggedInUser: state.setLoggedInUser,
		teamId: state.teamId,
	}));

	const userState = loggedInUser as LoginResponseSchemaType;

	const [failedInvoicesRefreshing, setFailedInvoicesRefreshing] =
		useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(true);
	const [gymBanner, setGymBanner] = useState<string>('');
	const [gymLogo, setGymLogo] = useState<string>('');
	const [showAttendanceReport, setShowAttendanceReport] =
		useState<boolean>(false);
	const [monthlyAttendanceGoal, setMonthlyAttendanceGoal] = useState<
		number | null
	>(null);

	const [hasPrevSubscriptions, setHasPrevSubscriptions] =
		useState<boolean>(false);

	const [upcomingSessionsIsLoading, setUpcomingSessionsIsLoading] =
		useState<boolean>(true);

	const [attendanceReportIsLoading, setAttendanceReportIsLoading] =
		useState<boolean>(true);

	const [presetFiltersIsLoaded, setPresetFiltersIsLoaded] =
		useState<boolean>(false);

	const [failedInvoices, setFailedInvoices] = useState<FailedInvoicesType>();
	const [showFailedInvoicesModal, setShowFailedInvoicesModal] =
		useState<boolean>(false);

	const [showRequiredFieldsModal, setShowRequiredFieldsModal] =
		useState<boolean>(false);

	const { hasSwitchableUsers } = useSwitchableUsers();
	const classesEnabled = isEnabled('classes');
	const showBookingsEntryPoints = shouldShowMemberSurface(
		'Bookings',
		classesEnabled,
	);
	const showSessionEntryPoints = shouldShowMemberSurface(
		'Session',
		classesEnabled,
	);
	const classEntryPointsAvailable = shouldShowMemberSurface(
		'Calendar',
		classesEnabled,
	);
	const bookingEntryPointsAvailable =
		isEnabled('bookings') || isEnabled('my_bookings');
	const resultsEntryPointsAvailable = isEnabled('results');

	const attendanceGoalKey = useMemo(() => {
		const memberId = loggedInUser?.user_data.user_id;
		if (!teamId || !memberId) return null;

		return `attendanceGoal:v1:${teamId}:${memberId}`;
	}, [loggedInUser?.user_data.user_id, teamId]);

	useEffect(() => {
		if (!isFocused) return;

		if (!attendanceGoalKey) {
			setMonthlyAttendanceGoal(null);
			return;
		}

		const savedGoal = mmkvStorage.getNumber(attendanceGoalKey);
		setMonthlyAttendanceGoal(
			savedGoal && savedGoal >= 1 && savedGoal <= 31 ? savedGoal : null,
		);
	}, [attendanceGoalKey, isFocused]);

	const [currentNotificationIndex, setCurrentNotificationIndex] =
		useState<number>(0);
	const betaBuild = false;
	const onRefresh = () => {
		void initializeAppStates();
		void getFailedInvoices();
		void getUpcomingSessions();
		void getClassFiltersFn();
		void fetchAttendanceReport();
		// void getWorkouts();
		if (betaBuild) {
			checkBetaActive();
		}
	};

	const fetchWorkouts = () =>
		getWorkouts().then(res =>
			setWorkoutData({
				benchmark: res.data.benchmark as WorkoutSchemaType[],
				favorite: res.data.favorite as WorkoutSchemaType[],
			}),
		);

	const checkBetaActive = () => {
		betaActive()
			.then(res => {
				if (res.status === 404) {
					Alert.alert(
						'Beta Over',
						'The Beta phase is now over. We appreciate your feedback and supprt!',
						[
							{
								text: 'Logout',
								onPress: () => {
									signOut();

									navigationTest.reset({
										index: 0,
										routes: [{ name: 'Landing' }],
									});
								},
							},
						],
					);
				}
			})
			.catch(error => {
				// eslint-disable-next-line no-console
				console.log('checkBetaActive: ', error);
			});
	};

	useEffect(() => {
		setLoggedInUser({
			...userState,
			user_data: {
				...userState.user_data,
				has_previous_subscriptions: hasPrevSubscriptions,
			},
		});
	}, [hasPrevSubscriptions]);

	useEffect(() => {
		if (isFocused) {
			setLoginNotifications([]);
			setCurrentNotificationIndex(0);
		}
	}, [isFocused]);

	const initializeAppStates = async () => {
		const res = await getUserGymInfo();

		if (!res.error) {
			// TODO: Update the following once other functionalities are implemented
			// const gymParams = {
			// 	gym_id: res.gym_info.gym_lookup,
			// 	gym_logo: res.gym_info.logo,
			// 	gym_banner: res.gym_info.banner,
			// 	gym_loaded: true,
			// 	gym_refresh: this.componentDidMount, // pass this to refresh dashboard after gym switch
			// };

			// if (userData?.metaData?.onboarding_gym_ids?.length > 0) {
			// 	// navigate to select gym
			// 	this.props.navigation.navigate('SelectGym');
			// } else {
			// 	// simplify passed data
			// 	this.props.navigation.setParams(gymParams);
			// }
			// set unread messages

			// set force update if true or false

			// set refresh unread callback, this will be called when unread messages are updated
			// this.props.setUnreadMsgCb(this.initializeAppStates);
			if (
				!res.user_data.waiver_accepted &&
				loggedInUser?.user_data.waiver_accepted
			) {
				void Say.okThen(
					'Please review the waiver to continue',
					'Waiver Updated',
				).then(() => {
					updateUser({
						...loggedInUser?.user_data,
						waiver_accepted: res.user_data.waiver_accepted,
					});
					navigate('Startup');
				});
			}

			const { gym_info: gymInfo, user_data: userData } = res;
			setAppState(
				'emptyRequiredFields',
				parseEmptyRequiredFields(
					gymInfo.required_profile_fields,
					user?.user_data as UserSchemaType,
				),
			);
			// setAppState('gymParameters', gymInfo.gymParams);
			setAppState('teamId', gymInfo.gym_lookup);
			setAppState('shopUrl', gymInfo.online_store);
			setAppState('storeSignature', userData.store_signature || '');
			setAppState(
				'storeSignatureExpiry',
				userData.store_signature_expiry || 0,
			);
			setAppState('stripeCustomerId', userData.stripe_customer_id || '');
			setAppState('unreadMessages', gymInfo.num_of_unread_messages);
			setAppState('unreadMessageCallback', initializeAppStates);
			setAppState('allowLeaderboards', !!gymInfo.allow_leaderboards);
			setAppState('allowComments', !!gymInfo.allow_leaderboards_comment);
			setAppState('appForceUpdate', !!gymInfo.mobile_force_update);
			setAppState('logo', gymInfo.logo);
			setAppState('countryCode', gymInfo.country);

			// set gym logo and banner
			setGymLogo(gymInfo.logo);
			setGymBanner(String(gymInfo.banner ?? ''));

			setShowAttendanceReport(gymInfo.allow_attendance_report);
			setAttendanceFilter(gymInfo.mobile_dashboard_type);

			setHasPrevSubscriptions(userData.has_previous_subscriptions);

			if (gymInfo.num_of_unread_messages > 0) {
				void getLoginNotifications(gymInfo.gym_lookup);
			}
		}
	};

	const getLoginNotifications = async (gymId: number | string) => {
		const res = await getAnnouncements(gymId as number);
		if (!res.error) {
			if (res.data.length > 0) {
				const announcements = res.data.reverse();
				setLoginNotifications(announcements);
			}
		}
	};

	const onClosePopup = async () => {
		try {
			await getConversationMessages({
				conversationId: loginNotifications[currentNotificationIndex]
					?.convo_id as number,
				page: 0,
			});
		} catch (e) {
			Say.err(e as ICatchError);
		}
		setCurrentNotificationIndex(prev => prev + 1);
	};

	const resetCurrentIndex = async () => {
		try {
			await getConversationMessages({
				conversationId: loginNotifications[currentNotificationIndex]
					?.convo_id as number,
				page: 0,
			});
		} catch (e) {
			Say.err(e as ICatchError);
		}
	};

	const parseEmptyRequiredFields = (
		requiredFields: string[],
		userData: UserSchemaType,
	) => {
		const emptyRequiredFields: string[] = [];

		requiredFields.forEach(field => {
			if (userData) {
				if (
					field === 'dob' &&
					!moment.tz(userData[field]?.date, timezone).isValid()
				) {
					emptyRequiredFields.push(field);
				}

				if (isEmpty(userData[field as keyof UserSchemaType])) {
					if (
						typeof userData[field as keyof UserSchemaType] !==
						'number'
					) {
						emptyRequiredFields.push(field);
					}
				}
			}
		});

		return emptyRequiredFields;
	};

	const checkNotificationStatus = async () => {
		const { status } = await checkNotifications();
		const notificationsEnabled = status === RESULTS.GRANTED;

		// Add notification settings to r=global state merged with the current state
		const settings = {
			...notifSettings,
			enabled: notificationsEnabled,
		};

		setAppState('notifSettings', settings);

		return notificationsEnabled;
	};

	const initializeNotificationSettings = async () => {
		const currentSettings = notifSettings ?? {};

		const notificationSettingValues: NotificationSettingsState =
			Object.entries(
				Constant.NOTIFICATION_SETTINGS,
			).reduce<NotificationSettingsState>((setting, [key, value]) => {
				return {
					...setting,
					[key]:
						currentSettings?.settings?.[key] ?? value.defaultValue,
				};
			}, {});

		const notificationsEnabled = await checkNotificationStatus();
		const notificationSettings = {
			settings: notificationSettingValues,
			enabled: notificationsEnabled,
		};

		setAppState('notifSettings', notificationSettings);
	};

	const getFailedInvoices = async () => {
		setFailedInvoicesRefreshing(true);
		try {
			const res = await getFailedPayments();

			if (res.invoices.length > 0) {
				setShowFailedInvoicesModal(true);
			} else {
				setShowFailedInvoicesModal(false);
			}

			setFailedInvoices(res);
		} catch (e) {
			// Say.err(e as ICatchError);
		} finally {
			setFailedInvoicesRefreshing(false);
		}
	};

	const getUpcomingSessions = async () => {
		setUpcomingSessionsIsLoading(true);
		const memberSessions: BookedSessionCardProps[] = [];

		try {
			// let res = await RestService.getNextSessions(selectedClassIds.length ? selectedClassIds.join() : null);
			const res = await getBookedSessions();

			if (res.data && res.data.length > 0) {
				// Parse the response data
				res.data.forEach(session => {
					if (
						moment(session.calendar_event.end_datetime)
							.add(30, 'minutes')
							.isAfter()
					) {
						memberSessions.push({
							id: session.event_id,
							startTime: session.calendar_event.start_datetime,
							endTime: session.calendar_event.end_datetime,
							title: session.calendar_event.comment,
							venue: session.calendar_event.venue_id
								? session.calendar_event.venue_name
								: undefined,
							isCoach: false,
							waitlistEnabled:
								!!session.waitlist_info.enable_waitlist,
							waitlistTime: Number(
								session.waitlist_info.waitlist_timelimit,
							),
							color: session.fb_class.class_colour_hex,
						});
					}
				});
			}

			if (res.staffSessions && res.staffSessions.length > 0) {
				res.staffSessions.forEach(session => {
					if (moment(session.start).add(30, 'minutes').isAfter()) {
						memberSessions.push({
							id: session.id,
							startTime: session.start,
							endTime: session.end,
							title: session.title,
							venue: session.venue_id
								? String(session.venue_name)
								: undefined,
							isCoach: true,
							waitlistEnabled: false,
							waitlistTime: 0,
							color: session.class_colour_hex,
						});
					}
				});
			}
		} catch (err) {
			Say.err(err as ICatchError);
		} finally {
			// sort sessions by start time
			memberSessions.sort((sessionA, sessionB) => {
				const startA = moment.tz(sessionA.startTime, timezone);
				const startB = moment.tz(sessionB.startTime, timezone);
				return startA && startB && startA > startB ? 1 : -1;
			});

			setAppState('upcomingSessionsState', memberSessions);
			setRefreshing(false);

			setUpcomingSessionsIsLoading(false);
		}

		const sessionStartEnabled = notifSettings?.settings?.session;
		if (sessionStartEnabled && memberSessions.length > 0) {
			setLocalNotifications(memberSessions);
		}
	};

	const setLocalNotifications = (sessions: BookedSessionCardProps[]) =>
		sessions.map(session => {
			const schedule = moment.tz(session.startTime, timezone);

			if (schedule.isBefore()) return null;

			const notificationData = {
				screen: 'Session',
				session: {
					...session,
					title: session.title,
				},
			};

			PushNotification.localNotificationSchedule({
				channelId: 'session-start',
				title: session.title,
				message: 'Your session is about to start',
				date: schedule.toDate(),
				data: notificationData,
				userInfo: {
					data: notificationData,
				},
			});

			return true;
		});

	const savePushNotificationToken = async () => {
		const authStatus = await messaging().requestPermission();

		const enabled =
			authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
			authStatus === messaging.AuthorizationStatus.PROVISIONAL;

		if (enabled) {
			const token = await firebase.app().messaging().getToken();

			if (token && token !== pushToken) {
				try {
					const res = await savePushToken(
						token,
						user?.user_data.user_id as number,
						Platform.OS === 'android' ? 'android' : 'ios',
						Func.getEnv(url),
					);

					if (res.status === 200) {
						setAppState('pushToken', token);
					}
				} catch (e) {
					// console.log('Token not saved');
				}
			}
		}
	};

	const onFocusTasks = async () => {
		await initializeAppStates();
		await getFailedInvoices();
		await getUpcomingSessions();
		await getClassFiltersFn();
		PushNotification.cancelAllLocalNotifications();
	};

	useEffect(() => {
		if (!isEmpty(emptyRequiredFieldsState)) {
			setShowRequiredFieldsModal(true);
		} else {
			setShowRequiredFieldsModal(false);
		}
	}, [emptyRequiredFieldsState]);

	useFocusEffect(
		useCallback(() => {
			setFailedInvoicesRefreshing(true);
			const timer = setTimeout(() => {
				setRefreshing(false);
			}, 2000);

			void onFocusTasks();
			void fetchAttendanceReport();

			return () => clearTimeout(timer);
		}, [user]),
	);

	// useEffect(() => {
	// 	void getUpcomingSessions();
	// }, [notifSettings]);

	const onMountTasks = async () => {
		setAppState('showConfetti', false);
		await savePushNotificationToken();
		await initializeNotificationSettings();
		AppState.addEventListener('change', () => {
			void checkNotificationStatus();
		});
	};

	// get filter options every gym switch
	useEffect(() => {
		if (joiningOtherGym) {
			navigate('SwitchGym');
			setAppState('joiningOtherGym', false);
		}
		void fetchFilterOptions();
		void onMountTasks();
		void fetchWorkouts();
		if (betaBuild) {
			checkBetaActive();
		}
		NotificationService.setGymFetcher(initializeAppStates);
	}, []);

	const handleAttendancePress = () => {
		const version = DeviceInfo.getVersion();
		const key = `hasPressedAttendanceReport_${version}`;
		mmkvStorage.set(key, true);
		navigate('Attendance');
	};

	const fetchAttendanceReport = () => {
		setAttendanceReportIsLoading(true);
		try {
			getAttendanceReport(user?.user_data.user_id as number)
				.then(res => {
					if (!res.error) {
						setAppState('attendanceReportState', res.data);
					}
				})
				.catch(err => {
					Say.err(err as ICatchError);
				});
		} catch (e) {
			Say.err(e as ICatchError);
		} finally {
			setAttendanceReportIsLoading(false);
		}
	};

	const fetchFilterOptions = () => {
		const selectedVenueIds = venueFilters
			.filter(v => v.is_selected)
			.map(v => v.id);
		const selectedClassIds = classFilters
			.filter(c => c.is_selected)
			.map(c => c.id);

		// fetch venues
		getGymVenues()
			.then(res => {
				if (isArray(res)) {
					const venueFilterList: VenueFilter[] = res.map(
						(c: GymVenueType) => {
							return {
								...c,
								is_selected:
									selectedVenueIds.includes(c.id) || false,
							};
						},
					);

					// add "No location" filter
					venueFilterList.unshift({
						id: -1,
						name: 'No location',
						location: 'Show classes without a location',
						is_selected: false,
					});

					// set venue filters
					setVenueFilters(venueFilterList);
				}
			})
			.catch(err => {
				Say.err(err as ICatchError);
			});

		getGymClasses()
			.then(res => {
				if (!res.error) {
					const classFilterList: ClassFilter[] = res.data.map(c => {
						return {
							...c,
							is_selected:
								selectedClassIds.includes(c.id) || false,
						};
					});

					// set class filters
					setClassFilters(classFilterList);
				} else {
					throw new Error(res.message);
				}
			})
			.catch(err => {
				Say.err(err as ICatchError);
			});
	};

	const getClassFiltersFn = async () => {
		const leaderboards = {
			classIds: [],
			id: 0,
			isDefault: 0,
			locationIds: [],
			name: 'Leaderboard',
		};

		try {
			const res = await getClassFilters();
			const newResData = res.data;
			newResData.splice(1, 0, leaderboards);
			setAppState('classFiltersDataState', newResData);
			const defaultItem = res.data.find(
				item =>
					item.isDefault === 1 ||
					(typeof item.isDefault === 'boolean' &&
						item.isDefault === true),
			);
			if (defaultItem) {
				setDefaultClassFilter(defaultItem as ClassFiltersDataType);
			} else {
				setDefaultClassFilter({} as ClassFiltersDataType);
			}
		} catch (e) {
			Say.err(e as ICatchError);
		} finally {
			setPresetFiltersIsLoaded(true);
		}
	};

	let avatarImage = '';

	if (user?.user_data.profile_image) {
		if (user?.user_data.profile_image.includes(Constant.API_URL)) {
			avatarImage = user?.user_data.profile_image;
		} else {
			avatarImage = `${Constant.API_URL}/${user?.user_data.profile_image}`;
		}
	} else {
		avatarImage = `https://avatars.githubusercontent.com/u/15073128?v=${moment().toISOString()}`;
	}

	const onActionButtonClick = (navTo: string) => {
		if (navTo === 'calendar') {
			navigate('Calendar');
		} else if (navTo === 'results') {
			navigate('Main', {
				screen: 'TrainingStack',
				params: { screen: 'TrainingResults' },
			});
		}
	};

	const exploreActions = useMemo(
		() =>
			getDashboardExploreActions(
				Boolean(shopUrl),
				classEntryPointsAvailable,
				bookingEntryPointsAvailable,
				resultsEntryPointsAvailable,
			),
		[
				bookingEntryPointsAvailable,
				classEntryPointsAvailable,
				resultsEntryPointsAvailable,
				shopUrl,
			],
	);

	const onExploreActionPress = (action: DashboardExploreAction) => {
		if (action.destination.tab === 'TrainingStack') {
			navigate('Main', {
				screen: 'TrainingStack',
				params: { screen: action.destination.screen },
			});
			return;
		}

		navigate('Main', getDashboardExploreNavigation(action.destination));
	};

	const visiblePresetFilters = useMemo(
		() =>
			filterMemberSurfaceEntries(
				classFiltersDataState.map(item => ({
					item,
					route:
						item.name === 'Leaderboard'
							? ('TrainingResults' as const)
							: ('Calendar' as const),
				})),
				classEntryPointsAvailable,
			).map(({ item }) => item),
		[classFiltersDataState, classEntryPointsAvailable],
	);

	const onPresetFilterClick = (data: ClassFiltersDataType) => {
		let updatedClassFilter = [];
		let updatedVenueFilter = [];

		const classIdsSet = new Set(data.classIds);
		const locationIdsSet = new Set(data.locationIds);

		updatedClassFilter = classFilters.map(item => ({
			...item,
			is_selected: !!classIdsSet.has(item.id as number),
		}));

		updatedVenueFilter = venueFilters.map(item => ({
			...item,
			is_selected: !!locationIdsSet.has(item.id as number),
		}));

		setClassFilters(updatedClassFilter);
		setClassFiltersToApply(updatedClassFilter);
		setVenueFilters(updatedVenueFilter);
		setVenueFiltersToApply(updatedVenueFilter);

		setHeaderTitle(data.name);
		navigate('Calendar');
	};

	const renderPresetFilter = (item: ClassFiltersDataType) => {
		const isLeaderboard = item.name === 'Leaderboard';
		const onPress = isLeaderboard
			? () => onActionButtonClick('results')
			: () => onPresetFilterClick(item);

		return (
			<TouchableOpacity
				key={isLeaderboard ? 'leaderboard' : item.id}
				onPress={onPress}
				accessibilityRole="button"
				accessibilityLabel={`Class filter ${item.name}`}
				style={styles.filterChip}
			>
				<Icon
					name={isLeaderboard ? 'trophy-outline' : 'calendar-outline'}
					size={18}
					color={memberTheme.colors.primary}
				/>
				<Text size="sm" style={styles.filterChipText} numberOfLines={1}>
					{item.name}
				</Text>
			</TouchableOpacity>
		);
	};

	const monthAttendance = attendanceReportState.monthToDate ?? 0;
	const monthlyGoalProgress = monthlyAttendanceGoal
		? Math.min(monthAttendance / monthlyAttendanceGoal, 1)
		: 0;
	const renderedAttendanceMetricCount = ['month', 'year', 'alltime'].filter(
		metric => attendanceFilter.includes(metric),
	).length;
	const compactMonthlyGoalMetric = Boolean(
		monthlyAttendanceGoal && renderedAttendanceMetricCount === 3,
	);

	const renderDashboardComponents = () => {
		return (
			<>
				<Row
					align="center"
					spacing="space-between"
					style={styles.greetingRow}
				>
					<View style={styles.greetingCopy}>
						<Text bold size="xxl">
							{t('dashboard:sessions.member.greeting', {
								name: user?.user_data.first_name ?? '',
							})}
						</Text>
						<Text size="md" style={styles.greetingSubtitle}>
							Let’s keep the momentum going 💪
						</Text>
					</View>

					{hasSwitchableUsers ? (
						<TouchableOpacity
							activeOpacity={1}
							onPress={() => navigate('SwitchUser')}
						>
							<Avatar source={avatarImage} />
							<Icon
								name="swap-horizontal"
								style={styles.switchIcon}
							/>
						</TouchableOpacity>
					) : null}
				</Row>

				{showAttendanceReport &&
					(attendanceReportIsLoading &&
					isEmpty(attendanceReportState) ? (
						<>
							<Spacer size="xxl" />
							<SkeletonView height={14} width="30%" />
							<Spacer size="sm" />
							<Row spacing="space-between">
								<SkeletonView height={65} width="48%" />
								<SkeletonView height={65} width="48%" />
							</Row>
						</>
					) : (
						!isEmpty(attendanceReportState) && (
							<TouchableOpacity
								style={styles.attendanceCard}
								onPress={handleAttendancePress}
								accessibilityRole="button"
								accessibilityLabel="View attendance details"
							>
								<DashboardAttendanceRow>
									{attendanceFilter.includes('month') && (
										<DashboardAttendanceMetric
											compact={compactMonthlyGoalMetric}
											value={
												monthlyAttendanceGoal
													? `${monthAttendance} / ${monthlyAttendanceGoal}`
													: String(monthAttendance)
											}
											label={
												monthlyAttendanceGoal
													? 'monthly goal'
													: 'this month'
											}
											valueStyle={
												compactMonthlyGoalMetric
													? styles.monthlyGoalCompactValue
													: monthlyAttendanceGoal
														? styles.monthlyGoalValue
														: undefined
											}
										>
											{monthlyAttendanceGoal ? (
												<MemberProgressRing
													progress={
														monthlyGoalProgress
													}
													size={
														compactMonthlyGoalMetric
															? 26
															: 38
													}
													strokeWidth={3}
													trackColor={
														memberTheme.colors
															.surfaceSoft
													}
												>
													<Text
														style={[
															styles.goalAttendanceIcon,
															compactMonthlyGoalMetric
																? styles.compactGoalAttendanceIcon
																: null,
														]}
														allowFontScaling={false}
													>
														🎯
													</Text>
												</MemberProgressRing>
											) : (
												<Image
													source={
														resources.icon
															.monthToDate
													}
													style={
														styles.attendanceIcon
													}
												/>
											)}
										</DashboardAttendanceMetric>
									)}

									{attendanceFilter.includes('year') && (
										<DashboardAttendanceMetric
											value={String(
												attendanceReportState.yearToDate,
											)}
											label="this year"
										>
											<Image
												source={
													resources.icon.yearToDate
												}
												style={styles.attendanceIcon}
											/>
										</DashboardAttendanceMetric>
									)}

									{attendanceFilter.includes('alltime') && (
										<DashboardAttendanceMetric
											value={String(
												attendanceReportState.lifetime,
											)}
											label="all time"
										>
											<Image
												source={resources.icon.trophy}
												style={styles.attendanceIcon}
											/>
										</DashboardAttendanceMetric>
									)}
								</DashboardAttendanceRow>
							</TouchableOpacity>
						)
					))}

				{showSessionEntryPoints &&
					(upcomingSessionsIsLoading &&
					isEmpty(upcomingSessionsState) ? (
						<>
							<Spacer size="md" />
							<View style={styles.upcomingSkeleton}>
								<SkeletonView height={18} width="48%" />
								<Spacer size="sm" />
								<SkeletonView height={94} width="100%" />
							</View>
						</>
					) : (
						<DashboardUpcomingSection
							sessions={upcomingSessionsState}
							onViewAll={
								showBookingsEntryPoints
									? () => navigate('Bookings')
									: undefined
							}
						/>
					))}

				{!presetFiltersIsLoaded && isEmpty(classFiltersDataState) ? (
					<>
						<Spacer size="xl" />
						<Spacer size="xl" />
						<SkeletonView height={165} width="100%" />
					</>
				) : (
					<>
						<View style={styles.sectionHeadingRow}>
							<Text bold style={styles.sectionHeadingText}>
								Explore
							</Text>
						</View>
						<DashboardActionGrid
							actions={exploreActions.map(action => ({
								...action,
								onPress: () => onExploreActionPress(action),
							}))}
						/>

						{visiblePresetFilters.some(
							item => item.name !== 'Leaderboard',
						) ? (
							<View style={styles.classFiltersSection}>
								<Text bold style={styles.classFiltersHeading}>
									Class filters
								</Text>
								<View style={styles.filterChips}>
									{visiblePresetFilters
										.filter(
											item => item.name !== 'Leaderboard',
										)
										.map(renderPresetFilter)}
								</View>
							</View>
						) : null}
					</>
				)}
			</>
		);
	};

	return (
		<SafeAreaView style={[layout.flex_1, styles.screen]}>
			<StatusBar
				barStyle={variant === 'dark' ? 'light-content' : 'dark-content'}
			/>
			{/* TODO: If banner doesn't update include versioning of image to apply changes */}
			<DashboardHeader banner={gymBanner} logo={gymLogo} />

			<Spacer size={memberTheme.spacing.xs} />

			<ScrollView
				refreshing={refreshing}
				onRefresh={onRefresh}
				style={[styles.scrollView, { marginTop: headerMarginTop }]}
			>
				<View style={styles.section}>
					<View>
						{renderDashboardComponents()}
						<Spacer size="xl" />

						{/* NOTE: Hide Announcements for now */}
						{/* <Text size="lg">Announcements</Text>
						<Spacer />
						<DashboardAnnouncements /> */}
					</View>
				</View>
			</ScrollView>

			<LoggedInUserInfo />
			{/* <WhatsNewDialog /> */}

			{showRequiredFieldsModal && (
				<RequiredFieldsModal
					setShowRequiredFieldsModal={setShowRequiredFieldsModal}
				/>
			)}

			{failedInvoices &&
				failedInvoices?.invoices.length > 0 &&
				showFailedInvoicesModal &&
				!failedInvoicesRefreshing && (
					<FailedInvoicesModal
						failedInvoices={failedInvoices}
						setShowFailedInvoicesModal={setShowFailedInvoicesModal}
					/>
				)}
			{isFocused &&
				loginNotifications.length > 0 &&
				currentNotificationIndex < loginNotifications.length &&
				loginNotifications[currentNotificationIndex] && (
					<LoginNotification
						item={
							loginNotifications[
								currentNotificationIndex
							] as AnnouncementsItemType
						}
						onClose={() => void onClosePopup()}
						navigation={navigate}
						index={currentNotificationIndex}
						key={currentNotificationIndex}
						resetCurrentIndex={() => void resetCurrentIndex()}
					/>
				)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	screen: {
		backgroundColor: memberTheme.colors.background,
	},
	scrollView: {
		backgroundColor: memberTheme.colors.background,
	},
	section: {
		paddingHorizontal: memberTheme.spacing.lg,
		paddingTop: memberTheme.spacing.lg,
		paddingBottom: metrics.xl,
		justifyContent: 'space-between',
	},
	greetingRow: {
		alignItems: 'flex-start',
		marginBottom: memberTheme.spacing.md,
	},
	greetingCopy: {
		flex: 1,
		minWidth: 0,
	},
	greetingSubtitle: {
		marginTop: memberTheme.spacing.xs,
		color: memberTheme.colors.textMuted,
	},
	attendanceCard: {
		marginTop: memberTheme.spacing.sm,
		marginBottom: memberTheme.spacing.md,
		paddingHorizontal: memberTheme.spacing.lg,
		paddingVertical: memberTheme.spacing.lg,
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.lg,
		borderWidth: 1,
		borderColor: memberTheme.colors.border,
		...memberTheme.shadow,
	},
	sectionHeadingRow: {
		marginTop: memberTheme.spacing.lg,
		marginBottom: memberTheme.spacing.md,
	},
	sectionHeadingText: {
		fontSize: height < 750 ? 20 : 24,
	},
	upcomingSkeleton: {
		marginTop: memberTheme.spacing.lg,
		padding: memberTheme.spacing.md,
		borderRadius: memberTheme.radius.lg,
		backgroundColor: memberTheme.colors.surface,
		borderWidth: 1,
		borderColor: memberTheme.colors.border,
	},
	attendanceIcon: {
		width: 30,
		height: 30,
		marginRight: memberTheme.spacing.xs,
	},
	goalAttendanceIcon: {
		fontSize: 20,
		lineHeight: 24,
	},
	monthlyGoalValue: {
		fontSize: 23,
		marginLeft: memberTheme.spacing.xs,
	},
	monthlyGoalCompactValue: {
		fontSize: 17,
		marginLeft: 0,
	},
	compactGoalAttendanceIcon: {
		fontSize: 14,
		lineHeight: 16,
	},
	switchIcon: {
		position: 'absolute',
		right: 0,
		bottom: 0,
		borderRadius: 10,
		padding: 3,
		fontSize: config.fonts.metrics.xs,
		...layout.shadowLight,
	},
	classFiltersSection: {
		marginTop: memberTheme.spacing.sm,
	},
	classFiltersHeading: {
		marginBottom: memberTheme.spacing.sm,
		color: memberTheme.colors.primaryInk,
	},
	filterChips: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: memberTheme.spacing.sm,
	},
	filterChip: {
		maxWidth: '100%',
		minHeight: 40,
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: memberTheme.radius.pill,
		borderWidth: 1,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surface,
		paddingHorizontal: memberTheme.spacing.md,
		paddingVertical: memberTheme.spacing.sm,
		...memberTheme.shadow,
	},
	filterChipText: {
		marginLeft: memberTheme.spacing.xs,
		color: memberTheme.colors.primaryInk,
		flexShrink: 1,
	},
});

export default Dashboard;
