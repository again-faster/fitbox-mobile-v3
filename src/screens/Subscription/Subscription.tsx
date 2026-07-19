import { Button, HR, Row, ScrollView, Spacer, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import {
	getSubscriptionInfo,
	toggleEmailNotifications,
} from '@/services/subscription';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import {
	MenuStackNavigatorProps,
	SubscriptionParams,
} from '@/types/navigation';
import { GetSubscriptionInfoType } from '@/types/schemas/response';
import { TransactionsType } from '@/types/schemas/subscription';
import { Say } from '@/utils';
import { useFocusEffect } from '@react-navigation/native';
import { isEmpty } from 'lodash';
import moment from 'moment';
import { useCallback, useState } from 'react';
import {
	ActivityIndicator,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { Switch } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome5';
import SubscriptionList from './components/SubscriptionList';

const Subscription = ({ navigation, route }: MenuStackNavigatorProps) => {
	// states
	const [data, setData] = useState<GetSubscriptionInfoType>();
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isToggleLoading, setIsToggleLoading] = useState<boolean>(false);
	const [toggledSections, setToggledSections] = useState<string[]>([]);

	const params = route.params as SubscriptionParams;

	// render back button if from attendance
	const renderBackButton = () => (
		<TouchableOpacity
			onPress={() => {
				if (params.updateAttendanceProfile) {
					navigation.goBack();
					params.updateAttendanceProfile(true);
				}
			}}
		>
			<Icon
				name="chevron-left"
				size={config.metrics.lg}
				color="white"
				style={{ marginLeft: config.metrics.rg }}
			/>
		</TouchableOpacity>
	);

	if (params?.fromAttendance) {
		navigation.setOptions({
			headerLeft: renderBackButton,
		});
	}

	useFocusEffect(
		useCallback(() => {
			const loadSubscriptionInfo = async () => {
				setIsLoading(true);
				try {
					const res = await getSubscriptionInfo();
					setData(res);
					setIsLoading(false);
				} catch (e) {
					// eslint-disable-next-line no-console
					console.log('error', e);
					setIsLoading(false);
				}
			};

			void loadSubscriptionInfo();
		}, []),
	);

	// functions
	const onToggleSwitch = async () => {
		setIsToggleLoading(true);
		const toggleEmailNotificationsRes = await toggleEmailNotifications();

		if (toggleEmailNotificationsRes.error) {
			Say.err('Something went wrong');
			setIsToggleLoading(false);
		} else {
			const subscriptionRes = await getSubscriptionInfo();
			setData(subscriptionRes);
			setIsToggleLoading(false);
		}
	};

	const handleToggleSection = (id: keyof GetSubscriptionInfoType) => {
		if (toggledSections.includes(id)) {
			const removeToggledSection = toggledSections.filter(
				item => item !== id,
			);
			setToggledSections(removeToggledSection);
		} else {
			setToggledSections([...toggledSections, id]);
		}
	};

	const renderTransactions = (transactions: TransactionsType[]) => {
		return transactions.map((item: TransactionsType, index: number) => (
			<Row style={styles.transactionRowStyle} key={index}>
				<View style={layout.flex_1}>
					<Text
						size="md"
						color="darkgray"
						style={styles.alignTextLeft}
					>
						{moment(item.created_at).format('DD/MM/YY')}
					</Text>
				</View>
				<View style={styles.transactionNameContainer}>
					<Text
						size="md"
						color="darkgray"
						style={styles.alignTextLeft}
					>
						{item.name}
					</Text>
				</View>
				<View style={layout.flex_1}>
					<Text
						size="md"
						color="darkgray"
						style={styles.alignTextRight}
					>
						${(item.amount / 100).toFixed(2)}
					</Text>
				</View>
			</Row>
		));
	};

	const renderCollapsibleSubscriptionsItemList = (
		id: keyof GetSubscriptionInfoType,
	) => {
		if (id === 'transactions') {
			return data && !isEmpty(data.transactions) ? (
				renderTransactions(data.transactions)
			) : (
				<Text
					size="md"
					color="darkgray"
					center
					style={{ marginTop: config.metrics.md }}
				>
					No transactions yet
				</Text>
			);
		}
		return (
			<SubscriptionList
				type={id}
				data={data as GetSubscriptionInfoType}
			/>
		);
	};

	const renderCollapsibleSubscriptions = (
		id: keyof GetSubscriptionInfoType,
		title: string,
	) => {
		const isSectionToggled = toggledSections.includes(id);
		const paddingHorizontal = id === 'transactions' ? 15 : 0;
		const marginHorizontal = id === 'transactions' ? 15 : 0;
		return (
			data &&
			!isEmpty(data[id]) && (
				<View>
					<TouchableOpacity onPress={() => handleToggleSection(id)}>
						<Row
							spacing="space-between"
							align="center"
							style={{
								paddingHorizontal,
							}}
						>
							<Text size="md" color="darkgray">
								{title}
							</Text>
							<Icon
								name={
									isSectionToggled
										? 'chevron-up'
										: 'chevron-down'
								}
								size={config.metrics.md}
								color={config.backgrounds.darkgray}
							/>
						</Row>
					</TouchableOpacity>
					{isSectionToggled && (
						<>
							<Spacer
								size={id === 'transactions' ? 'lg' : 'xs'}
							/>

							{renderCollapsibleSubscriptionsItemList(id)}
						</>
					)}
					<HR
						thickness={1}
						color="#F2F2F2"
						style={{
							marginHorizontal,
						}}
					/>
				</View>
			)
		);
	};

	return isLoading ? (
		<View style={styles.loaderStyle}>
			<ActivityIndicator size="large" color={config.colors.brand} />
		</View>
	) : (
		<ScrollView contentContainerStyle={styles.scrollContent}>
			<View style={styles.heroCard}>
				<View style={styles.heroIcon}>
					<Icon
						name="id-card"
						size={22}
						color={memberTheme.colors.primaryDeep}
					/>
				</View>
				<View style={layout.flex_1}>
					<Text bold style={styles.heroTitle}>
						Your memberships
					</Text>
					<Text style={styles.heroText}>
						Manage your plans, billing history and invoice
						preferences.
					</Text>
				</View>
			</View>

			<View style={styles.settingsCard}>
				<Row spacing="space-between" align="center">
					<Row>
						{isToggleLoading && (
							<ActivityIndicator
								style={styles.toggleLoadingStyle}
							/>
						)}
						<Text size="md" style={styles.settingLabel}>
							Invoice notice via email
						</Text>
					</Row>
					<Switch
						color={config.colors.brand}
						onValueChange={onToggleSwitch}
						value={data?.notify_email_subscription === 1}
					/>
				</Row>

				<Spacer size="lg" />

				<Button
					title="Add New Membership"
					labelStyle={styles.addSubscriptionButtonLabelStyle}
					onPress={() =>
						navigate('SubscriptionSetup', {
							fromSubscription: true,
						})
					}
					icon="plus"
					style={styles.addButton}
				/>

				<Spacer size="lg" />
				<SubscriptionList
					type="current"
					title="Current"
					data={data as GetSubscriptionInfoType}
				/>

				<Spacer />
				<SubscriptionList
					type="suspended"
					title="On-Hold"
					data={data as GetSubscriptionInfoType}
				/>

				<Spacer />
				{renderCollapsibleSubscriptions('past', 'Past')}
				<Spacer />
			</View>

			<View style={styles.transactionsCard}>
				{renderCollapsibleSubscriptions(
					'transactions',
					'Your last 10 transactions',
				)}
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		backgroundColor: memberTheme.colors.background,
		flexGrow: 1,
		padding: memberTheme.spacing.lg,
	},
	heroCard: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.lg,
		flexDirection: 'row',
		marginBottom: memberTheme.spacing.md,
		padding: memberTheme.spacing.lg,
	},
	heroIcon: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.md,
		height: 46,
		justifyContent: 'center',
		marginRight: memberTheme.spacing.md,
		width: 46,
	},
	heroTitle: { color: memberTheme.colors.ink, fontSize: 18 },
	heroText: {
		color: memberTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 17,
		marginTop: memberTheme.spacing.xs,
	},
	settingsCard: {
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderRadius: memberTheme.radius.lg,
		borderWidth: 1,
		padding: memberTheme.spacing.lg,
	},
	settingLabel: { color: memberTheme.colors.text },
	addButton: {
		backgroundColor: memberTheme.colors.primaryDeep,
		borderRadius: memberTheme.radius.md,
	},
	transactionsCard: {
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderRadius: memberTheme.radius.lg,
		borderWidth: 1,
		marginTop: memberTheme.spacing.md,
		paddingVertical: memberTheme.spacing.md,
	},
	addSubscriptionButtonLabelStyle: {
		fontSize: config.metrics.md,
		textTransform: 'capitalize',
	},
	transactionRowStyle: {
		borderBottomWidth: 1,
		borderColor: '#F2F2F2',
		marginBottom: 5,
		paddingBottom: 5,
		marginHorizontal: 15,
	},
	transactionNameContainer: {
		flex: 2,
		paddingLeft: 20,
	},
	subscriptionButtonStyle: {
		marginBottom: 15,
		...layout.shadowLight,
	},
	subscriptionButtonLabelStyle: {
		color: config.colors.info,
		fontSize: config.metrics.md,
		textTransform: 'capitalize',
	},
	viewStyle: {
		paddingHorizontal: 15,
		paddingVertical: 8,
	},
	loaderStyle: {
		flex: 1,
		justifyContent: 'center',
	},
	toggleLoadingStyle: {
		left: -28,
		position: 'absolute',
	},
	alignTextRight: {
		textAlign: 'right',
	},
	alignTextLeft: {
		textAlign: 'left',
	},
});

export default Subscription;
