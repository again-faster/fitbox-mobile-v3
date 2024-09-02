import { config } from '@/theme/_config';
import { useEffect, useRef, useState } from 'react';
import { Alert, Linking } from 'react-native';
import WebView from 'react-native-webview';
import Text from '../Text/Text';

const { metrics } = config;

interface HTMLViewProps {
	content: string;
	index?: number | null;
}

const HTMLView = ({ content, index = null }: HTMLViewProps) => {
	const [loading, setLoading] = useState(true);
	const [webViewHeight, setWebViewHeight] = useState(0);

	const webViewRef = useRef<WebView>(null);

	// Polling the content height 3 times to ensure the height is not miscalculated
	useEffect(() => {
		let pollCount = 0;
		const MAX_POLLS = 3;

		const pollHeight = () => {
			if (webViewRef.current) {
				webViewRef.current.injectJavaScript(`
          window.ReactNativeWebView.postMessage(document.body.scrollHeight);
        `);
			}
		};

		const intervalId = setInterval(() => {
			if (pollCount < MAX_POLLS) {
				pollHeight();
				pollCount += 1;
			} else {
				clearInterval(intervalId);
			}
		}, 500);

		return () => clearInterval(intervalId);
	}, []);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const onWebViewMessage = (event: any) =>
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		setWebViewHeight(Number(event.nativeEvent.data));

	const backgroundColor =
		index !== null && index % 2 === 0 ? '#F5F5F5' : '#FFFFFF';

	const renderContent = `
        <html>
            <head>
                <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
				<link href='https://fonts.googleapis.com/css?family=Montserrat' rel='stylesheet'>
                <style>
					* {
                        -webkit-box-sizing: border-box;
                        -moz-box-sizing: border-box;
                        box-sizing: border-box;
                    }
                    body {
						margin: 0;
						padding: 0;
                        font-family: 'Montserrat', sans-serif;
                        font-size: ${config.metrics.lg}px;
                        word-wrap: break-word;
						background-color: ${backgroundColor} ;
                    }
                    blockquote {
                        padding: 10px 20px;
                        margin: 0 0 20px;
                        font-size: 17.5px;
                        border-left: 5px solid #eeeeee;
                    }
					ul {
					 	list-style-type: disc; /* Ensure bullets are visible */
            			margin-left: -10px; /* Remove default margin */
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
				ref={webViewRef}
				onLoadEnd={() => setLoading(false)}
				style={{ height: webViewHeight }}
				source={{ html: renderContent }}
				onMessage={onWebViewMessage}
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
