# Class Session Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a member-safe **Today’s session** summary beneath the existing class description, using the same exact Workout Studio class/event mapping as the Workout and Results tabs.

**Architecture:** A pure formatter converts a fully loaded `WorkoutDetail` into ordered public summary data. A small React Query hook caches the existing exact class/event resolver, and `Session.tsx` shares that resolution between the Info summary and both training navigation actions. A focused presentation component renders loading/resolved states while omitting all unavailable or unsafe states.

**Tech Stack:** React Native 0.76, TypeScript, TanStack React Query v5, Jest, Testing Library React Native, Moment.

---

## File map

- Create `src/services/workoutStudio/classSessionSummary.ts`: pure public-data formatter and summary types.
- Create `src/services/workoutStudio/classSessionSummary.test.ts`: ordering, unscored Warm-up, prescription formatting, privacy, deduplication, truncation, and empty-state tests.
- Create `src/screens/Session/hooks/useClassTrainingWorkout.ts`: cached wrapper around the existing exact mapping resolver.
- Create `src/screens/Session/hooks/useClassTrainingWorkout.test.ts`: stable cache-key and disabled-key tests.
- Create `src/screens/Session/components/TodaySessionCard.tsx`: loading/resolved/omitted card presentation.
- Create `src/screens/Session/components/TodaySessionCard.test.tsx`: presentation-state tests.
- Modify `src/screens/Session/components/index.ts`: export the new card.
- Modify `src/screens/Session/components/SessionInformationTab.tsx`: accept summary state and place the card directly after Class Description.
- Modify `src/screens/Session/Session.tsx`: construct one mapping query, load/format the exact workout, pass it to Info, and reuse the cached resolution for Workout/Results.
- Do not modify `src/services/workoutStudio/scoreable.ts` or scoring UI; the default Warm-up scoring change is a separate requirement.

### Task 1: Build the member-safe summary formatter

**Files:**
- Create: `src/services/workoutStudio/classSessionSummary.test.ts`
- Create: `src/services/workoutStudio/classSessionSummary.ts`

- [ ] **Step 1: Write the failing formatter tests**

Create `src/services/workoutStudio/classSessionSummary.test.ts` with a typed fixture and these cases:

```ts
import type { WorkoutDetail } from './types';
import { buildClassSessionSummary } from './classSessionSummary';

const workout = {
	id: 'workout-1',
	name: 'Wednesday CrossFit',
	estimated_duration_minutes: 60,
	workout_sections: [
		{
			id: 'notes',
			name: 'Coach briefing',
			position: 0,
			section_mode: 'notes',
			coach_notes: 'Staff only',
			scoring_type: 'none',
			is_scored: false,
			score_collection_mode: 'section',
			time_cap_seconds: null,
			rounds: null,
			leaderboard_enabled: false,
			leaderboard_calculation: null,
			leaderboard_sort_direction: null,
			leaderboard_score_type: null,
			aggregate_formula: null,
			aggregate_group_id: null,
			section_blocks: [],
		},
		{
			id: 'warm-up',
			name: 'Warm-up',
			position: 1,
			section_mode: 'workout',
			coach_notes: 'Do not show this',
			scoring_type: 'none',
			is_scored: false,
			score_collection_mode: 'section',
			time_cap_seconds: null,
			rounds: 3,
			leaderboard_enabled: false,
			leaderboard_calculation: null,
			leaderboard_sort_direction: null,
			leaderboard_score_type: null,
			aggregate_formula: null,
			aggregate_group_id: null,
			section_blocks: [
				{
					id: 'warm-up-block',
					label: null,
					intent: 'Athlete note',
					position: 1,
					rest_seconds: null,
					scaled_notes: 'Scaled secret',
					foundations_notes: 'Foundations secret',
					block_movements: [
						{
							id: 'run-1',
							position: 1,
							sets: 1,
							reps_scheme: null,
							weight_kg: null,
							weight_scheme: null,
							duration_seconds: null,
							distance_meters: 200,
							calories: null,
							set_scheme: null,
							advanced: { staff: 'secret' },
							notes: 'Movement note',
							movements: { id: 'run', name: 'Run' },
						},
						{
							id: 'squat-1',
							position: 2,
							sets: 1,
							reps_scheme: '10',
							weight_kg: null,
							weight_scheme: null,
							duration_seconds: null,
							distance_meters: null,
							calories: null,
							set_scheme: null,
							advanced: null,
							notes: null,
							movements: { id: 'squat', name: 'Air Squat' },
						},
					],
				},
			],
		},
		{
			id: 'strength',
			name: 'Strength',
			position: 2,
			section_mode: 'workout',
			coach_notes: null,
			scoring_type: 'weight',
			is_scored: true,
			score_collection_mode: 'section',
			time_cap_seconds: null,
			rounds: null,
			leaderboard_enabled: true,
			leaderboard_calculation: null,
			leaderboard_sort_direction: 'desc',
			leaderboard_score_type: 'weight',
			aggregate_formula: null,
			aggregate_group_id: null,
			section_blocks: [
				{
					id: 'strength-block',
					label: null,
					intent: '',
					position: 1,
					rest_seconds: null,
					scaled_notes: null,
					foundations_notes: null,
					block_movements: [
						...['Deadlift', 'Bike', 'Burpee', 'Row', 'Deadlift'].map(
							(name, index) => ({
								id: `strength-${index}`,
								position: index + 1,
								sets: index === 0 ? 5 : 1,
								reps_scheme: index === 0 ? '5' : null,
								weight_kg: index === 0 ? 100 : null,
								weight_scheme: null,
								duration_seconds: index === 1 ? 60 : null,
								distance_meters: index === 3 ? 500 : null,
								calories: index === 2 ? 12 : null,
								set_scheme: null,
								advanced: null,
								notes: null,
								movements: { id: name.toLowerCase(), name },
							}),
						),
					],
				},
			],
		},
	],
} satisfies WorkoutDetail;

describe('buildClassSessionSummary', () => {
	it('keeps section order and includes an unscored Warm-up', () => {
		const summary = buildClassSessionSummary(workout);

		expect(summary?.workoutName).toBe('Wednesday CrossFit');
		expect(summary?.sections.map(section => section.name)).toEqual([
			'Warm-up',
			'Strength',
		]);
		expect(summary?.sections[0]).toEqual({
			id: 'warm-up',
			name: 'Warm-up',
			details: ['3 rounds'],
			movements: ['200 m Run', '10 x Air Squat'],
			remainingMovementCount: 0,
		});
	});

	it('formats public prescriptions, deduplicates, and truncates per section', () => {
		const strength = buildClassSessionSummary(workout)?.sections[1];

		expect(strength).toEqual({
			id: 'strength',
			name: 'Strength',
			details: [],
			movements: [
				'5 sets · 5 x Deadlift @ 100 kg',
				'1m Bike',
				'12 cal Burpee',
			],
			remainingMovementCount: 1,
		});
	});

	it('never copies private note fields into output', () => {
		expect(JSON.stringify(buildClassSessionSummary(workout))).not.toMatch(
			/Staff only|Do not show|Athlete note|Scaled secret|Foundations secret|Movement note|secret/,
		);
	});

	it('returns null for missing, notes-only, or movement-empty workouts', () => {
		expect(buildClassSessionSummary()).toBeNull();
		expect(
			buildClassSessionSummary({
				...workout,
				workout_sections: [workout.workout_sections[0]!],
			}),
		).toBeNull();
		expect(
			buildClassSessionSummary({
				...workout,
				workout_sections: [
					{ ...workout.workout_sections[1]!, section_blocks: [] },
				],
			}),
		).toBeNull();
	});
});
```

- [ ] **Step 2: Run the formatter test and confirm the red state**

Run:

```powershell
yarn test src/services/workoutStudio/classSessionSummary.test.ts --runInBand
```

Expected: FAIL because `./classSessionSummary` does not exist.

- [ ] **Step 3: Implement the pure formatter**

Create `src/services/workoutStudio/classSessionSummary.ts`:

```ts
import type { BlockMovement, WorkoutDetail } from './types';

export type ClassSessionSummarySection = {
	id: string;
	name: string;
	details: string[];
	movements: string[];
	remainingMovementCount: number;
};

export type ClassSessionSummary = {
	workoutId: string;
	workoutName: string;
	sections: ClassSessionSummarySection[];
};

const formatDuration = (seconds: number) => {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remaining = seconds % 60;
	if (hours > 0) return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
	if (minutes > 0) return `${minutes}m${remaining > 0 ? ` ${remaining}s` : ''}`;
	return `${remaining}s`;
};

const formatMovement = (movement: BlockMovement) => {
	const name = movement.movements.name.trim();
	if (!name) return '';

	const reps = movement.reps_scheme?.trim();
	let prescription = name;
	if (reps) prescription = `${reps} x ${name}`;
	else if (movement.distance_meters != null) {
		prescription = `${movement.distance_meters} m ${name}`;
	} else if (movement.duration_seconds != null) {
		prescription = `${formatDuration(movement.duration_seconds)} ${name}`;
	} else if (movement.calories != null) {
		prescription = `${movement.calories} cal ${name}`;
	}

	if (movement.sets != null && movement.sets > 1) {
		prescription = `${movement.sets} sets · ${prescription}`;
	}
	if (movement.weight_kg != null) {
		prescription += ` @ ${movement.weight_kg} kg`;
	}
	return prescription;
};

export const buildClassSessionSummary = (
	workout?: WorkoutDetail,
	maxMovementsPerSection = 3,
): ClassSessionSummary | null => {
	if (!workout) return null;

	const sections = workout.workout_sections
		.filter(section => section.section_mode === 'workout')
		.sort((left, right) => left.position - right.position)
		.map(section => {
			const orderedMovements = section.section_blocks
				.slice()
				.sort((left, right) => left.position - right.position)
				.flatMap(block =>
					block.block_movements
						.slice()
						.sort((left, right) => left.position - right.position),
				);
			const allMovements = orderedMovements
				.filter(
					(movement, index, movements) =>
						movements.findIndex(
							candidate =>
								candidate.movements.id === movement.movements.id,
						) === index,
				)
				.map(formatMovement)
				.filter((value): value is string => value.length > 0);
			const movements = allMovements.slice(0, maxMovementsPerSection);
			const details = section.rounds ? [`${section.rounds} rounds`] : [];
			return {
				id: section.id,
				name: section.name,
				details,
				movements,
				remainingMovementCount: allMovements.length - movements.length,
			};
		})
		.filter(section => section.movements.length > 0);

	if (sections.length === 0) return null;
	return { workoutId: workout.id, workoutName: workout.name, sections };
};
```

- [ ] **Step 4: Run the formatter test and confirm green**

Run:

```powershell
yarn test src/services/workoutStudio/classSessionSummary.test.ts --runInBand
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit the formatter**

```powershell
git add src/services/workoutStudio/classSessionSummary.ts src/services/workoutStudio/classSessionSummary.test.ts
git commit -m "feat(training): format class session summaries"
```

### Task 2: Cache the exact class/event workout resolution

**Files:**
- Create: `src/screens/Session/hooks/useClassTrainingWorkout.test.ts`
- Create: `src/screens/Session/hooks/useClassTrainingWorkout.ts`

- [ ] **Step 1: Write the failing cache-key tests**

Create `src/screens/Session/hooks/useClassTrainingWorkout.test.ts`:

```ts
import { classTrainingWorkoutQueryKey } from './useClassTrainingWorkout';

describe('classTrainingWorkoutQueryKey', () => {
	it('keys the mapping by tenant, class, event, and date', () => {
		expect(
			classTrainingWorkoutQueryKey({
				tenantId: 'tenant-1',
				classId: 42,
				eventId: 1001,
				sessionDate: '2026-07-29',
			}),
		).toEqual([
			'ws-class-training-workout',
			'tenant-1',
			'42',
			'1001',
			'2026-07-29',
		]);
	});

	it('uses a stable disabled key when no exact lookup can be made', () => {
		expect(classTrainingWorkoutQueryKey(null)).toEqual([
			'ws-class-training-workout',
			'disabled',
		]);
	});
});
```

- [ ] **Step 2: Run the hook test and confirm the red state**

Run:

```powershell
yarn test src/screens/Session/hooks/useClassTrainingWorkout.test.ts --runInBand
```

Expected: FAIL because `./useClassTrainingWorkout` does not exist.

- [ ] **Step 3: Implement the cached resolver hook**

Create `src/screens/Session/hooks/useClassTrainingWorkout.ts`:

```ts
import {
	resolveClassTrainingWorkout,
	type ClassTrainingResolution,
} from '@/services/workoutStudio/classTrainingWorkout';
import { useQuery } from '@tanstack/react-query';

export type ClassTrainingWorkoutParams = {
	tenantId: string;
	classId: string | number;
	eventId: string | number;
	sessionDate: string;
};

export const classTrainingWorkoutQueryKey = (
	params: ClassTrainingWorkoutParams | null,
) =>
	params
		? ([
				'ws-class-training-workout',
				params.tenantId,
				String(params.classId),
				String(params.eventId),
				params.sessionDate,
			] as const)
		: (['ws-class-training-workout', 'disabled'] as const);

export const useClassTrainingWorkout = (
	params: ClassTrainingWorkoutParams | null,
) =>
	useQuery<ClassTrainingResolution>({
		queryKey: classTrainingWorkoutQueryKey(params),
		queryFn: () =>
			params
				? resolveClassTrainingWorkout(params)
				: Promise.resolve<ClassTrainingResolution>({
						status: 'not_mapped',
					}),
		enabled: params !== null,
		staleTime: 300_000,
	});
```

- [ ] **Step 4: Run the resolver and hook tests**

Run:

```powershell
yarn test src/services/workoutStudio/classTrainingWorkout.test.ts src/screens/Session/hooks/useClassTrainingWorkout.test.ts --runInBand
```

Expected: PASS, including the existing tests proving exact class/event matching, no date guessing, ambiguity, and error classification.

- [ ] **Step 5: Commit the cached resolver hook**

```powershell
git add src/screens/Session/hooks/useClassTrainingWorkout.ts src/screens/Session/hooks/useClassTrainingWorkout.test.ts
git commit -m "feat(training): cache class workout mapping"
```

### Task 3: Render the Today’s session card

**Files:**
- Create: `src/screens/Session/components/TodaySessionCard.test.tsx`
- Create: `src/screens/Session/components/TodaySessionCard.tsx`
- Modify: `src/screens/Session/components/index.ts`

- [ ] **Step 1: Write the failing card-state tests**

Create `src/screens/Session/components/TodaySessionCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react-native';
import type { ClassSessionSummary } from '@/services/workoutStudio/classSessionSummary';
import TodaySessionCard from './TodaySessionCard';

const summary: ClassSessionSummary = {
	workoutId: 'workout-1',
	workoutName: 'Wednesday CrossFit',
	sections: [
		{
			id: 'warm-up',
			name: 'Warm-up',
			details: ['3 rounds'],
			movements: ['200 m Run', '10 x Air Squat'],
			remainingMovementCount: 2,
		},
	],
};

describe('TodaySessionCard', () => {
	it('omits the card when there is no safe summary', () => {
		render(<TodaySessionCard isLoading={false} summary={null} />);
		expect(screen.queryByText("Today’s session")).toBeNull();
	});

	it('renders a quiet loading state while exact data loads', () => {
		render(<TodaySessionCard isLoading summary={null} />);
		expect(screen.getByText("Today’s session")).toBeTruthy();
		expect(screen.getByText('Loading session…')).toBeTruthy();
	});

	it('renders the workout, section, prescriptions, and remainder', () => {
		render(<TodaySessionCard isLoading={false} summary={summary} />);
		expect(screen.getByText('Wednesday CrossFit')).toBeTruthy();
		expect(screen.getByText('Warm-up')).toBeTruthy();
		expect(
			screen.getByText('3 rounds · 200 m Run · 10 x Air Squat · +2 more'),
		).toBeTruthy();
	});
});
```

- [ ] **Step 2: Run the card test and confirm the red state**

Run:

```powershell
yarn test src/screens/Session/components/TodaySessionCard.test.tsx --runInBand
```

Expected: FAIL because `./TodaySessionCard` does not exist.

- [ ] **Step 3: Implement the card component**

Create `src/screens/Session/components/TodaySessionCard.tsx`:

```tsx
import { Spacer, Text } from '@/components/atoms';
import type { ClassSessionSummary } from '@/services/workoutStudio/classSessionSummary';
import { memberTheme } from '@/theme/member';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type TodaySessionCardProps = {
	isLoading: boolean;
	summary: ClassSessionSummary | null;
};

const TodaySessionCard = ({ isLoading, summary }: TodaySessionCardProps) => {
	if (!isLoading && !summary) return null;

	return (
		<View style={styles.card}>
			<Text size="md" bold style={styles.title}>
				Today’s session
			</Text>
			<Spacer size="sm" />
			{isLoading && !summary ? (
				<View style={styles.loadingRow}>
					<ActivityIndicator
						size="small"
						color={memberTheme.colors.primary}
					/>
					<Text size="rg" style={styles.muted}>
						Loading session…
					</Text>
				</View>
			) : null}
			{summary ? (
				<>
					<Text size="rg" bold style={styles.workoutName}>
						{summary.workoutName}
					</Text>
					{summary.sections.map(section => {
						const content = [
							...section.details,
							...section.movements,
							...(section.remainingMovementCount > 0
								? [`+${section.remainingMovementCount} more`]
								: []),
						].join(' · ');
						return (
							<View key={section.id} style={styles.section}>
								<Text size="rg" bold style={styles.sectionName}>
									{section.name}
								</Text>
								<Text size="rg" style={styles.prescription}>
									{content}
								</Text>
							</View>
						);
					})}
				</>
			) : null}
		</View>
	);
};

export default TodaySessionCard;

const styles = StyleSheet.create({
	card: {
		marginBottom: memberTheme.spacing.md,
		padding: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.md,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surface,
		...memberTheme.shadow,
	},
	title: { color: memberTheme.colors.primary, fontSize: 15 },
	workoutName: { color: memberTheme.colors.text },
	section: { marginTop: memberTheme.spacing.md },
	sectionName: { color: memberTheme.colors.primaryInk },
	prescription: { color: memberTheme.colors.text, lineHeight: 21 },
	loadingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: memberTheme.spacing.sm,
	},
	muted: { color: memberTheme.colors.textMuted },
});
```

- [ ] **Step 4: Export the card**

Add this export to `src/screens/Session/components/index.ts`:

```ts
export { default as TodaySessionCard } from './TodaySessionCard';
```

- [ ] **Step 5: Run the card test and type-check**

Run:

```powershell
yarn test src/screens/Session/components/TodaySessionCard.test.tsx --runInBand
yarn check-types
```

Expected: card tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit the card and Info-tab contract**

```powershell
git add src/screens/Session/components/TodaySessionCard.tsx src/screens/Session/components/TodaySessionCard.test.tsx src/screens/Session/components/index.ts
git commit -m "feat(training): add today session card"
```

### Task 4: Share one exact mapping across Info, Workout, and Results

**Files:**
- Modify: `src/screens/Session/components/SessionInformationTab.tsx`
- Modify: `src/screens/Session/Session.tsx`

- [ ] **Step 1: Add the Today’s session contract to the Info tab**

In `src/screens/Session/components/SessionInformationTab.tsx`, add imports:

```ts
import type { ClassSessionSummary } from '@/services/workoutStudio/classSessionSummary';
import TodaySessionCard from './TodaySessionCard';
```

Replace its prop definition and function signature with:

```ts
interface SessionInformationTabProps {
	session: SessionDetailSchemaType;
	todaySessionLoading: boolean;
	todaySessionSummary: ClassSessionSummary | null;
}

const SessionInformationTab = ({
	session,
	todaySessionLoading,
	todaySessionSummary,
}: SessionInformationTabProps) => {
```

Immediately after the existing Class Description card and before `</ScrollView>`, render:

```tsx
<TodaySessionCard
	isLoading={todaySessionLoading}
	summary={todaySessionSummary}
/>
```

- [ ] **Step 2: Replace direct resolver imports with the shared query and formatter imports**

Remove:

```ts
import { resolveClassTrainingWorkout } from '@/services/workoutStudio/classTrainingWorkout';
```

Add:

```ts
import { buildClassSessionSummary } from '@/services/workoutStudio/classSessionSummary';
import { useWorkoutDetail } from '@/screens/Training/hooks/useWorkoutDetail';
import { useClassTrainingWorkout } from './hooks/useClassTrainingWorkout';
```

- [ ] **Step 3: Construct one exact mapping query and one detail query**

Immediately after the existing `classId` memo, add:

```ts
	const wsSession = getStoredWSSession();
	const activeTenantId = wsSession?.user.active_tenant_id ?? '';
	const classTrainingParams = useMemo(
		() =>
			activeTenantId && session
				? {
						tenantId: activeTenantId,
						classId,
						eventId,
						sessionDate: moment(session.start_datetime).format(
							Constant.DEFAULT_DATE_FORMAT,
						),
					}
				: null,
		[activeTenantId, classId, eventId, session],
	);
	const classTrainingQuery = useClassTrainingWorkout(classTrainingParams);
	const mappedWorkoutId =
		classTrainingQuery.data?.status === 'resolved'
			? classTrainingQuery.data.workoutId
			: '';
	const workoutDetailQuery = useWorkoutDetail(mappedWorkoutId);
	const todaySessionSummary = useMemo(
		() => buildClassSessionSummary(workoutDetailQuery.data),
		[workoutDetailQuery.data],
	);
	const todaySessionLoading =
		classTrainingParams !== null &&
		(classTrainingQuery.isPending ||
			(classTrainingQuery.data?.status === 'resolved' &&
				workoutDetailQuery.isPending));
```

This deliberately leaves the summary `null` for `not_mapped`, `ambiguous`, `offline`, `auth`, `error`, missing detail, and public-empty detail.

- [ ] **Step 4: Reuse the cached resolution in Workout and Results navigation**

Inside `openTrainingWorkout`, retain the existing active-tenant activation check, but replace the direct `resolveClassTrainingWorkout(...)` call with:

```ts
			let resolution = classTrainingQuery.data;
			if (!resolution) {
				resolution = (await classTrainingQuery.refetch()).data;
			}

			if (!resolution) {
				Alert.alert(
					'Workout unavailable',
					'The Workout Studio workout could not be opened.',
				);
				return;
			}
```

Delete the now-redundant local `wsSession` declaration only if it duplicates the render-scope value. Keep all existing status branches unchanged so resolved navigation, Training activation, offline retry, ambiguity, not-mapped, and generic error behavior stay intact.

- [ ] **Step 5: Supply the summary state to the Info tab**

Replace the `SessionInformationTab` call with:

```tsx
<SessionInformationTab
	session={session as SessionDetailSchemaType}
	todaySessionLoading={todaySessionLoading}
	todaySessionSummary={todaySessionSummary}
/>
```

- [ ] **Step 6: Run focused tests and TypeScript**

Run:

```powershell
yarn test src/services/workoutStudio/classTrainingWorkout.test.ts src/services/workoutStudio/classSessionSummary.test.ts src/screens/Session/hooks/useClassTrainingWorkout.test.ts src/screens/Session/components/TodaySessionCard.test.tsx --runInBand
yarn check-types
```

Expected: all focused suites PASS and TypeScript exits 0. If TypeScript reports that React Query `refetch().data` may be undefined, retain the explicit `if (!resolution)` guard shown above rather than using a non-null assertion.

- [ ] **Step 7: Commit the shared class flow**

```powershell
git add src/screens/Session/Session.tsx src/screens/Session/components/SessionInformationTab.tsx
git commit -m "feat(training): show mapped workout in class info"
```

### Task 5: Full regression verification

**Files:**
- Verify only; do not modify unrelated files to make the working tree appear clean.

- [ ] **Step 1: Run the complete Jest suite**

```powershell
yarn test --runInBand
```

Expected: all suites PASS, including exact mapping, workout navigation-tab, scoring, results lifecycle, and sharing tests.

- [ ] **Step 2: Run TypeScript and lint**

```powershell
yarn check-types
yarn lint
```

Expected: both commands exit 0 with no TypeScript errors, ESLint errors, or warnings.

- [ ] **Step 3: Inspect the final diff and scope**

```powershell
git status --short
git diff HEAD~3 -- src/screens/Session src/services/workoutStudio/classSessionSummary.ts src/services/workoutStudio/classSessionSummary.test.ts
```

Expected: only the files listed in this plan appear in the feature commits. Confirm there is no backend change, legacy v2 workout lookup, score-default edit, private-note rendering, or fallback to a same-date workout.

- [ ] **Step 4: Perform the physical iPhone/TestFlight acceptance check**

Using a class event with one exact Workout Studio mapping, verify:

1. Class Description remains unchanged.
2. Today’s session appears immediately beneath it while Info is selected.
3. The displayed workout name and sections match the Workout tab.
4. Warm-up appears even when `is_scored` is false.
5. No coach, scaled, foundations, movement, or staff notes appear.
6. Each section shows at most three movements and a correct `+N more` suffix.
7. Workout opens the mapped workout Overview and Results opens its Leaderboard.
8. A class with no exact mapping shows no Today’s session card and retains the existing Workout/Results alert.
9. With the network unavailable, class booking/details remain usable and the summary card disappears after resolution fails.

Expected: all nine checks pass. A USB device is not required for implementation or automated verification, but a physical iPhone is recommended for this final layout and navigation check before release.
