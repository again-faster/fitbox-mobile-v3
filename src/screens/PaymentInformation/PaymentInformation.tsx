/* eslint-disable no-console */
import useAuth from '@/auth/hooks/useAuth';
import { Button, Row, Spacer, Text } from '@/components/atoms';
import { goBack, navigate } from '@/navigators/NavigationRef';
import {
	confirmSetupIntent,
	getPaymentInfo,
	getPaymentMethod,
	setupPaymentIntent,
} from '@/services/payment';
import { getSubscriptionInfo } from '@/services/subscription';
import { config } from '@/theme/_config';
import stripeLogo from '@/theme/assets/images/stripe-logo.png';
import layout from '@/theme/layout';
import {
	ApplicationScreenProps,
	MenuStackNavigatorProps,
	PaymentInformationParams,
} from '@/types/navigation';
import {
	CardDetailsType,
	PaymentMethodType,
	PaymetInfoDatatype,
} from '@/types/schemas/payment';
import { SubscriptionType } from '@/types/schemas/subscription';
import { UserSchemaType } from '@/types/schemas/user';
import { Constant, Say } from '@/utils';
import { PaymentGateways } from '@/utils/Enum';
import { ICatchError } from '@/utils/Say';
import Stripe from '@/utils/Stripe';
import { PaymentSheet, useStripe } from '@stripe/stripe-react-native';
import { isEmpty } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	ImageSourcePropType,
	StyleSheet,
	View,
} from 'react-native';
import SimpleToast from 'react-native-simple-toast';

type PaymentStateType = {
	isLoading: boolean;
	hasPaymentMethod: boolean;
	lastDigits: string | undefined;
	method: string;
	name: string | null | undefined;
	country: string | undefined;
};

const PaymentInformation = ({
	route,
}: MenuStackNavigatorProps | ApplicationScreenProps) => {
	const routeParams = route.params as PaymentInformationParams;
	const { user, updateUser, getApiUrl } = useAuth();
	const currentApi = getApiUrl();
	const [hasDirecDebitMethod, setHasDirecDebitMethod] =
		useState<boolean>(false);

	const [state, setState] = useState<PaymentStateType>({
		isLoading: true,
		hasPaymentMethod: true,
		method: '',
		lastDigits: '',
		name: '',
		country: 'AU',
	});

	const [setupPaymentId, setSetupPaymentId] = useState<string>();
	const [allowSkip, setAllowSkip] = useState<boolean>(true);

	useEffect(() => {
		void (async () => {
			await checkSubscription();
			await getPaymentInfoFn();
		})();
	}, []);

	useEffect(() => {
		void setUpPaymentIntent();
	}, [state.name, state.country]);

	const checkSubscription = async () => {
		try {
			const subInfoRes = await getSubscriptionInfo();

			if (subInfoRes.current.length) {
				const currentSubscription =
					subInfoRes.current.reverse()[0] as SubscriptionType;

				const { payment_gateway: paymentGateway } = currentSubscription;

				if (
					!Object.values(PaymentGateways).includes(
						paymentGateway as PaymentGateways,
					)
				) {
					setAllowSkip(false);
				}
			}
		} catch (e) {
			console.log(e);
		}
	};

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
			Say.err(e as ICatchError);
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
			const hasDirectDebit =
				res?.paymentMethodType?.includes('au_becs_debit');
			setHasDirecDebitMethod(hasDirectDebit as boolean);

			const initResponse = await initPaymentSheet({
				merchantDisplayName: 'fitbox',
				setupIntentClientSecret: res.clientSecret || '',
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
					merchantCountryCode: state.country as string,
				},
				googlePay: {
					merchantCountryCode: state.country as string,
					currencyCode: getCurrency(state.country as string),
					testEnv: currentApi !== Constant.API_BASE_URLS.PROD,
				},
			});

			if (res.id) {
				setSetupPaymentId(res.id);
			}

			if (initResponse.error) {
				Say.err('Something went wrong');
			}
		} catch (e) {
			Say.err(e as ICatchError);
		}
	};

	const handleAddPaymentClick = async () => {
		if (hasDirecDebitMethod && !Constant.IS_ANDROID) {
			await Say.okThen(
				'If you select Direct Debit, Stripe requires at least 9 digits for account numbers. Please add 0s at the front of your account number as required.',
				'Direct Debit',
			);
		}

		void openPaymentSheet();
	};

	const openPaymentSheet = async () => {
		const { error } = await presentPaymentSheet();

		if (error) {
			console.log(error);
		} else {
			await confirmSetupIntent(setupPaymentId as string)
				.then(() => {
					SimpleToast.show(
						'Successfully Added/Updated Payment Details',
						SimpleToast.SHORT,
					);

					// update session
					updateUser({
						...user?.user_data,
						has_payment_details: 1,
					} as UserSchemaType);

					if (
						routeParams?.onSuccessCallback &&
						typeof routeParams?.onSuccessCallback === 'function'
					) {
						goBack();

						setTimeout(() => {
							routeParams?.onSuccessCallback!();
						}, 500);
					}

					if (routeParams?.setup) {
						void handleSkip();
					}

					void getPaymentInfoFn();
				})
				.catch(e => {
					Say.err(e as ICatchError);
				})
				.finally(() => {
					void setUpPaymentIntent();
				});
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
				lastDigits:
					method === 'card'
						? res?.card?.last4
						: (res as PaymentMethodType)?.au_becs_debit?.last4,
				name:
					(res as PaymentMethodType)?.billing_details?.name ||
					(res as CardDetailsType)?.card.name,
				country:
					(res as PaymentMethodType)?.billing_details?.address
						.country ||
					res?.card?.country ||
					'AU',
			});
		}
	};

	const handleSkip = () => {
		const session = user?.user_data;

		if (session) {
			session.has_payment_details = 'skipped';

			updateUser(session);
			navigate('Startup');
		}
	};

	const renderPaymentInfo = useMemo(() => {
		if (routeParams?.setup) {
			return (
				<View style={{ marginBottom: config.metrics.sm }}>
					<Text size="md" center color="darkgray">
						Setup your payment details. You can change these any
						time in the future.
					</Text>
				</View>
			);
		}

		return state?.hasPaymentMethod ? (
			<>
				<Text size="md" bold center>
					Your Current Payment Details:
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
		);
	}, [
		state?.hasPaymentMethod,
		routeParams?.setup,
		state.lastDigits,
		state.method,
	]);

	const renderSkipButton = useMemo(() => {
		if (routeParams?.setup && allowSkip) {
			return <Button title="Skip" onPress={() => void handleSkip()} />;
		}

		return null;
	}, [routeParams?.setup, allowSkip]);

	return state?.isLoading ? (
		<View style={styles.loaderStyle}>
			<ActivityIndicator size="large" color={config.colors.brand} />
		</View>
	) : (
		<View style={{ ...layout.flex_1, padding: config.metrics.xl }}>
			<Image
				style={styles.logo}
				source={stripeLogo as ImageSourcePropType}
				resizeMode="contain"
			/>

			<Spacer size="md" />
			{renderPaymentInfo}

			<Spacer size="lg" />

			<Button
				title={
					routeParams?.setup ||
					(state.method === '' && state.lastDigits === '')
						? 'Add Payment Details'
						: 'Add/Update Payment Details'
				}
				style={styles.buttonColor}
				labelStyle={styles.buttonTextStyle}
				onPress={() => void handleAddPaymentClick()}
			/>

			<Spacer />

			{renderSkipButton}
		</View>
	);
};

const styles = StyleSheet.create({
	logo: {
		width: '100%',
		height: 50,
	},
	buttonTextStyle: {
		fontSize: config.metrics.md,
		color: config.backgrounds.light,
	},
	buttonColor: {
		backgroundColor: config.colors.brand,
	},
	loaderStyle: {
		flex: 1,
		justifyContent: 'center',
	},
});

export default PaymentInformation;
