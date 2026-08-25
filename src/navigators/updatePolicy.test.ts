import { shouldCheckMinimumVersion } from './updatePolicy';

describe('shouldCheckMinimumVersion', () => {
	it('skips the production update gate in development builds', () => {
		expect(shouldCheckMinimumVersion(true)).toBe(false);
	});

	it('skips the production update gate for preview builds', () => {
		expect(
			shouldCheckMinimumVersion(false, 'com.againfaster.fitbox.preview'),
		).toBe(false);
	});

	it('enforces the production update gate in release builds', () => {
		expect(shouldCheckMinimumVersion(false, 'com.againfaster.fitbox')).toBe(true);
	});
});
