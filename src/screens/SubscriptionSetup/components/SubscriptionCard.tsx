import { Row, Spacer, Text } from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { config } from '@/theme/_config';
import {
	SubscriptionType,
	UserSubscriptionProductsType,
} from '@/types/schemas/subscription';
import { Constant } from '@/utils';
import { isNull } from 'lodash';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const SubscriptionCard = ({
	data,
}: {
	data: SubscriptionType | UserSubscriptionProductsType;
}) => {
	// Prepare fees
	const monthlyFee = data.price_in_cents / 100; // monthly fee
	const setupFee =
		data.set_up_price_in_cents / 100 + data.trial_price_in_cents / 100; // setup fee + trial fee

	// Prepare frequency
	const recurringInterval =
		data.recurring_interval > 1 ? ` ${data.recurring_interval} ` : ' ';
	const billingFrequency = `Every${recurringInterval}${
		data.recurring_interval_unit
	}${data.recurring_interval > 1 ? 's' : ''}`;

	const [isTransactionFeesVisible, setTransactionFeesVisible] =
		useState<boolean>(false);

	const { CARD, DIRECT_DEBIT, FAILED_PAYMENTS } = Constant.TRANSACTION_FEES;

	return (
		<View style={styles.mainContainer}>
			<Text size="lg" center style={styles.headerStyle}>
				{data.name}
			</Text>
			{data.description ? (
				<Text
					size="sm"
					color="darkgray"
					center
					style={styles.headerStyle}
				>
					{data.description}
				</Text>
			) : null}

			<Spacer size="rg" />

			<View style={styles.detailsContainer}>
				<Row spacing="space-between">
					<Text size="rg">Initial:</Text>
					<Text size="rg" color="success">
						{setupFee > 0 ? `$${setupFee}` : 'Free'}
					</Text>
				</Row>

				{monthlyFee > 0 && data.expiration_interval !== 1 && (
					<Row
						spacing="space-between"
						style={styles.monthlyFeeContainer}
					>
						<Text size="rg">Ongoing:</Text>
						<Text size="rg" color="darkgray">
							${monthlyFee} ({billingFrequency})
						</Text>
					</Row>
				)}

				{data.apply_transaction_fees_to_member ? (
					<View style={styles.feesContainer}>
						<TouchableOpacity
							onPress={() => setTransactionFeesVisible(true)}
						>
							<Text color="brand" style={styles.feesText}>
								+ Transaction Fees
							</Text>
						</TouchableOpacity>
					</View>
				) : null}

				<Modal
					visible={isTransactionFeesVisible}
					onDismiss={() => setTransactionFeesVisible(false)}
				>
					<View style={styles.modalContainer}>
						<View style={{ padding: config.metrics.md }}>
							<Row spacing="space-between" style={styles.fees}>
								<Text size="rg">{CARD.title}</Text>
								<Text size="rg" color="darkgray">
									{CARD.value}
								</Text>
							</Row>
							<Row spacing="space-between" style={styles.fees}>
								<Text size="rg">{DIRECT_DEBIT.title}</Text>
								<Text size="rg" color="darkgray">
									{DIRECT_DEBIT.value}
								</Text>
							</Row>
							<Row spacing="space-between" style={styles.fees}>
								<Text size="rg">{FAILED_PAYMENTS.title}</Text>
								<Text size="rg" color="darkgray">
									{FAILED_PAYMENTS.value}
								</Text>
							</Row>
						</View>
					</View>
				</Modal>

				{!isNull(data.sessions_limit) &&
					!isNull(data.sessions_limit_frequency) && (
						<Row spacing="space-between">
							<Text size="rg">Session:</Text>
							<Text size="rg" color="darkgray">
								{data.sessions_limit} /{' '}
								{data.sessions_limit_frequency}
							</Text>
						</Row>
					)}
			</View>
		</View>
	);
};

export default SubscriptionCard;

const styles = StyleSheet.create({
	mainContainer: {
		borderBottomWidth: 2,
		paddingVertical: config.metrics.md,
		borderColor: config.borders.colors.darkgray,
		alignItems: 'center',
	},
	detailsContainer: {
		width: '70%',
	},
	headerStyle: {
		width: '70%',
		alignSelf: 'center',
	},
	monthlyFeeContainer: {
		alignItems: 'flex-start',
	},
	fees: {
		marginBottom: config.metrics.sm,
	},
	feesContainer: {
		alignItems: 'flex-end',
	},
	feesText: {
		textDecorationLine: 'underline',
	},
	modalContainer: {
		padding: config.metrics.sm,
		backgroundColor: 'white',
		borderRadius: config.metrics.md,
		width: '90%',
		alignSelf: 'center',
	},
});
