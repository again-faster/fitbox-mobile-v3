import layout from '@/theme/layout';
import {
	ApplicationScreenProps,
	MenuStackNavigatorProps,
	PDFViewerScreenParams,
} from '@/types/navigation';
import { useLayoutEffect } from 'react';
import { View } from 'react-native';
import WebView from 'react-native-webview';

const PDFViewerScreen = ({
	route,
	navigation,
}: MenuStackNavigatorProps | ApplicationScreenProps) => {
	const { title, waiverUrl } = route.params as PDFViewerScreenParams;

	useLayoutEffect(() => {
		navigation.setOptions({
			title: title || 'PDF',
		});
	}, []);

	const source = {
		uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
			waiverUrl,
		)}`,
	};

	return (
		<View style={layout.flex_1}>
			<WebView style={layout.flex_1} source={source} />
		</View>
	);
};

export default PDFViewerScreen;
