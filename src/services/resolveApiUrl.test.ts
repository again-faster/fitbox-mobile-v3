import { resolveApiUrl } from './resolveApiUrl';

describe('resolveApiUrl', () => {
	it('uses the persisted API URL when it is configured', () => {
		expect(
			resolveApiUrl(' https://staging.fitbox.iq ', 'https://fitbox.iq', 'https://fitbox.iq'),
		).toBe('https://staging.fitbox.iq');
	});

	it('falls back to the configured URL when persisted configuration is blank', () => {
		expect(
			resolveApiUrl('   ', 'https://dev.fitbox.iq', 'https://fitbox.iq'),
		).toBe('https://dev.fitbox.iq');
	});

	it('falls back to production when both app configuration values are blank', () => {
		expect(resolveApiUrl('', '', 'https://fitbox.iq')).toBe('https://fitbox.iq');
	});
});
