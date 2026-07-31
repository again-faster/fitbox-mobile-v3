import {
	ALL_MEMBER_FEATURES_DISABLED,
	ALL_MEMBER_FEATURES_ENABLED,
} from '@/services/workoutStudio/memberFeatures';
import {
	buildProgressContent,
	shouldRenderProgressScreen,
	shouldShowTodayProgressCard,
} from './progressFeatures';

describe('buildProgressContent', () => {
	it('shows only PRs when PRs are the only enabled child feature', () => {
		const content = buildProgressContent({
			...ALL_MEMBER_FEATURES_DISABLED,
			prs: true,
		});

		expect(content.links.map(link => link.route)).toEqual(['TrainingPRs']);
		expect(content.showKpis).toBe(false);
		expect(content.showRecentActivity).toBe(false);
		expect(content.needsResultQuery).toBe(false);
		expect(content.needsRMQuery).toBe(false);
		expect(content.showProgressHub).toBe(true);
	});

	it('shows KPI content and enables both queries for progress', () => {
		const content = buildProgressContent({
			...ALL_MEMBER_FEATURES_DISABLED,
			progress: true,
		});

		expect(content.links).toEqual([]);
		expect(content.showKpis).toBe(true);
		expect(content.showRecentActivity).toBe(false);
		expect(content.needsResultQuery).toBe(true);
		expect(content.needsRMQuery).toBe(true);
		expect(content.showProgressHub).toBe(true);
	});

	it('shows results and recent activity without the RM query for results', () => {
		const content = buildProgressContent({
			...ALL_MEMBER_FEATURES_DISABLED,
			results: true,
		});

		expect(content.links.map(link => link.route)).toEqual(['TrainingResults']);
		expect(content.showKpis).toBe(false);
		expect(content.showRecentActivity).toBe(true);
		expect(content.needsResultQuery).toBe(true);
		expect(content.needsRMQuery).toBe(false);
		expect(content.showProgressHub).toBe(true);
	});

	it('hides all progress content when every child feature is disabled', () => {
		expect(buildProgressContent(ALL_MEMBER_FEATURES_DISABLED)).toEqual({
			links: [],
			showKpis: false,
			showRecentActivity: false,
			needsResultQuery: false,
			needsRMQuery: false,
			showProgressHub: false,
		});
	});

	it('hides the screen policy when every child feature is disabled', () => {
		expect(shouldRenderProgressScreen(ALL_MEMBER_FEATURES_DISABLED)).toBe(
			false,
		);
		expect(
			shouldRenderProgressScreen({
				...ALL_MEMBER_FEATURES_DISABLED,
				prs: true,
			}),
		).toBe(true);
	});

	it('hides the Today progress card when every child feature is disabled', () => {
		expect(shouldShowTodayProgressCard(ALL_MEMBER_FEATURES_DISABLED)).toBe(
			false,
		);
		expect(
			shouldShowTodayProgressCard({
				...ALL_MEMBER_FEATURES_DISABLED,
				results: true,
			}),
		).toBe(true);
	});

	it('includes each enabled link in the stable navigation order', () => {
		const content = buildProgressContent(ALL_MEMBER_FEATURES_ENABLED);

		expect(content.links.map(link => link.route)).toEqual([
			'TrainingResults',
			'TrainingPRs',
			'TrainingMaxes',
			'TrainingBenchmarks',
			'TrainingWeeklyRecap',
		]);
		expect(content.showKpis).toBe(true);
		expect(content.showRecentActivity).toBe(true);
		expect(content.needsResultQuery).toBe(true);
		expect(content.needsRMQuery).toBe(true);
	});
});
