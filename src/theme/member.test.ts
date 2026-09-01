import { memberTheme } from './member';

describe('memberTheme', () => {
	it('pairs the shared purple action with readable dark foreground text', () => {
		expect(memberTheme.colors.memberAction).toBe('#7775E6');
		expect(memberTheme.colors.memberActionForeground).toBe('#15151A');
		expect(memberTheme.colors.memberActionForeground).toBe(
			memberTheme.colors.ink,
		);
		expect(memberTheme.colors.success).toBe('#43A047');
	});
});
