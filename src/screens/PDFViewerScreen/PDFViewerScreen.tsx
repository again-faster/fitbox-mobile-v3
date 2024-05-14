import layout from '@/theme/layout';
import {
	MenuStackNavigatorProps,
	PDFViewerScreenParams,
} from '@/types/navigation';
import { useLayoutEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Pdf from 'react-native-pdf';

const PDFViewerScreen = ({ route, navigation }: MenuStackNavigatorProps) => {
	const { title, waiverUrl } = route.params as PDFViewerScreenParams;

	useLayoutEffect(() => {
		navigation.setOptions({
			title: title || 'PDF',
		});
	}, []);

	const source = {
		uri: waiverUrl,
		cache: true,
	};

	return (
		<View style={layout.flex_1}>
			<Pdf
				source={source}
				style={styles.pdfStyle}
				trustAllCerts={Platform.OS !== 'android'}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	pdfStyle: {
		width: '100%',
		height: '100%',
	},
});

export default PDFViewerScreen;
