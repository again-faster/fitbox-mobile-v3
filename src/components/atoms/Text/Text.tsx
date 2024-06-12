import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ComponentProps } from 'react';
import { StyleProp, TextStyle, Text as Txt } from 'react-native';

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
	size,
	color,
	bold,
	center,
	children,
	style,
	transform,
	...rest
}: TextProps) => {
	const { fonts } = useTheme();

	let customStyle: StyleProp<TextStyle> = {
		// font size
		fontSize: config.fonts.metrics[size as FontSizeMetrics],

		// font family & weight
		...(bold ? layout.fontMontserratBold : layout.fontMontserratRegular),

		// center text
		...(center ? { textAlign: 'center' } : {}),

		// text transform
		...(transform ? { textTransform: transform } : {}),

		// compact
		...(rest.compact
			? { lineHeight: config.fonts.metrics[size as FontSizeMetrics] }
			: {}),
	};

	// font color
	if (fonts[color as FontColors]) {
		customStyle = { ...customStyle, ...fonts[color as FontColors] };
	} else {
		customStyle.color = config.fonts.colors[color as FontColors];
	}

	return (
		<Txt
			{...rest}
			style={{
				...customStyle,
				...(style as TextStyle),
			}}
		>
			{children}
		</Txt>
	);
};

Text.defaultProps = {
	size: 'rg',
	color: 'gray800',
	bold: false,
	center: false,
	compact: false,
	transform: undefined,
};

export type { FontColors, FontSizeMetrics };
export default Text;
