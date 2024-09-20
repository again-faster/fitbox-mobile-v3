import { config } from '@/theme/_config';
import { Constant } from '@/utils';
import { Alert, Linking } from 'react-native';
import RenderHTML, {
	defaultSystemFonts,
	MixedStyleRecord,
} from 'react-native-render-html';

interface HTMLViewProps {
	content: string;
	isMarginBottomLess?: boolean;
}

const HTMLRenderer = ({
	content,
	isMarginBottomLess = false,
}: HTMLViewProps) => {
	const updatedString = content.replace(
		/<br\s*\/?>/g,
		'<div class="spacer"></div>',
	);

	const renderContent = `
        <html>
		<head>
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		</head>
		<body>
		${updatedString}
		</body>
        </html>`;
	const systemFonts = [
		...defaultSystemFonts,
		'Montserrat-Regular',
		'Montserrat-Bold',
		'Roboto-Regular',
		'Barlow-Light',
		'Roboto-Bold',
		'Barlow-Bold',
		'Inter-Variable',
	];

	const classsesStyles = {
		spacer: {
			marginBottom: 10,
		},
	};

	const tagsStyles = {
		body: {
			fontFamily: 'Inter-Variable',
			fontSize: config.metrics.lg,
			lineHeight: 20,
			marginBottom: isMarginBottomLess ? 0 : 25,
			marginTop: 10,
		},
		ul: {
			listStyleType: 'disc',
			marginLeft: -10,
		},
		li: {
			fontFamily: 'Inter-Variable',
			fontSize: config.metrics.lg,
			lineHeight: 20,
		},
		blockquote: {
			padding: 10,
			marginBottom: 20,
			fontSize: 17.5,
			borderLeftWidth: 5,
			borderLeftColor: '#eeeeee',
		},
		strong: {
			fontFamily: 'Inter-Variable',
			fontSize: config.metrics.lg,
			fontWeight: 'bold',
		},
	};

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
		<RenderHTML
			source={{ html: renderContent }}
			contentWidth={Constant.DEVICEWIDTH}
			tagsStyles={tagsStyles as MixedStyleRecord}
			systemFonts={systemFonts}
			classesStyles={classsesStyles}
			renderersProps={{
				a: {
					onPress: (_event, href) => {
						if (href) {
							onLinkPress(href);
						}
					},
				},
			}}
		/>
	);
};

export default HTMLRenderer;
