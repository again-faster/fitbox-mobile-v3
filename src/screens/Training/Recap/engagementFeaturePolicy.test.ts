import { ALL_MEMBER_FEATURES_DISABLED } from '@/services/workoutStudio/memberFeatures';
import { buildEngagementMetricKeys } from './engagementFeaturePolicy';

describe('buildEngagementMetricKeys', () => {
	it('keeps recap activity visible when digest is enabled', () => {
		expect(
			buildEngagementMetricKeys({
				...ALL_MEMBER_FEATURES_DISABLED,
				digest: true,
			}),
		).toEqual(['activeDays']);
	});

	it('shows only the engagement metrics whose member flags are enabled', () => {
		expect(
			buildEngagementMetricKeys({
				...ALL_MEMBER_FEATURES_DISABLED,
				digest: true,
				badges: true,
				adaptive_goals: true,
				streaks: true,
			}),
		).toEqual([
			'activeDays',
			'currentStreakDays',
			'longestStreakDays',
			'goalsCompleted',
			'badgesEarned',
		]);
	});

	it('does not invent a mobile challenge or marketplace surface', () => {
		expect(
			buildEngagementMetricKeys({
				...ALL_MEMBER_FEATURES_DISABLED,
				challenges: true,
				marketplace: true,
				subscriptions: true,
			}),
		).toEqual([]);
	});
});
