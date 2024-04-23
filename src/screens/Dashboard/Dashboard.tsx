import useAuth from '@/auth/hooks/useAuth';
import { Avatar, Row, ScrollView, Spacer, Text } from '@/components/atoms';
import { Loader } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import getBookedSessions from '@/services/users/getBookedSessions';
import getUserGymInfo from '@/services/users/getUserGymInfo';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import {
	CalendarEventSchema,
	ParsedBookedSessionSchemaType,
} from '@/types/schemas/session';
import { Say } from '@/utils';
import useStore from '@/zustand/Store';
import moment from 'moment';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Alert,
	Dimensions,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { z } from 'zod';
import BookedSessionCard from './components/BookedSessionCard';
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
		ParsedBookedSessionSchemaType[]
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

			setAppState('emptyRequiredFields', gymInfo.required_profile_fields);
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
			setGymBanner(gymInfo.banner);
		}
	};

	const getUpcomingSessions = async () => {
		setLoading(true);
		let memberSessions: ParsedBookedSessionSchemaType[] = [];

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
							event_id: session.event_id,
							bookable: session.bookable,
							start_time: session.calendar_event.start_datetime,
							end_time: session.calendar_event.end_datetime,
							name: session.calendar_event.comment,
							event: session.calendar_event as z.infer<
								typeof CalendarEventSchema
							>,
							is_attend: true,
							class_id: session.class_id,
							waitlistEnabled:
								session.waitlist_info.enable_waitlist === 1,
							waitlistTime:
								session.waitlist_info.waitlist_timelimit ?? 0,
						});
					}
				});

				memberSessions.sort((sessionA, sessionB) => {
					const startA = moment(sessionA.event.start_datetime);
					const startB = moment(sessionB.event.start_datetime);
					return startA && startB && startA > startB ? 1 : -1;
				});

				// get only the first 3 upcoming sessions
				memberSessions = memberSessions.splice(0, 3);
			}
		} catch (err) {
			Say.err(String(err));
		}

		setUpcomingSessions(memberSessions);
		setLoading(false);
		setRefreshing(false);

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

	useEffect(() => {
		setTimeout(() => {
			setRefreshing(false);
			setLoading(false);
		}, 2000);

		void initializeAppStates();
		void getUpcomingSessions();
	}, []);

	// TEMPORARY VARIABLES
	const showSwitchBtn = true;
	const avatarImage = 'https://avatars.githubusercontent.com/u/15073128?v=4';

	// TEMPORARY FUNCTIONS
	const comingSoonAlert = () => Alert.alert('Oops!', 'Coming soon..');
	const onSwitchUserClick = comingSoonAlert;
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
				logo={gymLogo + version}
				onLogoPress={() => Say.ok('Open switch gym modal')}
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
								<Text size="md" color="gray400">
									{t('dashboard:sessions.member.subtitle', {
										count: upcomingSessions.length,
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
								{upcomingSessions.map((session, i) => (
									<BookedSessionCard
										key={i}
										data={session}
										onPress={() => {}}
									/>
								))}
							</View>
						)}

						<Spacer size="xl" />

						<Row spacing="space-between" style={layout.wrap}>
							{renderActionButtons}
						</Row>

						{loading && <Loader />}
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
});

export default Dashboard;
