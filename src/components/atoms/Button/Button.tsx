import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import { ComponentProps } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Button as Btn } from 'react-native-paper';
import { FontColors } from '../Text/Text';

type ButtonTypeWithoutChildren = Omit<ComponentProps<typeof Btn>, 'children'>;
type ButtonVariant = FontColors;

interface ButtonProps extends ButtonTypeWithoutChildren {
	title: string;
	sm?: boolean;
	rounded?: boolean;
	variant?: ButtonVariant;
	fullWidth?: boolean;
}

const contrastColor = (color: string) => {
	if (!color) return 'black';

	const r = parseInt(color.substring(1, 3), 16);
	const g = parseInt(color.substring(3, 5), 16);
	const b = parseInt(color.substring(5, 7), 16);
	const yiq = (r * 299 + g * 587 + b * 114) / 1000;
	return yiq >= 140 ? 'black' : 'white';
};

const Button = ({
	title,
	sm,
	rounded,
	variant,
	mode,
	fullWidth,
	style,
	...rest
}: ButtonProps) => {
	const { fonts: colors } = useTheme();

	// is outlined
	const isOutlined = mode === 'outlined';

	const customStyle: StyleProp<ViewStyle> = {
		// outlined
		...(!isOutlined
			? { backgroundColor: colors[variant as ButtonVariant].color }
			: { borderColor: colors[variant as ButtonVariant].color }),

		// rounded
		...(!rounded ? { borderRadius: 6 } : {}),

		// fullWidth
		...(fullWidth ? { width: '100%' } : {}),

		...(style as ViewStyle),
	} as ViewStyle;

	const labelStyle: StyleProp<TextStyle> = {
		color: isOutlined
			? colors[variant as ButtonVariant].color
			: contrastColor(customStyle.backgroundColor as string), // default is white
		...(sm ? { fontSize: config.fonts.metrics.sm } : {}),
		...(rest.labelStyle as TextStyle),
	};

	return (
		<Btn {...rest} style={customStyle} labelStyle={labelStyle} mode={mode}>
			{title}
		</Btn>
	);
};

Button.defaultProps = {
	sm: false,
	rounded: false,
	variant: 'brand',
	fullWidth: false,
};

export default Button;
