import { memberTheme } from './member';
import { trainingTheme } from './training';

describe('member visual tokens', () => {
	it('defines the approved typography and control roles', () => {
		expect(memberTheme.typography.screenTitle).toEqual({
			fontFamily: 'Inter-Variable',
			fontSize: 28,
			lineHeight: 34,
			fontWeight: '800',
		});
		expect(memberTheme.controls.minTouchTarget).toBeGreaterThanOrEqual(44);
	});

	it('defines the approved spacing rhythm', () => {
		expect(memberTheme.spacing).toEqual({
			xs: 4,
			sm: 8,
			md: 12,
			lg: 16,
			xl: 24,
			xxl: 32,
		});
	});

	it('defines semantic status colors', () => {
		const semanticStatusColors = [
			'info',
			'infoSoft',
			'disabled',
			'disabledSoft',
			'successSoft',
			'warningSoft',
			'dangerSoft',
		] as const;

		semanticStatusColors.forEach(color => {
			expect(typeof memberTheme.colors[color]).toBe('string');
		});
	});

	it('derives training aliases from member tokens by reference', () => {
		expect(trainingTheme.colors.primary).toBe(memberTheme.colors.primary);
		expect(trainingTheme.colors.background).toBe(
			memberTheme.colors.background,
		);
		expect(trainingTheme.spacing).toBe(memberTheme.spacing);
		expect(trainingTheme.radius).toBe(memberTheme.radius);
		expect(trainingTheme.shadow).toBe(memberTheme.shadow);
		expect(trainingTheme.colors.primarySoft).toBe(
			memberTheme.colors.surfaceSoft,
		);
		expect(trainingTheme.colors.surfaceMuted).toBe(
			memberTheme.colors.surfaceSoft,
		);
		expect(trainingTheme.colors.successSoft).toBe(
			memberTheme.colors.successSoft,
		);
		expect(trainingTheme.colors.warningSoft).toBe(
			memberTheme.colors.warningSoft,
		);
		expect(trainingTheme.colors.dangerSoft).toBe(
			memberTheme.colors.dangerSoft,
		);
	});
});
