/* eslint-disable no-console */
import useAuth from '@/auth/hooks/useAuth';
import { Button, HR, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import { setupPaymentIntent } from '@/services/payment';
import { getSubscriptionInfo } from '@/services/subscription';
import { getUserGymInfo } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { SubscriptionType } from '@/types/schemas/subscription';
import { Say } from '@/utils';
import { PaymentGateways } from '@/utils/Enum';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import SimpleToast from 'react-native-simple-toast';
import WebView from 'react-native-webview';

type StateProps = {
	isLoading: boolean;
	showOptions: boolean;
	paymentURL: string | null;
	paymentLoading: boolean;
	pageUrl: string;
	allowSkip: boolean;
};

type QueryParamsTypes = {
	cs: string;
	pmt: string;
	uid: number;
};

const CardInfoScreen = () => {
	const { user, updateUser } = useAuth();

	const navigation = useNavigation();

	const [state, setState] = useState<StateProps>({
		isLoading: true,
		showOptions: true,
		paymentURL: null,
		paymentLoading: true,
		pageUrl: '',
		allowSkip: true,
	});
	const [paymentIsLoading, setPaymentIsLoading] = useState(true);
	useEffect(() => {
		void (async () => {
			await checkCountry();
			await checkSubscription();
			await setUpPaymentIntent();
		})();
	}, []);

	const checkCountry = async () => {
		try {
			const res = await getUserGymInfo();
			if (res.gym_info.country === 'NZ') {
				setState({ ...state, showOptions: false });
			}
		} catch (e) {
			console.log(e);
		}
	};

	const checkSubscription = async () => {
		try {
			const subInfoRes = await getSubscriptionInfo();

			if (subInfoRes.current.length) {
				const currentSubscription =
					subInfoRes.current.reverse()[0] as SubscriptionType;

				const { payment_gateway: paymentGateway } = currentSubscription;

				if (
					Object.values(PaymentGateways).includes(
						paymentGateway as PaymentGateways,
					)
				) {
					setState({ ...state, allowSkip: false });
				}
			}
		} catch (e) {
			console.log(e);
		}
	};

	const setUpPaymentIntent = async () => {
		try {
			const res = await setupPaymentIntent();

			const queryParams: QueryParamsTypes = {
				cs: res.clientSecret,
				pmt: JSON.stringify(res.paymentMethodType),
				uid: user?.user_data.user_id as number,
			};

			const paymentUrl = `${process.env.API_URL as string}?${Object.keys(
				queryParams,
			)
				.map(
					key =>
						`${key}=${queryParams[key as keyof QueryParamsTypes]}`,
				)
				.join('&')}`;

			setState({ ...state, paymentURL: paymentUrl });
		} catch (e) {
			console.log(e);
		}
	};

	const handleskip = () => {
		const session = user?.user_data;

		if (session) {
			session.has_payment_details = 'skipped';

			updateUser(session);
			// TODO: create and navigate to AuthLoading
			// navigate('AuthLoading')
		}
	};

	const onSuccessCallback = () => {
		setState({ ...state, isLoading: true });

		const session = user?.user_data;

		try {
			if (session) {
				session.has_payment_details = 'skipped';
				updateUser(session);
			}
		} catch (e) {
			console.log('error: ', e);
		}

		if (
			navigation.getState().routes[
				navigation.getState().routes.length - 1
			]?.name === 'PaymentUpdate'
		) {
			navigation.goBack();
			Say.ok('Successfully Updated');
		} else {
			SimpleToast.show('Success, please wait..', SimpleToast.SHORT);

			setTimeout(() => {
				navigate('StripeSuccess');
			});
		}
	};

	const setPaymentLoading = () => {
		setPaymentIsLoading(false);
	};

	const SCRIPT = `
	const meta = document.createElement('meta');
	meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
	meta.setAttribute('name', 'viewport');
	document.head.appendChild(meta);
	`;
	if (!state.isLoading)
		return (
			<View style={styles.loaderStyle}>
				<ActivityIndicator color={config.colors.brand} size="large" />
			</View>
		);

	const webViewStyle = {
		flex: 1,
		height: !paymentIsLoading ? '100%' : 0,
		alignSelf: 'stretch',
	};

	return (
		<>
			<View style={styles.cardInfoContainer}>
				<Text
					size="xl"
					center
					style={{ paddingHorizontal: config.metrics.md }}
				>
					{state.showOptions
						? 'Choose Your Payment Option'
						: 'Setup Payment Information'}
				</Text>
				<HR style={{ marginVertical: config.metrics.xl }} />

				{state.paymentURL && (
					<View style={layout.flex_1}>
						<WebView
							style={webViewStyle}
							scalesPageToFit
							source={{ uri: state.paymentURL }}
							injectedJavaScript={SCRIPT}
							onNavigationStateChange={({
								url,
							}: {
								url: string;
							}) => setState({ ...state, pageUrl: url })}
							onLoad={() => {
								setPaymentLoading();
								if (state.pageUrl.includes('/success')) {
									void onSuccessCallback();
								}
							}}
						/>
					</View>
				)}
				{paymentIsLoading && (
					<ActivityIndicator color={config.colors.brand} />
				)}
			</View>

			{navigation.getState().routes[
				navigation.getState().routes.length - 1
			]?.name !== 'PaymentUpdate' &&
				state.allowSkip && (
					<View style={styles.skipButtonContainer}>
						<Button
							title="Skip"
							labelStyle={styles.skipButtonStyle}
							dark
							onPress={void handleskip}
						/>
					</View>
				)}
		</>
	);
};

const styles = StyleSheet.create({
	skipButtonStyle: {
		lineHeight: 30,
	},
	skipButtonContainer: {
		justifyContent: 'flex-end',
		padding: config.metrics.lg,
	},
	cardInfoContainer: {
		paddingHorizontal: 0,
		paddingTop: config.metrics.xl,
		flex: 1,
	},
	loaderStyle: {
		flex: 1,
		justifyContent: 'center',
	},
});

export default CardInfoScreen;
