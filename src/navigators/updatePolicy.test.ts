import { shouldCheckMinimumVersion } from './updatePolicy';

describe('shouldCheckMinimumVersion', () => {
	it('skips the production update gate in development builds', () => {
		expect(shouldCheckMinimumVersion(true, 'com.againfaster.fitbox')).toBe(
			false,
		);
	});

	it('skips the production update gate for the iOS preview release', () => {
		expect(
			shouldCheckMinimumVersion(false, 'com.againfaster.fitbox.preview'),
		).toBe(false);
	});

	it('enforces the production update gate for release builds', () => {
		expect(shouldCheckMinimumVersion(false, 'com.againfaster.fitbox')).toBe(
			true,
		);
	});
});
