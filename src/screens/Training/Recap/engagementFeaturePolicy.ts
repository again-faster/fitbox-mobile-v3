import type { MemberFeatureMap } from '@/services/workoutStudio/memberFeatures';

export type EngagementMetricKey =
	| 'activeDays'
	| 'currentStreakDays'
	| 'longestStreakDays'
	| 'goalsCompleted'
	| 'badgesEarned';

export const buildEngagementMetricKeys = (
	features: MemberFeatureMap,
): EngagementMetricKey[] => {
	if (!features.digest) return [];

	return [
		'activeDays',
		...(features.streaks
			? (['currentStreakDays', 'longestStreakDays'] as const)
			: []),
		...(features.adaptive_goals ? (['goalsCompleted'] as const) : []),
		...(features.badges ? (['badgesEarned'] as const) : []),
	];
};
