/* eslint-disable no-console */
import { Button, Row, Spacer, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import { getPaymentInfo, getPaymentMethod } from '@/services/payment';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { PaymetInfoDatatype } from '@/types/schemas/payment';
import { Say } from '@/utils';
import Stripe from '@/utils/Stripe';
import { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type PaymentStateType = {
	isLoading: boolean;
	hasPaymentMethod: boolean;
	lastDigits: string;
	method: string;
};

const PaymentInformation = () => {
	const [state, setState] = useState<PaymentStateType>({
		isLoading: true,
		hasPaymentMethod: true,
		method: '',
		lastDigits: '',
	});

	useEffect(() => {
		void (async () => {
			setState({ ...state, isLoading: true, hasPaymentMethod: true });
			try {
				const res = await getPaymentInfo();
				if (res.error) {
					Say.err(res.message);
				} else if (isEmpty(res.data)) {
					setState({
						...state,
						isLoading: false,
						hasPaymentMethod: false,
					});
				} else {
					void setPaymentInfo(res.data);
				}
			} catch (e) {
				console.log('error 45: ', e);
			}
		})();
	}, []);

	const setPaymentInfo = async (paymentInfo: PaymetInfoDatatype) => {
		const {
			source_id: sourceId,
			method,
			payment_method_id: paymentMethodId,
		} = paymentInfo;
		let res;

		if (!isEmpty(paymentMethodId)) {
			try {
				res = await getPaymentMethod(paymentMethodId);
			} catch (e) {
				console.log('error 62: ', e);
			}
		} else {
			res = await Stripe.getCardDetails(sourceId as string, method);
		}

		if (!res) {
			setState({ ...state, isLoading: false, hasPaymentMethod: false });
		} else {
			setState({
				...state,
				isLoading: false,
				hasPaymentMethod: true,
				method: method === 'card' ? 'Credit Card' : 'BECS Direct Debit',
				lastDigits: res.card.last4,
			});
		}
	};

	return state?.isLoading ? (
		<View style={styles.loaderStyle}>
			<ActivityIndicator size="large" color={config.colors.brand} />
		</View>
	) : (
		<View style={{ ...layout.flex_1, padding: config.metrics.xl }}>
			{state?.hasPaymentMethod ? (
				<>
					<Text size="md" bold center>
						Your current Payment Details:
					</Text>
					<Spacer size="lg" />
					<Row spacing="space-between">
						<Text size="md">Payment Type:</Text>
						<Text size="md">{state.method}</Text>
					</Row>
					<Spacer size="md" />
					<Row spacing="space-between">
						<Text size="md">Last 4 digits:</Text>
						<Text size="md">{state.lastDigits}</Text>
					</Row>
				</>
			) : (
				<Text size="md" bold center color="darkgray">
					You havent setup any payments yet
				</Text>
			)}
			<Spacer size="lg" />

			<Button
				title="Add/Update Payment Details"
				style={styles.buttonColor}
				labelStyle={styles.buttonTextStyle}
				onPress={() => navigate('PaymentUpdate')}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	buttonTextStyle: {
		fontWeight: 'bold',
		fontSize: config.metrics.md,
		textTransform: 'capitalize',
		color: config.backgrounds.darkgray,
	},
	buttonColor: {
		backgroundColor: '#ABEDFF',
	},
	loaderStyle: {
		flex: 1,
		justifyContent: 'center',
	},
});

export default PaymentInformation;
