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
	const customStyle: StyleProp<TextStyle> = {
		...(style as TextStyle),

		// font size
		fontSize: config.fonts.metrics[size as FontSizeMetrics],

		// font color
		color: config.fonts.colors[color as FontColors],

		// font weight
		...(bold ? { fontWeight: 'bold' } : {}),

		// center text
		...(center ? { textAlign: 'center' } : {}),
	};

	return (
		<Txt {...rest} style={customStyle}>
			{children}
		</Txt>
	);
};

Text.defaultProps = {
	size: 'rg',
	color: config.fonts.colors.gray800,
	bold: false,
	center: false,
};

export type { FontColors, FontSizeMetrics };
export default Text;
