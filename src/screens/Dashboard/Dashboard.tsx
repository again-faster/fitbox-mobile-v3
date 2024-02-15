import { Avatar, Row, ScrollView, Spacer, Text } from '@/components/atoms';
import { Loader } from '@/components/molecules';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Alert,
	Dimensions,
	ImageSourcePropType,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import DashboardActionButton from './components/DashboardActionButton';

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
const { metrics, colors } = config;

// const isAndroid = Platform.OS === 'ios';

// interface DashboardProps { }

const Dashboard = () => {
	const { t } = useTranslation(['dashboard']);
	// const headerHeight = useHeaderHeight();

	const [loading, setLoading] = useState<boolean>(true);
	const [refreshing, setRefreshing] = useState<boolean>(true);

	// const { fonts } = useTheme();

	const onRefresh = () => setTimeout(() => setRefreshing(false), 1000);

	useEffect(() => {
		setTimeout(() => {
			setRefreshing(false);
			setLoading(false);
		}, 2000);
	}, []);

	// TEMPORARY VARIABLES
	const memberSessions = [];
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

	return (
		<View style={styles.container}>
			<ScrollView refreshing={refreshing} onRefresh={onRefresh}>
				<View style={styles.section}>
					<View>
						<Row
							align="center"
							spacing={
								showSwitchBtn ? 'space-between' : 'space-around'
							}
						>
							<Text center bold size="md" color="gray800">
								{t('dashboard:sessions.member.title')}
							</Text>

							{showSwitchBtn ? (
								<TouchableOpacity onPress={onSwitchUserClick}>
									<Avatar
										source={
											avatarImage as ImageSourcePropType
										}
									/>
								</TouchableOpacity>
							) : null}
						</Row>

						<Spacer size="xl" />

						{loading && <Loader />}

						{!loading && (
							<>
								{memberSessions.length === 0 && (
									<Text
										color="mute"
										center
										style={{
											marginBottom: metrics.md,
										}}
									>
										{t('dashboard:sessions.member.empty')}
									</Text>
								)}
								{/* {memberSessions.map((session, i) => (
								<Session key={i} index={i} data={session} />
							))} */}
							</>
						)}
					</View>

					<Spacer size={30} />

					<Row spacing="space-between" style={layout.wrap}>
						{renderActionButtons}
					</Row>
				</View>
			</ScrollView>

			{/* <WhatsNewDialog /> */}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	section: {
		paddingHorizontal: metrics.lg,
		paddingVertical: metrics.xl,
		justifyContent: 'space-between',
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
		backgroundColor: colors.info,
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
		color: colors.darkgray,
	},
	headerImageBgStyle: {
		backgroundColor: colors.lightgrey,
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
		borderColor: colors.lightgrey,
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
