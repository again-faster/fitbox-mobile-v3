import { config } from '@/theme/_config';
import {
	normalizePlainTextUrlToHttps,
	trimTrailingNonUrlChars,
} from '@/utils/plainTextUrl';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import type { ComponentProps } from 'react';
import {
	Linking,
	Pressable,
	StyleProp,
	StyleSheet,
	TextStyle,
	View,
} from 'react-native';
import Text from '../Text/Text';

/**
 * http(s), www., or bare domains (not immediately after alnum/@ — avoids emails).
 */
const PLAIN_URL_REGEX =
	/(https?:\/\/[^\s]+)|(www\.[^\s]+)|((?<![a-zA-Z0-9@])(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;

type Segment =
	| { type: 'text'; value: string }
	| { type: 'link'; value: string };

const parseLine = (line: string): Segment[] => {
	const segments: Segment[] = [];
	let lastIndex = 0;
	const re = new RegExp(PLAIN_URL_REGEX.source, PLAIN_URL_REGEX.flags);
	let match: RegExpExecArray | null = re.exec(line);

	while (match !== null) {
		const raw = match[1] ?? match[2] ?? match[3] ?? match[0];
		const display = trimTrailingNonUrlChars(raw);
		const start = match.index;
		if (start > lastIndex) {
			segments.push({
				type: 'text',
				value: line.slice(lastIndex, start),
			});
		}
		if (display.length > 0) {
			segments.push({ type: 'link', value: display });
		}
		lastIndex = start + raw.length;
		match = re.exec(line);
	}

	if (lastIndex < line.length) {
		segments.push({ type: 'text', value: line.slice(lastIndex) });
	}

	return segments.length > 0 ? segments : [{ type: 'text', value: line }];
};

const splitPlainTextWithUrlsByLines = (text: string): Segment[][] =>
	text.split('\n').map(parseLine);

type TextProps = ComponentProps<typeof Text>;

type LinkifiedTextProps = Omit<TextProps, 'children'> & {
	children: string;
	linkStyle?: StyleProp<TextStyle>;
};

const openExternalLink = (uri: string) => {
	void Linking.openURL(uri).catch(err => Say.err(err as ICatchError));
};

/**
 * Uses `Pressable` per link so taps work inside parent `Pressable` (e.g. chat bubble long-press).
 * Opens links in the phone browser.
 */
const LinkifiedText = ({
	children,
	style,
	linkStyle,
	...textProps
}: LinkifiedTextProps) => {
	const lines = splitPlainTextWithUrlsByLines(children);
	const linkCombined = StyleSheet.flatten([styles.textStyle, linkStyle]);

	return (
		<View style={styles.wrapper}>
			{lines.map((segments, lineIndex) => (
				<View key={lineIndex} style={styles.lineRow}>
					{segments.map((seg, i) =>
						seg.type === 'text' ? (
							<Text key={i} {...textProps} style={style}>
								{seg.value}
							</Text>
						) : (
							<Pressable
								key={i}
								hitSlop={6}
								onPress={() => {
									const uri = normalizePlainTextUrlToHttps(
										seg.value,
									);
									if (!uri) return;
									openExternalLink(uri);
								}}
							>
								<Text
									{...textProps}
									style={[style, linkCombined]}
								>
									{seg.value}
								</Text>
							</Pressable>
						),
					)}
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		alignSelf: 'stretch',
	},
	lineRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
	},
	textStyle: {
		color: config.colors.brand,
		textDecorationLine: 'underline',
		textDecorationStyle: 'solid',
		textDecorationColor: config.colors.brand,
	},
});

export default LinkifiedText;
