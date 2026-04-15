import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ComponentProps } from 'react';
import { StyleProp, StyleSheet, TextStyle, Text as Txt } from 'react-native';

type FontSizeMetrics = keyof typeof config.fonts.metrics;
type FontColors = keyof typeof config.fonts.colors;

interface TextProps extends ComponentProps<typeof Txt> {
	size?: FontSizeMetrics;
	color?: FontColors;
	bold?: boolean;
	center?: boolean;
	children: React.ReactNode;
	compact?: boolean;
	transform?: 'capitalize' | 'uppercase' | 'lowercase';
}

const Text = ({
	size = 'rg',
	color = 'gray800',
	bold = false,
	center = false,
	compact = false,
	children,
	style,
	transform,
	...rest
}: TextProps) => {
	const { fonts } = useTheme();

	let customStyle: StyleProp<TextStyle> = {
		// font size
		fontSize: config.fonts.metrics[size],

		// font family & weight
		...(bold ? layout.fontMontserratBold : layout.fontMontserratRegular),

		// center text
		...(center ? { textAlign: 'center' } : {}),

		// text transform
		...(transform ? { textTransform: transform } : {}),

		// compact
		...(compact ? { lineHeight: config.fonts.metrics[size] } : {}),
	};

	// font color
	if (fonts[color]) {
		customStyle = { ...customStyle, ...fonts[color] };
	} else {
		customStyle.color = config.fonts.colors[color];
	}

	const flatStyle = StyleSheet.flatten(style) as TextStyle | undefined;

	return (
		<Txt
			{...rest}
			style={{
				...customStyle,
				...flatStyle,
			}}
			allowFontScaling={false}
		>
			{children}
		</Txt>
	);
};

export type { FontColors, FontSizeMetrics };
export default Text;
