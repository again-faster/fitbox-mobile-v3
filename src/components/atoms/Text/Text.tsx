import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
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
}

const Text = ({
	size,
	color,
	bold,
	center,
	children,
	style,
	...rest
}: TextProps) => {
	const { fonts } = useTheme();

	let customStyle: StyleProp<TextStyle> = {
		// font size
		fontSize: config.fonts.metrics[size as FontSizeMetrics],

		// font weight
		...(bold ? { fontWeight: 'bold' } : {}),

		// center text
		...(center ? { textAlign: 'center' } : {}),
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
};

export type { FontColors, FontSizeMetrics };
export default Text;
