/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import useAuth from '@/auth/hooks/useAuth';
import { Row, ScrollView, Spacer, Text } from '@/components/atoms';
import { SafeScreen } from '@/components/template';
import { navigate } from '@/navigators/NavigationRef';
import { savePushToken } from '@/services/auth';
import { getGymClasses, getGymVenues } from '@/services/gym';
import { getAttendanceReport } from '@/services/leaderboards';
import { getClassFilters } from '@/services/session';
import { getBookedSessions, getUserGymInfo } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import resources from '@/theme/resources';
import { GymVenueType } from '@/types/schemas/gym';
import { AttendanceReportDataType } from '@/types/schemas/leaderboards';
import { NotificationSettingsState } from '@/types/schemas/notifications';
import { ClassFiltersDataType } from '@/types/schemas/session';
import { UserSchemaType } from '@/types/schemas/user';
import { Constant, Say } from '@/utils';
import NotificationService from '@/utils/NotificationService';
import useStore from '@/zustand/Store';
import { ClassFilter, VenueFilter } from '@/zustand/interface/SessionInterface';
import messaging, { firebase } from '@react-native-firebase/messaging';
import { useFocusEffect } from '@react-navigation/native';
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
import BookedSessionCard, {
	BookedSessionCardProps,
} from './components/BookedSessionCard';
import DashboardActionButton from './components/DashboardActionButton';
import DashboardHeader from './components/DashboardHeader';

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
	const { user } = useAuth();
	const timezone = user?.user_data.dob.timezone as string;
	// const headerHeight = useHeaderHeight();

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
	} = useStore(state => ({
		setAppState: state.setAppState,
		classFilters: state.classFilters,
		venueFilters: state.venueFilters,
		setClassFilters: state.setClassFilters,
		setVenueFilters: state.setVenueFilters,
		setHeaderTitle: state.setHeaderTitle,
		setDefaultClassFilter: state.setDefaultClassFilter,
		pushToken: state.pushToken,
		notifSettings: state.notifSettings,
	}));

	const [loading, setLoading] = useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(true);
	const [gymBanner, setGymBanner] = useState<string>('');
	const [gymLogo, setGymLogo] = useState<string>('');
	const [upcomingSessions, setUpcomingSessions] = useState<
		BookedSessionCardProps[]
	>([]);
	const [classFiltersData, setClassFiltersData] = useState<
		ClassFiltersDataType[]
	>([]);

	const [attendanceReport, setAttendanceReport] =
		useState<AttendanceReportDataType | null>(null);

	const onRefresh = () => {
		void initializeAppStates();
		void getUpcomingSessions();
		void getClassFiltersFn();
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
			setAppState('allowLeaderboards', !!gymInfo.allow_leaderboards);
			setAppState('allowComments', !!gymInfo.allow_leaderboards_comment);
			setAppState('appForceUpdate', !!gymInfo.mobile_force_update);
			setAppState('logo', gymInfo.logo);

			// set gym logo and banner
			setGymLogo(gymInfo.logo);
			setGymBanner(String(gymInfo.banner));
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
		setLoading(true);
		const memberSessions: BookedSessionCardProps[] = [];

		try {
			// let res = await RestService.getNextSessions(selectedClassIds.length ? selectedClassIds.join() : null);
			const res = await getBookedSessions();

			if (res.data && res.data.length > 0) {
				// Parse the response data
				res.data.forEach(session => {
					if (
						moment
							.tz(session.calendar_event.end_datetime, timezone)
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
					if (
						moment
							.tz(session.start, timezone)
							.add(30, 'minutes')
							.isAfter()
					) {
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
			Say.err(String(err));
		} finally {
			// sort sessions by start time
			memberSessions.sort((sessionA, sessionB) => {
				const startA = moment.tz(sessionA.startTime, timezone);
				const startB = moment.tz(sessionB.startTime, timezone);
				return startA && startB && startA > startB ? 1 : -1;
			});

			setUpcomingSessions(memberSessions);
			setLoading(false);
			setRefreshing(false);
		}

		// TODO: Do the following once other functionalities are implemented
		// 	() => {
		// 		// get switchable users
		// 		this.getSwitchableUsers();
		// 	},
		// );
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
			setTimeout(() => {
				setRefreshing(false);
				setLoading(false);
			}, 2000);

			void onFocusTasks();
		}, []),
	);

	useEffect(() => {
		void getUpcomingSessions();
	}, [notifSettings]);

	const onMountTasks = async () => {
		await initializeNotificationSettings();
		await savePushNotificationToken();
		AppState.addEventListener('change', () => {
			void checkNotificationStatus();
		});
	};

	// get filter options every gym switch
	// get attendance report
	useEffect(() => {
		void fetchFilterOptions();
		void fetchAttendanceReport();
		void onMountTasks();
		NotificationService.setGymFetcher(initializeAppStates);
	}, []);

	const fetchAttendanceReport = () => {
		try {
			getAttendanceReport(user?.user_data.user_id as number)
				.then(res => {
					if (!res.error) {
						setAttendanceReport(res.data);
					}
				})
				.catch(err => {
					Say.err(err as string);
				});
		} catch (e) {
			Say.err(e as string);
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
				Say.err(err as string);
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
				Say.err(err as string);
			});
	};

	const getClassFiltersFn = async () => {
		try {
			const res = await getClassFilters();
			setClassFiltersData(res.data);
			const defaultItem = res.data.find(item => item.isDefault === 1);
			setDefaultClassFilter(defaultItem as ClassFiltersDataType);
		} catch (e) {
			Say.err(e as string);
		}
	};

	// TEMPORARY VARIABLES
	const showSwitchBtn = true;
	// const avatarImage = 'https://avatars.githubusercontent.com/u/15073128?v=4';

	// TEMPORARY FUNCTIONS
	// const onSwitchUserClick = () => navigate('SwitchUser');
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
		setVenueFilters(updatedVenueFilter);
		setHeaderTitle(data.name);
		navigate('Calendar');
	};

	const renderPresetFilters = (item: ClassFiltersDataType) => {
		return (
			<DashboardActionButton
				key={item.id}
				text={item.name}
				icon="calendar-alt"
				onPress={() => onPresetFilterClick(item)}
			/>
		);
	};

	return (
		<SafeScreen>
			{/* TODO: If banner doesn't update include versioning of image to apply changes */}
			<DashboardHeader banner={gymBanner} logo={gymLogo} />

			<Spacer />

			<ScrollView refreshing={refreshing} onRefresh={onRefresh}>
				<View style={styles.section}>
					<View>
						<Row
							align="center"
							spacing={
								showSwitchBtn ? 'space-between' : 'space-around'
							}
							style={{ marginBottom: config.metrics.lg }}
						>
							<View>
								<Text bold size="xxl">
									{t('dashboard:sessions.member.greeting', {
										name: user?.user_data.first_name ?? '',
									})}
								</Text>
							</View>
							{/* Remove profile pic for now from Gene and Cam */}
							{/* {showSwitchBtn ? (
								<TouchableOpacity onPress={onSwitchUserClick}>
									<Avatar source={avatarImage} />
								</TouchableOpacity>
							) : null} */}
						</Row>

						{attendanceReport && (
							<View
								style={{
									marginTop: config.metrics.lg,
									marginBottom: config.metrics.xl,
								}}
							>
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
											>
												{attendanceReport?.monthToDate}
											</Text>
											<Text
												size="md"
												style={styles.attendanceText}
											>
												this month
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
											>
												{attendanceReport?.yearToDate}
											</Text>
											<Text
												size="md"
												style={styles.attendanceText}
											>
												this year
											</Text>
										</Row>
									</View>
								</Row>
							</View>
						)}

						{upcomingSessions.length > 0 && (
							<>
								<Spacer size="md" />
								<View style={styles.bookedSessionsContainer}>
									{upcomingSessions // show only 1
										.slice(0, 1)
										.map(({ ...rest }, i) => (
											<BookedSessionCard
												key={i}
												{...rest}
											/>
										))}
								</View>
							</>
						)}

						{!loading && upcomingSessions.length > 0 && (
							<TouchableOpacity
								style={styles.viewMoreButton}
								onPress={() => navigate('Bookings')}
							>
								<Text bold color="info">
									{t('dashboard:sessions.member.viewAll')}
								</Text>
							</TouchableOpacity>
						)}

						<Spacer size="xl" />

						<Row
							spacing="space-between"
							style={styles.presetFilters}
						>
							{renderActionButtons}
							{classFiltersData.map(item =>
								renderPresetFilters(item),
							)}
						</Row>

						<Spacer size="xl" />

						{/* NOTE: Hide Announcements for now */}
						{/* <Text size="lg">Announcements</Text>
						<Spacer />
						<DashboardAnnouncements /> */}
					</View>
				</View>
			</ScrollView>

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
	presetFilters: {
		flexWrap: 'wrap',
		flexDirection: 'row-reverse',
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
});

export default Dashboard;
