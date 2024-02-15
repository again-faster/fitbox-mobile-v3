import { config } from '@/theme/_config';
import generateConfig from '@/theme/ThemeProvider/generateConfig';

import type { Theme as NavigationTheme } from '@react-navigation/native';
import type { AllPartial } from './common';

export type Variant = keyof typeof config.variants | 'default';

export type ThemeState = {
	variant: Variant;
};

export type FulfilledThemeConfiguration = {
	readonly colors: Record<string, string>;
	readonly metrics: Record<string, number>;
	readonly backgrounds: Record<string, string>;
	readonly navigationColors: NavigationTheme['colors'];

	gutters: readonly number[];
	fonts: {
		readonly metrics: Record<string, number>;
		readonly colors: Record<string, string>;
		sizes: readonly number[];
	};

	borders: {
		widths: readonly number[];
		radius: readonly number[];
		readonly colors: Record<string, string>;
	};
};

export type VariantThemeConfiguration = {
	readonly colors: FulfilledThemeConfiguration['colors'];
	readonly metrics: FulfilledThemeConfiguration['metrics'];
	readonly backgrounds: FulfilledThemeConfiguration['backgrounds'];
	readonly navigationColors: Partial<NavigationTheme['colors']>;

	fonts: {
		readonly metrics: FulfilledThemeConfiguration['fonts']['metrics'];
		readonly colors: FulfilledThemeConfiguration['fonts']['colors'];
	};

	borders: {
		readonly colors: FulfilledThemeConfiguration['borders']['colors'];
	};
};

export type ThemeConfiguration = FulfilledThemeConfiguration & {
	variants: {
		[key: PropertyKey]: AllPartial<VariantThemeConfiguration>;
	};
};

export type UnionConfiguration = ReturnType<typeof generateConfig>;
