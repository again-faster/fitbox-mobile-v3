import { DarkTheme } from '@react-navigation/native';

import type { ThemeConfiguration } from '@/types/theme/config';

const colors = {
	brand: '#7775E6',
	brandAlt: '#5F2260',
	success: '#43A047',
	oceanGreen: '#52B788',
	danger: '#F44336',
	warning: '#FFB300',
	info: '#0085FF',
	light: '#FFFFFF',
	dark: '#546E7A',
	black: '#000000',
	mute: '#757575',
	purple: '#8E24AA',
	pink: '#E91E63',
	gray: '#EEEEEE',
	darkgray: '#595959',
	lightgrey: '#C4C4C4',
	orange: '#FFA500',
	magenta: '#FF0066',
	wellnessPrimary: '#00FF00',
} as const;

const colorsLight = {
	...colors,
	brand: colors.brand,
	red500: '#C13333',
	gray800: '#3C3C3C',
	gray400: '#4D4D4D',
	gray200: '#A1A1A1',
	gray100: '#DFDFDF',
	gray50: '#EFEFEF',
	purple500: '#44427D',
	purple100: '#E1E1EF',
} as const;

const colorsDark = {
	gray800: '#E0E0E0',
	gray400: '#969696',
	gray200: '#BABABA',
	gray100: '#000000',
	purple500: '#A6A4F0',
	purple100: '#252732',
	purple50: '#1B1A23',
} as const;

const sizes = [12, 16, 24, 32, 40, 80] as const;

const metrics = {
	xs: 3,
	sm: 5,
	rg: 10,
	md: 15,
	lg: 20,
	xl: 30,
} as const;

const fontMetrics = {
	xs: 10,
	sm: 12,
	rg: 14,
	md: 16,
	lg: 20,
	xl: 24,
	h4: 30,
	h3: 40,
	h2: 50,
	h1: 60,
} as const;

export const config = {
	colors,
	metrics,
	gutters: sizes,
	borders: {
		widths: [1, 2],
		radius: [4, 16],
		colors: colorsLight,
	},
	fonts: {
		metrics: fontMetrics,
		sizes,
		colors: colorsLight,
	},
	backgrounds: colorsLight,
	navigationColors: {
		...DarkTheme.colors,
		background: colorsLight.light,
		card: colorsLight.light,
	},
	variants: {
		dark: {
			fonts: {
				metrics: fontMetrics,
				colors: colorsDark,
			},
			backgrounds: colorsDark,
			navigationColors: {
				...DarkTheme.colors,
				background: colorsDark.purple50,
				card: colorsDark.purple50,
			},
		},
	},
} as const satisfies ThemeConfiguration;
