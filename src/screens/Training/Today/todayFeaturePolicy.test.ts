import {
	ALL_MEMBER_FEATURES_DISABLED,
	ALL_MEMBER_FEATURES_ENABLED,
} from '@/services/workoutStudio/memberFeatures';
import {
	shouldShowTodayCoachNotes,
	shouldShowTodayCustomWorkouts,
	shouldShowTodayPRs,
	shouldShowTodayWearables,
	shouldShowTodayWellness,
	shouldAutoPromptWellness,
} from './todayFeaturePolicy';

describe('Today feature policy', () => {
	it.each([
		['wellness', shouldShowTodayWellness],
		['wearables', shouldShowTodayWearables],
		['prs', shouldShowTodayPRs],
		['coach_notes', shouldShowTodayCoachNotes],
	] as const)('shows %s only when its flag is enabled', (feature, policy) => {
		expect(policy(ALL_MEMBER_FEATURES_DISABLED)).toBe(false);
		expect(
			policy({ ...ALL_MEMBER_FEATURES_DISABLED, [feature]: true }),
		).toBe(true);
	});

	it('allows Solo users and sponsored members to build workouts', () => {
		expect(
			shouldShowTodayCustomWorkouts(
				ALL_MEMBER_FEATURES_DISABLED,
				true,
				false,
			),
		).toBe(true);
		expect(
			shouldShowTodayCustomWorkouts(
				ALL_MEMBER_FEATURES_DISABLED,
				false,
				true,
			),
		).toBe(true);
	});

	it('allows a gym-wide custom-workout flag without an individual entitlement', () => {
		expect(
			shouldShowTodayCustomWorkouts(
				{ ...ALL_MEMBER_FEATURES_DISABLED, custom_workouts: true },
				false,
				false,
			),
		).toBe(true);
	});

	it('hides custom workouts for a gym member when both access paths are off', () => {
		expect(
			shouldShowTodayCustomWorkouts(
				ALL_MEMBER_FEATURES_DISABLED,
				false,
				false,
			),
		).toBe(false);
	});

	it('keeps every Today policy enabled for a fully enabled map', () => {
		expect(shouldShowTodayWellness(ALL_MEMBER_FEATURES_ENABLED)).toBe(true);
		expect(shouldShowTodayWearables(ALL_MEMBER_FEATURES_ENABLED)).toBe(
			true,
		);
		expect(shouldShowTodayPRs(ALL_MEMBER_FEATURES_ENABLED)).toBe(true);
		expect(shouldShowTodayCoachNotes(ALL_MEMBER_FEATURES_ENABLED)).toBe(
			true,
		);
	});

	it('keeps the automatic wellness prompt eligible when today is incomplete', () => {
		expect(
			shouldAutoPromptWellness({
				wellnessEnabled: true,
				hasWellnessToday: false,
				promptsEnabled: true,
				dismissedDate: null,
				today: '2026-08-20',
			}),
		).toBe(true);
	});

	it('does not auto-prompt when wellness is complete, disabled, or dismissed', () => {
		const base = {
			wellnessEnabled: true,
			hasWellnessToday: false,
			promptsEnabled: true,
			dismissedDate: null,
			today: '2026-08-20',
		};

		expect(
			shouldAutoPromptWellness({ ...base, hasWellnessToday: true }),
		).toBe(false);
		expect(
			shouldAutoPromptWellness({ ...base, wellnessEnabled: false }),
		).toBe(false);
		expect(
			shouldAutoPromptWellness({ ...base, promptsEnabled: false }),
		).toBe(false);
		expect(
			shouldAutoPromptWellness({ ...base, dismissedDate: '2026-08-20' }),
		).toBe(false);
	});
});
