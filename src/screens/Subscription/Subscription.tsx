import { HR, Row, ScrollView, Spacer, Text } from '@/components/atoms';
import {
	getSubscriptionInfo,
	toggleEmailNotifications,
} from '@/services/subscription';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { GetSubscriptionInfoType } from '@/types/schemas/response';
import { TransactionsType } from '@/types/schemas/subscription';
import { Say } from '@/utils';
import { isEmpty } from 'lodash';
import moment from 'moment';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { Switch } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome5';
import SubscriptionList from './components/SubscriptionList';

const Subscription = () => {
	// states
	const [data, setData] = useState<GetSubscriptionInfoType>();
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isToggleLoading, setIsToggleLoading] = useState<boolean>(false);
	const [toggledSections, setToggledSections] = useState<string[]>([]);

	useEffect(() => {
		void (async () => {
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
		})();
	}, []);

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
			<Row
				spacing="space-between"
				style={styles.transactionRowStyle}
				key={index}
			>
				<Text size="md" color="darkgray" center style={layout.flex_1}>
					{moment(item.created_at).format('DD/MM/YY')}
				</Text>
				<Text
					size="md"
					color="darkgray"
					style={styles.transactionNameTextStyle}
				>
					{item.name}
				</Text>
				<Text size="md" color="darkgray" center style={layout.flex_1}>
					${(item.amount / 100).toFixed(2)}
				</Text>
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
		const paddingHorizontal = id === 'transactions' ? 33 : 0;
		const marginHorizontal = id === 'transactions' ? 33 : 0;
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
		<ScrollView contentContainerStyle={{ padding: config.metrics.md }}>
			<Spacer size="sm" />
			<Text size="md" center bold color="darkgray">
				Your Membership Details
			</Text>
			<HR thickness={1} color="#F2F2F2" />

			<View style={styles.viewStyle}>
				<Row spacing="space-between">
					<Row>
						{isToggleLoading && (
							<ActivityIndicator
								style={styles.toggleLoadingStyle}
							/>
						)}
						<Text size="md" color="darkgray">
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

			{renderCollapsibleSubscriptions(
				'transactions',
				'Your last 10 transactions',
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	addSubscriptionButtonLabelStyle: {
		fontSize: config.metrics.md,
		textTransform: 'capitalize',
	},
	transactionRowStyle: {
		borderBottomWidth: 1,
		borderColor: '#F2F2F2',
		marginBottom: 5,
		paddingBottom: 5,
	},
	transactionNameTextStyle: {
		flex: 3,
		marginLeft: 25,
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
		paddingHorizontal: 33,
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
});

export default Subscription;
