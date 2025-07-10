import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
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
	bold?: boolean;
	flex1?: boolean;
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
	sm = false,
	rounded = false,
	variant = 'brand',
	fullWidth = false,
	title,
	mode,
	style,
	bold,
	flex1 = false,
	...rest
}: ButtonProps) => {
	const { fonts: colors } = useTheme();

	// is outlined
	const isOutlined = mode === 'outlined';

	const customStyle: StyleProp<ViewStyle> = {
		// default border width
		borderWidth: 1,

		// outlined
		...(!isOutlined
			? {
					backgroundColor: colors[variant].color,
				}
			: { borderColor: colors[variant].color }),

		...(!rounded ? { borderRadius: 6 } : {}),

		// fullWidth
		...(fullWidth ? { width: '100%' } : {}),

		...(style as ViewStyle),
	} as ViewStyle;

	const labelStyle: StyleProp<TextStyle> = {
		color: isOutlined
			? colors[variant].color
			: contrastColor(customStyle.backgroundColor as string), // default is white
		...(sm ? { fontSize: config.fonts.metrics.sm } : {}),
		...(rest.labelStyle as TextStyle),
		...(bold ? layout.fontMontserratBold : layout.fontMontserratRegular),
		...(flex1 ? { flex: 1, textAlign: 'center' } : {}),
	};

	return (
		<Btn
			// Force the button to re-render, this is a bad approach, keep an eye of react-native-paper updates
			// Workaround from: https://github.com/callstack/react-native-paper/issues/4520#issuecomment-2442647417
			key={Math.random()}
			{...rest}
			style={customStyle}
			labelStyle={labelStyle}
			mode={mode}
		>
			{title}
		</Btn>
	);
};

export default Button;
