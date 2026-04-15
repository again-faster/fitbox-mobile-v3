import { config } from '@/theme/_config';
import {
	normalizeForLinkPreviewRequest,
	normalizePlainTextUrlToHttps,
} from '@/utils/plainTextUrl';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import { getLinkPreview } from 'link-preview-js';
import { useEffect, useState } from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import {
	ActivityIndicator,
	Linking,
	Pressable,
	StyleSheet,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import Text from '../Text/Text';

type PreviewTypes = {
	charset: string;
	contentType: string;
	description: string;
	favicons: string[];
	images: string[];
	mediaType: string;
	siteName: string | undefined;
	title: string;
	url: string;
	videos: unknown[];
};

type LoadState =
	| { status: 'loading' }
	| { status: 'success'; preview: PreviewTypes }
	| { status: 'error' };

const openExternalLink = (uri: string) => {
	void Linking.openURL(uri).catch(err => Say.err(err as ICatchError));
};

const LinkPreview = ({
	link,
	filename,
	plainTextLeadUrl,
	plainTextFallbackStyle,
}: {
	link: string;
	filename?: string;
	/** Leading URL peeled from plain-text chat body — on fetch failure, show tappable URL only. */
	plainTextLeadUrl?: boolean;
	/** Inline link look when preview fails (e.g. bubble-aware colors from ChatMessage). */
	plainTextFallbackStyle?: StyleProp<TextStyle>;
}) => {
	const [state, setState] = useState<LoadState>({ status: 'loading' });

	useEffect(() => {
		setState({ status: 'loading' });
		const fetchUrl = normalizeForLinkPreviewRequest(link);
		const previewOpts = {
			followRedirects: 'follow' as const,
			timeout: 10_000,
		};

		const run = (url: string) =>
			getLinkPreview(url, previewOpts).then(prev =>
				setState({
					status: 'success',
					preview: prev as PreviewTypes,
				}),
			);

		void run(fetchUrl)
			.catch(() => {
				if (/^http:\/\//i.test(fetchUrl)) {
					const httpsUrl = fetchUrl.replace(
						/^http:\/\//i,
						'https://',
					);
					return run(httpsUrl);
				}
				throw new Error('preview failed');
			})
			.catch(() => {
				setState({ status: 'error' });
			});
	}, [link]);

	if (state.status === 'loading') {
		if (plainTextLeadUrl) {
			return (
				<View style={styles.leadUrlLoading}>
					<ActivityIndicator size="small" />
				</View>
			);
		}
		return (
			<View style={styles.textContainer}>
				<ActivityIndicator />
			</View>
		);
	}

	if (state.status === 'error') {
		if (plainTextLeadUrl) {
			return (
				<Pressable
					hitSlop={6}
					onPress={() =>
						openExternalLink(normalizePlainTextUrlToHttps(link))
					}
				>
					<Text
						numberOfLines={2}
						style={[
							styles.fallbackLink,
							plainTextFallbackStyle ??
								styles.fallbackLinkDefault,
						]}
					>
						{link}
					</Text>
				</Pressable>
			);
		}
		return (
			<View style={styles.textContainer}>
				<Text bold center numberOfLines={1}>
					Failed to load preview.
				</Text>
			</View>
		);
	}

	const { preview } = state;
	const openUri = preview.url || normalizePlainTextUrlToHttps(link);

	const title = filename || preview.title || preview.url || link;

	return (
		<TouchableWithoutFeedback onPress={() => openExternalLink(openUri)}>
			<View style={styles.textContainer}>
				<Text bold center numberOfLines={1}>
					{title}
				</Text>
				{preview.description !== '' && preview.description && (
					<Text size="sm" center numberOfLines={1}>
						{preview.description}
					</Text>
				)}
			</View>
		</TouchableWithoutFeedback>
	);
};

const styles = StyleSheet.create({
	textContainer: {
		backgroundColor: '#eee',
		padding: config.metrics.rg,
	},
	leadUrlLoading: {
		paddingVertical: config.metrics.xs,
		alignSelf: 'flex-start',
	},
	fallbackLink: {
		textDecorationLine: 'underline',
		textDecorationStyle: 'solid',
	},
	fallbackLinkDefault: {
		color: '#0066CC',
		textDecorationColor: '#0066CC',
	},
});

export default LinkPreview;
