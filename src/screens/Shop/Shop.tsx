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
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Linking,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import Icon from 'react-native-vector-icons/FontAwesome5';
import WebView from 'react-native-webview';

const Shop = ({ navigation, route }: ApplicationScreenProps) => {
	const ref = useRef<WebView>(null);
	const appVersion = DeviceInfo.getVersion();
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
		if (!shopUrl) return '';

		const params = new URLSearchParams({
			fb_email: user?.user_data.email ?? '',
			fb_first: user?.user_data.first_name ?? '',
			fb_last: user?.user_data.last_name ?? '',
			fb_sig: storeSignature ?? '',
			fb_expiry: String(storeSignatureExpiry ?? ''),
			fb_gym: String(teamId ?? ''),
		});

		const separator = shopUrl.includes('?') ? '&' : '?';

		return `${shopUrl}${separator}${params.toString()}`;
	}, [shopUrl, user, storeSignature, storeSignatureExpiry, teamId]);

	const getHostname = (url: string | undefined) => {
		return url?.replace(/^https?:\/\//, '').split('/')[0] || '';
	};
	const shopDomain = getHostname(shopUrl);

	const allowedDomains = [shopDomain, 'newpos.fitbox.iq'];

	const isAtHomeRef = useRef(true);

	const renderBackButton = () => (
		<TouchableOpacity
			onPress={() => {
				if (canGoBack) {
					ref.current?.goBack();
				} else {
					const base = shopUrl.split('?')[0];
					const timestamp = Date.now();

					setState('shopUrl', `${base}?v=${timestamp}`);
				}
			}}
			style={{
				paddingLeft: config.metrics.rg,
				paddingRight: config.metrics.md,
			}}
		>
			<Icon name="arrow-left" size={config.metrics.lg} color="white" />
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
		if (!url) return '';

		// Remove query params
		let base = url.split('?')[0];

		// Remove trailing slash
		if (base?.endsWith('/')) {
			base = base.slice(0, -1);
		}

		// Remove /shop at the end
		if (base?.endsWith('/shop')) {
			base = base.slice(0, -5); // remove 5 chars
		}

		return base;
	}

	function buildMobilePayUrl(
		url: string,
		orderkey: string,
		id: string,
		ts: number,
	) {
		const base = shopUrl.split('?')[0] || url; // fallback to url if split fails

		const normalizedBase = base.endsWith('/') ? base : `${base}/`;

		const query = [
			`order_key=${encodeURIComponent(orderkey)}`,
			`customer_id=${encodeURIComponent(id)}`,
			`_ts=${encodeURIComponent(ts)}`,
		].join('&');

		return `${normalizedBase}wp-json/fitbox/v1/mobile-pay/start?${query}`;
	}

	function buildConfirmationUrl(
		url: string,
		orderId: string,
		orderkey: string,
	) {
		const base = shopUrl.split('?')[0] || url;
		const normalizedBase = base.endsWith('/') ? base : `${base}/`;

		// Encode the key param
		const keyParam = `key=${encodeURIComponent(orderkey)}`;

		return `${normalizedBase}checkout/order-received/${encodeURIComponent(orderId)}/?${keyParam}`;
	}

	const startMobilePay = async (orderkey: string) => {
		try {
			const ts = Date.now();
			const mobilePayUrl = buildMobilePayUrl(
				shopUrl,
				orderkey,
				customerId,
				ts,
			);

			console.log('MOBILE PAY URL:', mobilePayUrl);

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
				const confirmationUrl = buildConfirmationUrl(
					shopUrl,
					String(parsedData.order_id),
					orderkey,
				);

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
				headers={{ 'x-app-version': appVersion }}
				onShouldStartLoadWithRequest={(request: { url: string }) => {
					try {
						const { url } = request;
						const hostname = getHostname(url);
						// console.log('WebView navigating to:', url);

						// Always allow non-http(s) URLs to avoid crashes
						if (!url || !url.startsWith('http')) {
							return true;
						}

						// const isExternal =
						// 	!getHostname(url).startsWith(shopDomain);
						const isExternal = !allowedDomains.some(
							domain =>
								hostname === domain ||
								hostname.endsWith(`.${domain}`),
						);

						if (isExternal && isAtHomeRef.current) {
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

					isAtHomeRef.current = isHome;

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
