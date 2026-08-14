import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import {
	ApplicationScreenProps,
	OtherPaymentOptionsParams,
} from '@/types/navigation';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

const OtherPaymentOptionsScreen = ({
	navigation,
	route,
}: ApplicationScreenProps) => {
	const { paymentURL, onSuccessCallback, fromPaymentInformation } =
		route.params as OtherPaymentOptionsParams;
	const [paymentIsLoading, setPaymentIsLoading] = useState(true);
	const hasSucceeded = useRef(false);

	const SCRIPT = `
		const meta = document.createElement('meta');
		meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
		meta.setAttribute('name', 'viewport');
		document.head.appendChild(meta);
	`;

	const onSuccess = () => {
		if (hasSucceeded.current) return;
		hasSucceeded.current = true;

		setPaymentIsLoading(true);
		void onSuccessCallback?.();

		if (fromPaymentInformation) {
			navigation.navigate('PaymentInformation');
		}
	};

	return (
		<View style={styles.cardInfoContainer}>
			{paymentURL && (
				<View style={layout.flex_1}>
					<WebView
						style={styles.webView}
						scalesPageToFit
						source={{ uri: paymentURL }}
						injectedJavaScript={SCRIPT}
						cacheEnabled={false}
						cacheMode="LOAD_NO_CACHE"
						incognito
						userAgent="Mozilla/5.0 (Linux; Android 15; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36"
						onLoadStart={() => setPaymentIsLoading(true)}
						onLoad={event => {
							const { url } = event.nativeEvent;

							if (url.includes('/success')) {
								setPaymentIsLoading(true);
								void onSuccess();
								return;
							}

							setPaymentIsLoading(false);
						}}
					/>
					{paymentIsLoading && (
						<View style={styles.loaderOverlay} pointerEvents="none">
							<ActivityIndicator
								size="large"
								color={config.colors.brand}
							/>
						</View>
					)}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	cardInfoContainer: {
		paddingHorizontal: 0,
		flex: 1,
	},
	webView: {
		flex: 1,
		alignSelf: 'stretch',
	},
	loaderOverlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.6)',
	},
});

export default OtherPaymentOptionsScreen;
