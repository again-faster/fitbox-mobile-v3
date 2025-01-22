import { HR, Row, ScrollView, Spacer, Text } from '@/components/atoms';
import { goBack } from '@/navigators/NavigationRef';
import { getSubscriptionDetails } from '@/services/subscription';
import { config } from '@/theme/_config';
import {
	MenuStackNavigatorProps,
	SubscriptionDetailsParams,
} from '@/types/navigation';
import { SubscriptionDetailsType } from '@/types/schemas/subscription';
import { Constant } from '@/utils';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import SubscriptionRowDetail from './components/SubscriptionRowDetail';

const SubscriptionDetails = ({ route }: MenuStackNavigatorProps) => {
	// states
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [data, setData] = useState<SubscriptionDetailsType>();

	const { id, type } = route.params as SubscriptionDetailsParams;

	const { CARD, DIRECT_DEBIT, FAILED_PAYMENTS } = Constant.TRANSACTION_FEES;

	useEffect(() => {
		void (async () => {
			setIsLoading(true);
			try {
				const res = await getSubscriptionDetails(id);

				if (res) {
					setData(res[0]);
					setIsLoading(false);
				} else {
					goBack();
				}
			} catch (e) {
				// eslint-disable-next-line no-console
				console.log('error, ', e);
				setIsLoading(false);
			}
		})();
	}, []);

	let subscriptionExpiresValue;
	if (type === 'past') {
		subscriptionExpiresValue = moment(data?.cancellation_date).format(
			'DD/MM/YY',
		);
	} else if (data?.expiration_interval_unit === 'never') {
		subscriptionExpiresValue = 'Never';
	} else {
		subscriptionExpiresValue = `${data?.expiration_interval ?? ''} minimum`;
	}

	let billingFrequencyValue;
	if (data?.recurring_interval_friendly) {
		billingFrequencyValue = data?.recurring_interval_friendly;
	} else if (data?.recurring_interval_unit === 'per-billing-cycle') {
		billingFrequencyValue = 'Per Billing Cycle';
	} else if (data?.recurring_interval_unit?.toLowerCase() === 'day') {
		billingFrequencyValue = 'Daily';
	} else {
		billingFrequencyValue = `${data?.recurring_interval_unit ?? ''}ly`;
	}

	const renderTransactionFess = () => (
		<View style={{ padding: config.metrics.md }}>
			<Row
				spacing="space-between"
				style={{ marginBottom: config.metrics.sm }}
			>
				<Text size="rg">{CARD.title}</Text>
				<Text size="rg" color="darkgray">
					{CARD.value}
				</Text>
			</Row>
			<Row
				spacing="space-between"
				style={{ marginBottom: config.metrics.sm }}
			>
				<Text size="rg">{DIRECT_DEBIT.title}</Text>
				<Text size="rg" color="darkgray">
					{DIRECT_DEBIT.value}
				</Text>
			</Row>
			<Row
				spacing="space-between"
				style={{ marginBottom: config.metrics.sm }}
			>
				<Text size="rg">{FAILED_PAYMENTS.title}</Text>
				<Text size="rg" color="darkgray">
					{FAILED_PAYMENTS.value}
				</Text>
			</Row>
		</View>
	);

	return isLoading ? (
		<View style={styles.loaderStyle}>
			<ActivityIndicator size="large" color={config.colors.brand} />
		</View>
	) : (
		<ScrollView contentContainerStyle={{ padding: config.metrics.md }}>
			<Spacer size="sm" />
			<Text size="md" center bold color="darkgray">
				Membership Details:
			</Text>
			<HR thickness={1} color="#F2F2F2" />

			<View style={styles.mainDetailsStyle}>
				<SubscriptionRowDetail title="Name" value={data?.name || ''} />
				<SubscriptionRowDetail
					title="Price"
					value={`$${(Number(data?.price_in_cents) / 100).toFixed(
						2,
					)}`}
				/>
				{data?.type !== 'free' && (
					<SubscriptionRowDetail
						title="1st Billing Date"
						value={moment(data?.first_billing_date).format(
							'DD/MM/YY',
						)}
					/>
				)}
				<SubscriptionRowDetail
					title="Membership Expires"
					value={subscriptionExpiresValue}
				/>
				{data?.recurring_interval_friendly &&
					data?.recurring_interval_friendly !== '' &&
					data.expiration_interval !== 1 && (
						<SubscriptionRowDetail
							title="Billing Frequency"
							value={billingFrequencyValue}
						/>
					)}

				{data?.apply_transaction_fees_to_member === 1 && (
					<SubscriptionRowDetail
						title="Transaction fees"
						value="Added to invoice (in Stripe)"
						isClickable
						renderPopup={renderTransactionFess}
					/>
				)}
				{data?.sessions_count !== null && (
					<SubscriptionRowDetail
						title="Sessions Remaining"
						value={data?.sessions_count as number}
					/>
				)}
				{data?.sessions_limit_frequency !== null && (
					<SubscriptionRowDetail
						title="Resets"
						value={data?.sessions_limit_frequency as string}
					/>
				)}
			</View>
			{type === 'suspended' && (
				<View style={{ marginTop: config.metrics.lg }}>
					<Text size="md" center bold color="darkgray">
						Hold Details:{' '}
					</Text>

					<View style={styles.suspendedDetailsStyle}>
						<SubscriptionRowDetail
							title="Hold Start"
							value={moment(data?.suspended_begin_date).format(
								'DD/MM/YY',
							)}
						/>
						<SubscriptionRowDetail
							title="Hold End"
							value={moment(data?.suspended_until_date).format(
								'DD/MM/YY',
							)}
						/>
						<SubscriptionRowDetail
							title="Next Billing Date"
							value={moment(data?.next_payment_date).format(
								'DD/MM/YY',
							)}
						/>
					</View>
				</View>
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	loaderStyle: {
		flex: 1,
		justifyContent: 'center',
	},
	mainDetailsStyle: {
		paddingHorizontal: 15,
		paddingVertical: 8,
	},
	suspendedDetailsStyle: {
		paddingHorizontal: 15,
		paddingVertical: 8,
	},
});

export default SubscriptionDetails;
