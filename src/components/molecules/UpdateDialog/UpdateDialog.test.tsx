import {
	fireEvent,
	render,
	screen,
	waitFor,
} from '@testing-library/react-native';
import { Linking } from 'react-native';
import { MMKV } from 'react-native-mmkv';

import { ThemeProvider } from '@/theme';

import UpdateDialog, { getUpdateUrl } from './UpdateDialog';

jest.mock('react-native-version-check', () => ({
	getPackageName: () => 'com.againfaster.fitbox.preview',
	getPlayStoreUrl: jest.fn(() =>
		Promise.resolve(
			'https://play.google.com/store/apps/details?id=com.againfaster.fitbox.preview',
		),
	),
	getAppStoreUrl: jest.fn(() =>
		Promise.resolve('itms-beta://beta.itunes.apple.com/v1/app/6792605351'),
	),
}));

describe('UpdateDialog', () => {
	it('opens TestFlight for the iOS preview build', async () => {
		await expect(
			getUpdateUrl('ios', 'com.againfaster.fitbox.preview'),
		).resolves.toBe('itms-beta://beta.itunes.apple.com/v1/app/6792605351');
	});

	it('opens the Google Play internal test for the Android preview build', async () => {
		await expect(
			getUpdateUrl('android', 'com.againfaster.fitbox.preview'),
		).resolves.toBe(
			'https://play.google.com/apps/internaltest/4701658175453440071',
		);
	});

	it('opens the update destination when Update is pressed', async () => {
		const storage = new MMKV();
		const openURL = jest
			.spyOn(Linking, 'openURL')
			.mockResolvedValueOnce(true);

		render(
			<ThemeProvider storage={storage}>
				<UpdateDialog />
			</ThemeProvider>,
		);

		fireEvent.press(screen.getByText('Update'));

		await waitFor(() => expect(openURL).toHaveBeenCalledTimes(1));
		openURL.mockRestore();
	});
});
