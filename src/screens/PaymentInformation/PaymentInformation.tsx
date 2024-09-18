/* eslint-disable no-console */
import useAuth from '@/auth/hooks/useAuth';
import { Button, Row, Spacer, Text } from '@/components/atoms';
import { goBack } from '@/navigators/NavigationRef';
import {
	confirmSetupIntent,
	getPaymentInfo,
	getPaymentMethod,
	setupPaymentIntent,
} from '@/services/payment';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import {
	ApplicationScreenProps,
	MenuStackNavigatorProps,
	PaymentInformationModalParams,
} from '@/types/navigation';
import {
	CardDetailsType,
	PaymentMethodType,
	PaymetInfoDatatype,
} from '@/types/schemas/payment';
import { UserSchemaType } from '@/types/schemas/user';
import { Say } from '@/utils';
import Stripe from '@/utils/Stripe';
import { PaymentSheet, useStripe } from '@stripe/stripe-react-native';
import { isEmpty } from 'lodash';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type PaymentStateType = {
	isLoading: boolean;
	hasPaymentMethod: boolean;
	lastDigits: string;
	method: string;
	name: string | null | undefined;
	country: string;
};

const PaymentInformation = ({
	route,
}: MenuStackNavigatorProps | ApplicationScreenProps) => {
	const routeParams = route.params as PaymentInformationModalParams;

	const { user, updateUser } = useAuth();

	const [state, setState] = useState<PaymentStateType>({
		isLoading: true,
		hasPaymentMethod: true,
		method: '',
		lastDigits: '',
		name: '',
		country: 'AU',
	});

	const [setupPaymentId, setSetupPaymentId] = useState<string>();

	useEffect(() => {
		void getPaymentInfoFn();
	}, []);

	useEffect(() => {
		void setUpPaymentIntent();
	}, [state.name, state.country]);

	const getPaymentInfoFn = async () => {
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
				void setPaymentInfo(res.data as PaymetInfoDatatype);
			}
		} catch (e) {
			Say.err(e as string);
		}
	};

	const getCurrency = (country: string) => {
		switch (country) {
			case 'AU':
				return 'AUD';
			case 'NZ':
				return 'NZD';
			default:
				return 'AUD';
		}
	};

	// stripe
	const { initPaymentSheet, presentPaymentSheet } = useStripe();

	const setUpPaymentIntent = async () => {
		try {
			const res = await setupPaymentIntent();

			const initResponse = await initPaymentSheet({
				merchantDisplayName: 'fitbox',
				setupIntentClientSecret: res.clientSecret,
				billingDetailsCollectionConfiguration: {
					name: PaymentSheet.CollectionMode.ALWAYS,
				},

				defaultBillingDetails: {
					name: state.name || '',
					address: {
						country: state.country,
					},
				},
				allowsDelayedPaymentMethods: true,
				applePay: {
					merchantCountryCode: state.country,
				},
				googlePay: {
					merchantCountryCode: state.country,
					currencyCode: getCurrency(state.country),
					testEnv: true,
				},
			});

			setSetupPaymentId(res.id);

			if (initResponse.error) {
				Say.err('Something went wrong');
			}
		} catch (e) {
			Say.err(e as string);
		}
	};

	const openPaymentSheet = async () => {
		const { error } = await presentPaymentSheet();

		if (error) {
			console.log(error);
		} else {
			await confirmSetupIntent(setupPaymentId as string)
				.then(() => {
					void getPaymentInfoFn();

					Say.ok('Successfully Added/Updated Payment Details');

					// update session
					updateUser({
						...user?.user_data,
						has_payment_details: 1,
					} as UserSchemaType);

					if (
						routeParams.onSuccessCallback &&
						typeof routeParams.onSuccessCallback === 'function'
					) {
						goBack();

						setTimeout(() => {
							routeParams.onSuccessCallback!();
						}, 500);
					}
				})
				.catch(e => Say.err(e as string));
		}
	};

	const setPaymentInfo = async (paymentInfo: PaymetInfoDatatype) => {
		const {
			source_id: sourceId,
			method,
			payment_method_id: paymentMethodId,
		} = paymentInfo;
		let res: PaymentMethodType | CardDetailsType | null = null;

		if (!isEmpty(paymentMethodId)) {
			try {
				res = await getPaymentMethod(paymentMethodId);
			} catch (e) {
				console.log(e);
			}
		} else {
			res = await Stripe.getCardDetails(sourceId as string, method);
		}

		if (!res) {
			setState({
				...state,
				isLoading: false,
				hasPaymentMethod: false,
			});
		} else {
			setState({
				...state,
				isLoading: false,
				hasPaymentMethod: true,
				method: method === 'card' ? 'Credit Card' : 'BECS Direct Debit',
				lastDigits: res.card.last4,
				name:
					(res as PaymentMethodType)?.billing_details?.name ||
					(res as CardDetailsType)?.card.name,
				country:
					(res as PaymentMethodType)?.billing_details?.address
						.country || res.card.country,
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
				onPress={() => void openPaymentSheet()}
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
