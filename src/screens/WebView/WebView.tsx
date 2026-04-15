import { HTMLView, ScrollView } from '@/components/atoms';
import { config } from '@/theme/_config';
import { ApplicationScreenProps, WebViewParams } from '@/types/navigation';
import { useEffect, useRef, useState } from 'react';
import { WebView as WV } from 'react-native-webview';

const { metrics } = config;

const WebView = ({ route }: ApplicationScreenProps) => {
	const { content, uri: initialUri } = route.params as WebViewParams;
	const [uri, setUri] = useState(initialUri);
	const triedHttpFallback = useRef(false);

	useEffect(() => {
		setUri(initialUri);
		triedHttpFallback.current = false;
	}, [initialUri]);

	if (content) {
		return (
			<ScrollView style={{ padding: metrics.rg }}>
				<HTMLView content={content} />
			</ScrollView>
		);
	}

	if (!uri) {
		return null;
	}

	const onLoadError = () => {
		if (triedHttpFallback.current) return;
		if (!/^https:\/\//i.test(uri)) return;
		triedHttpFallback.current = true;
		setUri(uri.replace(/^https:\/\//i, 'http://'));
	};

	return (
		<WV
			key={uri}
			source={{ uri }}
			onError={onLoadError}
			originWhitelist={['*']}
			domStorageEnabled
			javaScriptEnabled
		/>
	);
};

export default WebView;
