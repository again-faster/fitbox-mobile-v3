/* eslint-disable no-console */
import useAuth from '@/auth/hooks/useAuth';
import { SafeScreen } from '@/components/template';
import { config } from '@/theme/_config';
import { ApplicationScreenProps, ShopParams } from '@/types/navigation';
import { MobilePayStartSchema } from '@/types/schemas/payment';
import { Constant } from '@/utils';
import useStore from '@/zustand/Store';
import {
	initPaymentSheet,
	presentPaymentSheet,
} from '@stripe/stripe-react-native';
import moment from 'moment';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Linking,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import WebView from 'react-native-webview';

const Shop = ({ navigation, route }: ApplicationScreenProps) => {
	const ref = useRef<WebView>(null);
	const shopUrl = useStore(state => state.shopUrl);
	const { user, getApiUrl } = useAuth();
	const {
		storeSignature,
		storeSignatureExpiry,
		teamId,
		customerId,
		countryCode,
		setState,
	} = useStore(state => ({
		storeSignature: state.storeSignature,
		storeSignatureExpiry: state.storeSignatureExpiry,
		teamId: state.teamId,
		customerId: state.stripeCustomerId,
		countryCode: state.countryCode,
		setState: state.setAppState,
	}));
	const { orderKey } = (route.params as ShopParams) || {};
	const currentApi = getApiUrl();

	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [hasTriggeredPay, setHasTriggeredPay] = useState(false);
	const [canGoBack, setCanGoBack] = useState(false);
	const [showBackButton, setShowBackButton] = useState(false);

	const storeUrl = useMemo(() => {
		return `${shopUrl}?fb_email=${user?.user_data.email}&fb_first=${user?.user_data.first_name}&fb_last=${user?.user_data.last_name}&fb_sig=${storeSignature}&fb_expiry=${storeSignatureExpiry}&fb_gym=${teamId}`;
	}, [shopUrl, user, storeSignature, storeSignatureExpiry, teamId]);

	const getHostname = (url: string | undefined) => {
		return url?.replace(/^https?:\/\//, '').split('/')[0] || '';
	};
	const shopDomain = getHostname(shopUrl);

	const renderBackButton = () => (
		<TouchableOpacity
			onPress={() => {
				if (canGoBack) {
					ref.current?.goBack();
				} else {
					const cleanUrl = shopUrl.split('?')[0]; // remove existing query params
					setState('shopUrl', `${cleanUrl}?v=${moment().unix()}`);
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

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => null,
			headerLeft: showBackButton ? renderBackButton : undefined,
			title: 'Gym Shop',
		});
	}, [showBackButton, canGoBack]);

	useEffect(() => {
		ref.current?.reload();
	}, [storeUrl]);

	useEffect(() => {
		if (orderKey && !hasTriggeredPay) {
			setIsLoading(true);
			setHasTriggeredPay(true);
			void startMobilePay(orderKey);
		}
	}, [orderKey, hasTriggeredPay]);

	useEffect(() => {
		return () => {
			setHasTriggeredPay(false);
		};
	}, []);

	useEffect(() => {
		setHasTriggeredPay(false);
	}, [orderKey]);

	function cleanShopUrl(url: string) {
		const idx = url.indexOf('/shop/');
		if (idx === -1) return url; // fallback

		return `${url.substring(0, idx)}/`;
	}

	const startMobilePay = async (orderkey: string) => {
		try {
			const ts = Date.now();
			const baseUrl = cleanShopUrl(shopUrl);
			const mobilePayUrl = `${baseUrl}wp-json/fitbox/v1/mobile-pay/start?order_key=${orderkey}&customer_id=${customerId}&_ts=${ts}`;

			// console.log('Calling: ', mobilePayUrl);

			const response = await fetch(mobilePayUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			const data = await response.json();
			const parsedData = MobilePayStartSchema.parse(data);

			const initResponse = await initPaymentSheet({
				merchantDisplayName: 'fitbox',
				customerId: parsedData.customer_id,
				customerEphemeralKeySecret:
					parsedData.customer_ephemeral_key_secret,
				paymentIntentClientSecret:
					parsedData.payment_intent_client_secret,
				allowsDelayedPaymentMethods: true,
				applePay: {
					merchantCountryCode: countryCode,
				},
				googlePay: {
					merchantCountryCode: countryCode,
					currencyCode: parsedData.currency.toUpperCase(),
					testEnv: currentApi !== Constant.API_BASE_URLS.PROD,
				},
			});
			if (initResponse.error) {
				console.error(
					'Error initializing payment sheet:',
					initResponse.error,
				);
				setIsLoading(false);
				return;
			}
			console.log('Payment sheet initialized successfully');
			setIsLoading(false);
			const { error } = await presentPaymentSheet();

			if (error) {
				console.error('Error presenting payment sheet:', error);
				setHasTriggeredPay(false);
				navigation.setParams({ orderKey: undefined });
				ref.current?.reload();
				setIsLoading(false);
			} else {
				const confirmationUrl = `${baseUrl}checkout/order-received/${parsedData.order_id}/?key=${orderkey}`;

				ref.current?.injectJavaScript(`
				window.location.href = '${confirmationUrl}';
				true;
				`);

				navigation.setParams({ orderKey: undefined });

				console.log('shopUrl after pay:', confirmationUrl);
				console.log('mobile-pay/start result:', parsedData);
				setIsLoading(false);
			}
		} catch (err) {
			console.error('Error calling mobile pay:', err);
			setIsLoading(false);
		}
	};

	return (
		<SafeScreen>
			<WebView
				ref={ref}
				key={storeUrl}
				source={{ uri: storeUrl }}
				onShouldStartLoadWithRequest={(request: { url: string }) => {
					try {
						const { url } = request;
						// console.log('WebView navigating to:', url);

						// Always allow non-http(s) URLs to avoid crashes
						if (!url || !url.startsWith('http')) {
							return true;
						}

						const isExternal =
							!getHostname(url).startsWith(shopDomain);

						if (isExternal) {
							void Linking.openURL(url);
							return false; // MUST be boolean
						}

						return true;
					} catch (e) {
						// Fail safe: never crash WebView
						return true;
					}
				}}
				onOpenWindow={async (event: {
					nativeEvent: { targetUrl: string };
				}) => {
					// catches window.open / target="_blank"
					await Linking.openURL(event.nativeEvent.targetUrl);
				}}
				onNavigationStateChange={(navState: {
					url: string;
					canGoBack: boolean | ((prevState: boolean) => boolean);
				}) => {
					const isHome =
						cleanShopUrl(navState.url) === cleanShopUrl(shopUrl);

					if (isHome) {
						setShowBackButton(false);
					} else {
						setShowBackButton(true);
					}
					setCanGoBack(navState.canGoBack);
					// console.log('Can go back:', navState.canGoBack);
				}}
				onLoadStart={() => {
					setIsLoading(true);
				}}
				onLoadEnd={() => {
					setIsLoading(false);
				}}
			/>

			{isLoading && (
				<View style={styles.loadingView}>
					<ActivityIndicator
						size="large"
						color={config.colors.brand}
					/>
				</View>
			)}
		</SafeScreen>
	);
};

const styles = StyleSheet.create({
	loadingView: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.5)',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 999,
	},
});
export default Shop;
