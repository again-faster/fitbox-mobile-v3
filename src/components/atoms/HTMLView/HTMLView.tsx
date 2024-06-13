import { config } from '@/theme/_config';
import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import WebView from 'react-native-webview';
import Text from '../Text/Text';

const { metrics } = config;

interface HTMLViewProps {
	content: string;
}

const HTMLView = ({ content }: HTMLViewProps) => {
	const [loading, setLoading] = useState(true);
	const [webViewHeight, setWebViewHeight] = useState(0);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const onWebViewMessage = (event: any) =>
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		setWebViewHeight(Number(event.nativeEvent.data));

	const renderContent = `
        <html>
            <head>
                <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
                <style>
                    * {
                        -webkit-box-sizing: border-box;
                        -moz-box-sizing: border-box;
                        box-sizing: border-box;
                    }
                    body {
                        padding: 0;
                        margin: 0;
                        font-family: sans-serif;
                        font-size: ${metrics.lg}px;
                        word-wrap: break-word;
                    }
                    blockquote {
                        padding: 10px 20px;
                        margin: 0 0 20px;
                        font-size: 17.5px;
                        border-left: 5px solid #eeeeee;
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
        </html>`;

	const onLinkPress = (url: string) => {
		Alert.alert(
			'Open Link',
			'You are about to open a link in a different browser. Do you want to continue?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'OK',
					onPress: () => {
						void Linking.openURL(url);
					},
				},
			],
		);
	};

	return (
		<>
			{loading && (
				<Text center style={{ marginTop: metrics.xl }}>
					Please wait..
				</Text>
			)}

			<WebView
				onLoadEnd={() => setLoading(false)}
				style={{ height: webViewHeight }}
				source={{ html: renderContent }}
				onMessage={onWebViewMessage}
				injectedJavaScript="window.ReactNativeWebView.postMessage(document.body.scrollHeight)"
				onShouldStartLoadWithRequest={(event: { url: string }) => {
					if (!/^[data:text, about:blank]/.test(event.url)) {
						onLinkPress(event.url);
						return false;
					}

					return true;
				}}
			/>
		</>
	);
};

export default HTMLView;
