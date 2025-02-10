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
import { SafeScreen } from '@/components/template';
import useSwitchableUsers from '@/hooks/useSwitchableUsers';
import { navigate } from '@/navigators/NavigationRef';
import { betaActive, savePushToken } from '@/services/auth';
import { getGymClasses, getGymVenues } from '@/services/gym';
import { getAttendanceReport } from '@/services/leaderboards';
import getWorkouts from '@/services/leaderboards/getWorkouts';
import { getClassFilters } from '@/services/session';
import { getBookedSessions, getUserGymInfo } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import resources from '@/theme/resources';
import { ApplicationStackParamList } from '@/types/navigation';
import { GymVenueType } from '@/types/schemas/gym';
import { NotificationSettingsState } from '@/types/schemas/notifications';
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
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { RESULTS, checkNotifications } from 'react-native-permissions';
import PushNotification from 'react-native-push-notification';
import Icon from 'react-native-vector-icons/Ionicons';
import BookedSessionCard, {
	BookedSessionCardProps,
} from './components/BookedSessionCard';
import DashboardActionButton from './components/DashboardActionButton';
import DashboardHeader from './components/DashboardHeader';
import LoggedInUserInfo from './components/LoggedInUserInfo';

// List of action buttons to be displayed on the dashboard screen
const actionButtons = [
	// {
	// 	id: 'calendar',
	// 	icon: 'calendar-alt',
	// 	text: 'Book Class',
	// },
	// {
	// 	id: 'wellness',
	// 	icon: 'heart',
	// 	text: 'Wellness',
	// },
	{
		id: 'results',
		icon: 'trophy',
		text: 'Leaderboard',
	},
];

const { height } = Dimensions.get('window');
const { metrics, fonts } = config;

// const isAndroid = Platform.OS === 'ios';

// interface DashboardProps { }

const Dashboard = () => {
	const { t } = useTranslation(['dashboard']);
	const { user, getApiUrl, signOut } = useAuth();
	const timezone = user?.user_data.dob.timezone as string;
	// const headerHeight = useHeaderHeight();

	const headerMarginTop = Platform.OS === 'ios' && Platform.isPad ? 50 : 0;

	const url = getApiUrl();

	const navigationTest =
		useNavigation<NavigationProp<ApplicationStackParamList>>();

	const {
		setAppState,
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
	} = useStore(state => ({
		setAppState: state.setAppState,
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
	}));

	const [refreshing, setRefreshing] = useState<boolean>(true);
	const [gymBanner, setGymBanner] = useState<string>('');
	const [gymLogo, setGymLogo] = useState<string>('');
	const [showAttendanceReport, setShowAttendanceReport] =
		useState<boolean>(false);

	const [upcomingSessionsIsLoading, setUpcomingSessionsIsLoading] =
		useState<boolean>(true);

	const [attendanceReportIsLoading, setAttendanceReportIsLoading] =
		useState<boolean>(true);

	const [presetFiltersIsLoaded, setPresetFiltersIsLoaded] =
		useState<boolean>(false);

	const { hasSwitchableUsers } = useSwitchableUsers();
	const betaBuild = false;
	const onRefresh = () => {
		void initializeAppStates();
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
			const { gym_info: gymInfo } = res;

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
			setAppState('unreadMessages', gymInfo.num_of_unread_messages);
			setAppState('unreadMessageCallback', initializeAppStates);
			setAppState('allowLeaderboards', !!gymInfo.allow_leaderboards);
			setAppState('allowComments', !!gymInfo.allow_leaderboards_comment);
			setAppState('appForceUpdate', !!gymInfo.mobile_force_update);
			setAppState('logo', gymInfo.logo);

			// set gym logo and banner
			setGymLogo(gymInfo.logo);
			setGymBanner(String(gymInfo.banner));

			setShowAttendanceReport(gymInfo.allow_attendance_report);
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
					emptyRequiredFields.push(field);
				}
			}
		});

		return emptyRequiredFields;
	};

	const checkNotificationStatus = async () => {
		const { status } = await checkNotifications();
		const isEnabled = status === RESULTS.GRANTED;

		// Add notification settings to r=global state merged with the current state
		const settings = {
			...notifSettings,
			enabled: isEnabled,
		};

		setAppState('notifSettings', settings);

		return isEnabled;
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

		const isEnabled = await checkNotificationStatus();
		const notificationSettings = {
			settings: notificationSettingValues,
			enabled: isEnabled,
		};

		setAppState('notifSettings', notificationSettings);
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
		await getUpcomingSessions();
		await getClassFiltersFn();
		PushNotification.cancelAllLocalNotifications();
	};

	useFocusEffect(
		useCallback(() => {
			const timer = setTimeout(() => {
				setRefreshing(false);
			}, 2000);

			void onFocusTasks();
			void fetchAttendanceReport();

			return () => clearTimeout(timer);
		}, []),
	);

	// useEffect(() => {
	// 	void getUpcomingSessions();
	// }, [notifSettings]);

	const onMountTasks = async () => {
		await savePushNotificationToken();
		await initializeNotificationSettings();
		AppState.addEventListener('change', () => {
			void checkNotificationStatus();
		});
	};

	// get filter options every gym switch
	useEffect(() => {
		void fetchFilterOptions();
		void onMountTasks();
		void fetchWorkouts();
		if (betaBuild) {
			checkBetaActive();
		}
		NotificationService.setGymFetcher(initializeAppStates);
	}, []);

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
			navigate('ClassResults');
		} else {
			Alert.alert('Coming soon', `${navTo} screen`);
		}
	};

	const renderActionButtons = useMemo(
		() =>
			actionButtons.map(({ id, text, icon }) => {
				const hideButton = false;
				// const hideButton = id === 'results' && allow_leaderboards; // TODO: Hide button when results is disabled for gym

				return !hideButton ? (
					<DashboardActionButton
						key={id}
						text={text}
						icon={icon}
						onPress={() => onActionButtonClick(id)}
						// onPress={() => onActionButtonClick(id)} // TODO: use this once screens are implemented
					/>
				) : null;
			}),
		[actionButtons],
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

	const renderPresetFilters = (item: ClassFiltersDataType) => {
		const isLeaderboard = item.name === 'Leaderboard';
		const onPress = isLeaderboard
			? () => onActionButtonClick('results')
			: () => onPresetFilterClick(item);

		return (
			<DashboardActionButton
				key={isLeaderboard ? 'leaderboard' : item.id}
				text={item.name}
				icon={isLeaderboard ? 'trophy' : 'calendar-alt'}
				onPress={onPress}
			/>
		);
	};

	const renderDashboardComponents = () => {
		return (
			<>
				<Row
					align="center"
					spacing="space-between"
					style={{ marginBottom: config.metrics.lg }}
				>
					<View>
						<Text bold size="xxl">
							{t('dashboard:sessions.member.greeting', {
								name: user?.user_data.first_name ?? '',
							})}
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
							<View
								style={{
									marginTop: config.metrics.lg,
									marginBottom: config.metrics.xl,
								}}
							>
								<Text
									bold
									style={{ marginBottom: config.metrics.sm }}
								>
									Attendance:
								</Text>

								<Row spacing="space-evenly">
									<View
										style={[
											layout.flex_1,
											styles.attendanceContainer,
										]}
									>
										<Row align="flex-end">
											<Image
												source={
													resources.icon.monthToDate
												}
												style={styles.attendanceIcon}
											/>
											<Text
												style={styles.attendanceValue}
												bold
												allowFontScaling={false}
											>
												{
													attendanceReportState?.monthToDate
												}
											</Text>
											<Text
												size="md"
												style={styles.attendanceText}
												allowFontScaling={false}
											>
												{Constant.DEVICEWIDTH < 365
													? 'month'
													: 'this month'}
											</Text>
										</Row>
									</View>

									<View
										style={[
											layout.flex_1,
											styles.attendanceContainer,
										]}
									>
										<Row align="flex-end">
											<Image
												source={
													resources.icon.yearToDate
												}
												style={styles.attendanceIcon}
											/>
											<Text
												style={styles.attendanceValue}
												bold
												allowFontScaling={false}
											>
												{
													attendanceReportState?.yearToDate
												}
											</Text>
											<Text
												size="md"
												style={styles.attendanceText}
												allowFontScaling={false}
											>
												{Constant.DEVICEWIDTH < 365
													? 'year'
													: 'this year'}
											</Text>
										</Row>
									</View>
								</Row>
							</View>
						)
					))}

				{upcomingSessionsIsLoading && isEmpty(upcomingSessionsState) ? (
					<>
						<Spacer size="md" />
						<SkeletonView height={66} width="100%" />
						<View style={styles.viewMoreButton}>
							<SkeletonView height={17.2} width="40%" />
						</View>
					</>
				) : (
					upcomingSessionsState.length > 0 && (
						<>
							<Spacer size="md" />
							<View style={styles.bookedSessionsContainer}>
								{upcomingSessionsState // show only 1
									.slice(0, 1)
									.map(({ ...rest }, i) => (
										<BookedSessionCard key={i} {...rest} />
									))}
							</View>

							{upcomingSessionsState.length > 1 ? (
								<TouchableOpacity
									style={styles.viewMoreButton}
									onPress={() => navigate('Bookings')}
								>
									<Text bold color="info">
										{t('dashboard:sessions.member.viewAll')}
									</Text>
								</TouchableOpacity>
							) : (
								<View
									style={[
										styles.viewMoreButton,
										styles.viewMorePlaceholder,
									]}
								/>
							)}
						</>
					)
				)}

				{!presetFiltersIsLoaded && isEmpty(classFiltersDataState) ? (
					<>
						<Spacer size="xl" />
						<Spacer size="xl" />
						<SkeletonView height={165} width="100%" />
					</>
				) : (
					<>
						<Spacer size="xl" />
						<Row
							spacing="space-between"
							style={styles.presetFilters}
						>
							{isEmpty(classFiltersDataState) &&
								renderActionButtons}
							{classFiltersDataState.map(item =>
								renderPresetFilters(item),
							)}
						</Row>
					</>
				)}
			</>
		);
	};

	return (
		<SafeScreen>
			{/* TODO: If banner doesn't update include versioning of image to apply changes */}
			<DashboardHeader banner={gymBanner} logo={gymLogo} />

			<Spacer />

			<ScrollView
				refreshing={refreshing}
				onRefresh={onRefresh}
				style={{ marginTop: headerMarginTop }}
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
		</SafeScreen>
	);
};

const styles = StyleSheet.create({
	section: {
		paddingHorizontal: metrics.lg,
		paddingVertical: metrics.xl,
		justifyContent: 'space-between',
	},
	bookedSessionsContainer: {
		overflow: 'hidden',
		gap: 1,
		backgroundColor: fonts.colors.light,
	},
	rowButton: {
		flexDirection: 'row',
		borderTopWidth: 1,
		borderBottomWidth: 1,
		borderColor: '#F2F2F2',
		paddingHorizontal: 15,
		paddingVertical: 12,
		alignItems: 'center',
	},
	headerStyle: {
		flex: 1,
		// backgroundColor: colors.info, // apply colors using useTheme
		// height: headerHeight,
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	headerSection: {
		flex: 1,
		justifyContent: 'center',
	},
	headerIconImage: {
		height: 74,
		width: 74,
		textAlign: 'center',
		paddingTop: '3%',
		backgroundColor: 'white',
		fontSize: height / 15,
		// color: colors.darkgray, // apply colors using useTheme
	},
	headerImageBgStyle: {
		// backgroundColor: colors.lightgrey, // apply colors using useTheme
		height: height / 6,
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		padding: 12,
		position: 'relative',
	},
	headerImageContainer: {
		position: 'absolute',
		bottom: '-25%',
		left: 18,
		// borderColor: colors.lightgrey, // apply colors using useTheme
		borderWidth: 1,
	},
	noBannerHeaderImageContainer: {
		marginLeft: 5,
		marginBottom: 10,
		marginTop: 5,
		flex: 1,
	},
	noBannerHeaderImageStyle: {
		// height: headerHeight / (isAndroid ? 1.2 : 1.7),
		// width: headerHeight / (isAndroid ? 1.2 : 1.7),
	},
	noGymLogoContainer: {
		margin: 5,
		// height: headerHeight / (isAndroid ? 1.2 : 1.7),
		// width: headerHeight / (isAndroid ? 1.2 : 1.7),
		backgroundColor: 'white',
		alignItems: 'center',
		justifyContent: 'center',
		flex: 1,
	},
	headerImageStyle: {
		width: 74,
		height: 74,
	},
	viewMoreButton: {
		alignItems: 'flex-end',
		backgroundColor: 'white',
		padding: 5,
	},
	viewMorePlaceholder: {
		height: 27,
	},
	presetFilters: {
		flexWrap: 'wrap',
		marginTop: config.metrics.xl,
	},
	attendanceIcon: {
		width: 25,
		height: 25,
		marginBottom: 8,
		marginRight: 8,
	},
	attendanceText: {
		paddingBottom: 5,
		marginLeft: config.metrics.sm,
	},
	attendanceContainer: {
		alignItems: 'center',
	},
	attendanceValue: { fontSize: 35 },
	switchIcon: {
		position: 'absolute',
		right: 0,
		bottom: 0,
		borderRadius: 10,
		padding: 3,
		fontSize: config.fonts.metrics.xs,
		...layout.shadowLight,
	},
});

export default Dashboard;
