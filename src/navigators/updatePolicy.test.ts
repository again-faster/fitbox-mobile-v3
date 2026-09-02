import { shouldCheckMinimumVersion } from './updatePolicy';

describe('shouldCheckMinimumVersion', () => {
	it('skips the production update gate in development builds', () => {
		expect(
			shouldCheckMinimumVersion(true, 'com.againfaster.fitbox', 'ios'),
		).toBe(false);
	});

	it('skips the production update gate for the iOS preview release', () => {
		expect(
			shouldCheckMinimumVersion(
				false,
				'com.againfaster.fitbox.preview',
				'ios',
			),
		).toBe(false);
	});

	it('keeps the Android preview release updateable from Google Play', () => {
		expect(
			shouldCheckMinimumVersion(
				false,
				'com.againfaster.fitbox.preview',
				'android',
			),
		).toBe(true);
	});

	it('enforces the production update gate for release builds', () => {
		expect(
			shouldCheckMinimumVersion(false, 'com.againfaster.fitbox', 'ios'),
		).toBe(true);
	});
});
