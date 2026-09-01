import { render } from '@testing-library/react-native';
import { ImageBackground, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { config } from '@/theme/_config';

import DashboardHeader from './DashboardHeader';

jest.mock('@react-navigation/native', () => {
	const actualNavigation = jest.requireActual<
		typeof import('@react-navigation/native')
	>('@react-navigation/native');

	return {
		...actualNavigation,
		useNavigation: () => ({ navigate: jest.fn() }),
	};
});

describe('DashboardHeader', () => {
	it('keeps the full-width banner and logo overlap visible to dashboard content', () => {
		const rendered = render(
			<DashboardHeader
				banner="https://example.com/banner.jpg"
				logo="logo"
			/>,
		);

		expect(rendered.getByTestId('dashboard-header')).toHaveStyle({
			width: '100%',
			overflow: 'visible',
			marginBottom: 37,
		});
		const banner = rendered.UNSAFE_getByType(ImageBackground);
		const bannerStyle = StyleSheet.flatten(
			banner.props.style as StyleProp<ViewStyle>,
		);
		expect(bannerStyle).toMatchObject({
			width: '100%',
			aspectRatio: 1440 / 380,
			overflow: 'visible',
		});
		expect(rendered.getByTestId('dashboard-logo')).toHaveStyle({
			position: 'absolute',
			left: 16,
			bottom: -37,
			width: 74,
			height: 74,
			aspectRatio: 1,
			backgroundColor: 'white',
			borderRadius: 12,
		});
		expect(rendered.getByTestId('dashboard-logo-inner')).toHaveStyle({
			width: 74,
			height: 74,
			aspectRatio: 1,
			borderRadius: 12,
			overflow: 'hidden',
		});
	});

	it('uses the branded full-width fallback when no banner is provided', () => {
		const { getByTestId } = render(<DashboardHeader logo="logo" />);

		expect(getByTestId('dashboard-banner')).toHaveStyle({
			width: '100%',
			aspectRatio: 1440 / 380,
			overflow: 'visible',
			backgroundColor: config.colors.brand,
		});
	});
});
