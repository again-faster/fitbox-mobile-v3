import { Button, HR, Row, ScrollView, Spacer, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import {
	getSubscriptionInfo,
	toggleEmailNotifications,
} from '@/services/subscription';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { GetSubscriptionInfoType } from '@/types/schemas/response';
import {
	SubscriptionType,
	TransactionsType,
} from '@/types/schemas/subscription';
import { Say } from '@/utils';
import { isEmpty } from 'lodash';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Switch } from 'react-native-paper';

const Subscription = () => {
	// states
	const [data, setData] = useState<GetSubscriptionInfoType>();
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isToggleLoading, setIsToggleLoading] = useState<boolean>(false);

	useEffect(() => {
		void (async () => {
			setIsLoading(true);
			try {
				const res = await getSubscriptionInfo();
				setData(res);
				setIsLoading(false);
			} catch (e) {
				console.log('error', e);
				setIsLoading(false);
			}
		})();
	}, []);

	// functions
	const goToSubscription = (id: number, type: string) => {
		navigate('SubscriptionDetails', { id, type });
	};
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

	const renderAddSubscriptionButton = () => {
		return (
			<Button
				title="Add New Subscription"
				labelStyle={styles.addSubscriptionButtonLabelStyle}
				// to do: navigate to subscription setup
			/>
		);
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

	const renderSubscriptions = (
		type: keyof GetSubscriptionInfoType,
		title: string,
	) => {
		const reversedData: SubscriptionType[] = (
			data?.[type] as SubscriptionType[]
		).reverse();

		return (
			data &&
			!isEmpty(data[type]) && (
				<View>
					<Text size="md" color="darkgray">
						{`${title}:`}
					</Text>
					<Spacer size="xs" />
					{reversedData.map(
						(item: SubscriptionType, index: number) => {
							const { name } = item;
							return (
								<Button
									key={index}
									title={name}
									dark
									mode="outlined"
									style={styles.subscriptionButtonStyle}
									labelStyle={
										styles.subscriptionButtonLabelStyle
									}
									onPress={() =>
										goToSubscription(item.id, type)
									}
								/>
							);
						},
					)}

					{type === 'current' && renderAddSubscriptionButton()}
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
				Your Subscription Details
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
				{renderSubscriptions('current', 'Current')}
				<Spacer />
				{renderSubscriptions('suspended', 'On-Hold')}
				<Spacer />
				{renderSubscriptions('past', 'Past')}
			</View>

			<Text size="md" center bold color="darkgray">
				Your last 10 Transactions:
			</Text>
			<HR thickness={1} color="#F2F2F2" />
			{data && !isEmpty(data.transactions) ? (
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
