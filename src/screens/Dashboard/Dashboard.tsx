import useAuth from '@/auth/hooks/useAuth';
import { Avatar, Row, ScrollView, Spacer, Text } from '@/components/atoms';
import { Loader } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { navigate } from '@/navigators/NavigationRef';
import { getBookedSessions, getUserGymInfo } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { UserSchemaType } from '@/types/schemas/user';
import { Say } from '@/utils';
import useStore from '@/zustand/Store';
import { useFocusEffect } from '@react-navigation/native';
import { isEmpty } from 'lodash';
import moment from 'moment';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Alert,
	Dimensions,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import BookedSessionCard, {
	BookedSessionCardProps,
} from './components/BookedSessionCard';
import DashboardActionButton from './components/DashboardActionButton';
import DashboardHeader from './components/DashboardHeader';

// List of action buttons to be displayed on the dashboard screen
const actionButtons = [
	{
		id: 'calendar',
		icon: 'calendar-alt',
		text: 'Gym Schedule',
	},
	{
		id: 'bookings',
		icon: 'calendar-check',
		text: 'My Bookings',
	},
	{
		id: 'wellness',
		icon: 'heart',
		text: 'Wellness',
	},
	{
		id: 'results',
		icon: 'trophy',
		text: 'Results',
	},
];

const { height } = Dimensions.get('window');
const { metrics, fonts } = config;

// const isAndroid = Platform.OS === 'ios';

// interface DashboardProps { }

const Dashboard = () => {
	const { t } = useTranslation(['dashboard']);
	const { user } = useAuth();
	// const headerHeight = useHeaderHeight();

	const { setAppState } = useStore(state => ({
		setAppState: state.setAppState,
	}));

	const [loading, setLoading] = useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(true);
	const [gymBanner, setGymBanner] = useState<string>('');
	const [gymLogo, setGymLogo] = useState<string>('');
	const [upcomingSessions, setUpcomingSessions] = useState<
		BookedSessionCardProps[]
	>([]);

	const onRefresh = () => setTimeout(() => setRefreshing(false), 1000);

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
					!moment(userData[field]?.date).isValid()
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
						moment(session.calendar_event.end_datetime)
							.add(30, 'minutes')
							.isAfter()
					) {
						memberSessions.push({
							startTime: session.calendar_event.start_datetime,
							endTime: session.calendar_event.end_datetime,
							title: session.calendar_event.comment,
							venue: session.calendar_event.venue_id
								? session.calendar_event.venue_name
								: undefined,
							isCoach: false,
						});
					}
				});
			}

			if (res.staffSessions && res.staffSessions.length > 0) {
				res.staffSessions.forEach(session => {
					if (moment(session.start).add(30, 'minutes').isAfter()) {
						memberSessions.push({
							startTime: session.start,
							endTime: session.end,
							title: session.title,
							venue: session.venue_id
								? String(session.venue_name)
								: undefined,
							isCoach: true,
						});
					}
				});
			}
		} catch (err) {
			Say.err(String(err));
		} finally {
			// sort sessions by start time
			memberSessions.sort((sessionA, sessionB) => {
				const startA = moment(sessionA.startTime);
				const startB = moment(sessionB.startTime);
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

		// 		// check if session start notification is enabled
		// 		const sessionStartEnabled =
		// 			this.props.global?.notification_settings?.settings?.session; // setting_configuration.session_start
		// 		if (member_sessions.length && sessionStartEnabled) {
		// 			// set local notifications
		// 			this.setLocalNotifications(member_sessions);
		// 		}
		// 	},
		// );
	};

	useFocusEffect(
		useCallback(() => {
			setTimeout(() => {
				setRefreshing(false);
				setLoading(false);
			}, 2000);

			void initializeAppStates();
			void getUpcomingSessions();
		}, []),
	);

	// TEMPORARY VARIABLES
	const showSwitchBtn = true;
	const avatarImage = 'https://avatars.githubusercontent.com/u/15073128?v=4';

	// TEMPORARY FUNCTIONS
	const onSwitchUserClick = () => navigate('SwitchUser');
	const onActionButtonClick = (navigation: string) => {
		Alert.alert('Coming soon', `${navigation} screen`);
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
						onPress={() => onActionButtonClick(text)}
						// onPress={() => onActionButtonClick(id)} // TODO: use this once screens are implemented
					/>
				) : null;
			}),
		[actionButtons],
	);

	const version = `?v=${moment().toISOString()}`; // WORKAROUND: Add version to the image URL to force refresh
	return (
		<SafeScreen>
			<DashboardHeader
				banner={gymBanner + version}
				logo={gymLogo ? gymLogo + version : ''}
			/>

			<Spacer />

			<ScrollView refreshing={refreshing} onRefresh={onRefresh}>
				<View style={styles.section}>
					<View>
						<Row
							align="center"
							spacing={
								showSwitchBtn ? 'space-between' : 'space-around'
							}
						>
							<View>
								<Text bold size="xxl">
									{t('dashboard:sessions.member.greeting', {
										name: user?.user_data.first_name ?? '',
									})}
								</Text>
							</View>

							{showSwitchBtn ? (
								<TouchableOpacity onPress={onSwitchUserClick}>
									<Avatar source={avatarImage} />
								</TouchableOpacity>
							) : null}
						</Row>

						<Spacer size="md" />

						{!loading && upcomingSessions.length > 0 && (
							<View style={styles.bookedSessionsContainer}>
								{upcomingSessions // show only 3
									.slice(0, 3)
									.map(({ ...rest }, i) => (
										<BookedSessionCard
											key={i}
											onPress={() => {
												Say.ok('onpress');
											}}
											{...rest}
										/>
									))}
							</View>
						)}

						{!loading && upcomingSessions.length > 3 && (
							<TouchableOpacity
								style={styles.viewMoreButton}
								onPress={() => {
									// TODO: Navigate to the My Bookings screen
								}}
							>
								<Text bold color="info">
									{t('dashboard:sessions.member.viewAll')}
								</Text>
							</TouchableOpacity>
						)}

						{loading && <Loader />}

						<Spacer size="xl" />

						<Row spacing="space-between" style={layout.wrap}>
							{renderActionButtons}
						</Row>
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
		borderRadius: metrics.rg,
		overflow: 'hidden',
		borderColor: '#F2F2F2',
		borderWidth: 1,
		gap: 1,
		backgroundColor: fonts.colors.lightgrey,
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
});

export default Dashboard;
