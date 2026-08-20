# Fitbox Member UI Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align member-facing legacy screens and all Workout Studio screens to one theme-backed Fitbox visual system without changing business logic, navigation, or service contracts.

**Architecture:** Extend `memberTheme` into the canonical member token set, make `trainingTheme` derive from it, and add small reusable member primitives for text, cards, buttons, screens, sections, and status pills. Migrate member-facing screens in batches while leaving non-member legacy surfaces and the four protected local-only mobile files untouched.

**Tech Stack:** React Native 0.76, TypeScript, React Navigation, React Native Paper, React Native Testing Library, Jest, existing `memberTheme`/`trainingTheme`, Inter font assets, and the current mobile lint/typecheck toolchain.

---

## Execution context and safety rules

Use the isolated worktree and branch:

`C:\Projects\workout-studio\.worktrees\mobile-ui-review`

Branch:

`codex/member-ui-consistency`

The source baseline is the merged mobile `master` commit `95da3e8`.

Do not modify, stage, delete, or reformat these pre-existing local-only files in the user's main mobile worktree:

- `src/navigators/Application.tsx`
- `src/utils/Constant.ts`
- `metro-verify.err.log`
- `metro-verify.out.log`

Do not touch `fitbox-web-v2` or any web repository. This plan changes mobile UI code only; it does not change APIs, persistence, feature flags, or Supabase contracts.

## File map

### Theme and primitives

- Modify `src/theme/member.ts` to add canonical member typography, control, spacing, surface, status, border, and shadow roles.
- Modify `src/theme/training.ts` so every exported training token derives from `memberTheme`.
- Create `src/theme/member.test.ts` to lock the shared token contract.
- Create `src/components/member/MemberText.tsx` for semantic Inter text roles.
- Create `src/components/member/MemberButton.tsx` for primary, secondary, outlined, quiet, danger, compact, and disabled actions.
- Create `src/components/member/MemberScreen.tsx` for safe-area handling, background, gutters, and scroll content spacing.
- Create `src/components/member/MemberSection.tsx` for section headings and optional actions.
- Create `src/components/member/MemberStatusPill.tsx` for semantic status labels.
- Modify `src/components/member/MemberCard.tsx` and `src/components/member/MemberPill.tsx` to use the shared token and text contracts.
- Modify `src/components/member/index.ts` to export all primitives.
- Create `src/components/member/memberPrimitives.test.tsx` for render, variant, touch-target, and accessibility coverage.

### Workout Studio shared components

- Modify `src/screens/Training/components/PrimaryButton.tsx` to delegate to `MemberButton` or remove it after call sites migrate.
- Modify `src/screens/Training/components/TrainingCard.tsx` to delegate to `MemberCard`.
- Modify `src/screens/Training/components/SectionHeading.tsx` to delegate to `MemberSection`.
- Modify `src/screens/Training/components/TrainingState.tsx`, `SkeletonCard.tsx`, and `OfflineBanner.tsx` to use `MemberText`, `MemberCard`, `MemberButton`, and semantic status tokens.
- Add or extend `src/screens/Training/components/memberVisualContract.test.tsx` for shared Training component behavior.

### Member-facing legacy surfaces

- Modify `src/screens/Dashboard/Dashboard.tsx` and its member-facing child cards under `src/screens/Dashboard/components/`.
- Modify `src/screens/Session/Session.tsx` and member-facing session components under `src/screens/Session/components/`.
- Modify `src/screens/PerformanceSummary/PastPerformance.tsx`, `src/screens/PerformanceSummary/AttendancePastPerformance.tsx`, and `src/screens/PerformanceSummary/WorkoutHistory/`.
- Modify `src/screens/NotificationScreen/NotificationScreen.tsx`.
- Modify member profile entry points identified by `src/navigators/Application.tsx` without changing the navigation file itself unless a visual wrapper requires an import-only change.

### Workout Studio screens

- Modify `src/screens/Training/TrainingRoot.tsx`, `src/screens/Training/More/TrainingMore.tsx`, and `src/screens/Training/Today/Today.tsx`.
- Modify `src/screens/Training/Wearables/Wearables.tsx` and `src/screens/Training/AppleHealth/AppleHealthScreen.tsx`.
- Modify `src/screens/Training/Progress/Progress.tsx`, `src/screens/Training/Recap/WeeklyRecap.tsx`, and `src/screens/Training/Notifications/NotificationsInbox.tsx`.
- Modify `src/screens/Training/Results/Results.tsx`, `src/screens/Training/Results/ResultDetail.tsx`, and `src/screens/Training/Workouts/`.
- Modify `src/screens/Training/Bookings/`, `src/screens/Training/Wellness/`, `src/screens/Training/Injuries/`, and `src/screens/Training/Sharing/`.
- Preserve existing readiness, recap, notification, workout, booking, wellness, injury, and sharing tests; update only assertions that describe presentation or accessibility.

## Requirements traceability

- **Design system foundation:** Task 1 defines the canonical tokens and makes `trainingTheme` derive from `memberTheme`.
- **Shared primitives:** Task 2 creates the member primitives; Task 3 replaces the duplicated Workout Studio primitives with them.
- **Migration scope:** Tasks 4–6 migrate the approved Workout Studio and legacy member-facing surfaces.
- **Hardcoded-style policy:** Task 7 runs the raw-style audit and requires remaining matches to be token definitions or documented decorative/platform values.
- **Validation and rollout:** Tasks 1–3 add focused component contracts; Tasks 4–6 preserve feature behavior tests; Tasks 7–8 perform the visual, typecheck, lint, full-test, and protected-file checks.

---

### Task 1: Lock the canonical member token contract

**Files:**
- Modify: `src/theme/member.ts`
- Modify: `src/theme/training.ts`
- Create: `src/theme/member.test.ts`

- [ ] **Step 1: Write the failing token contract tests.** Add tests that assert the canonical roles exist and that training values are derived from member values:

```ts
import { memberTheme } from './member';
import { trainingTheme } from './training';

describe('member visual tokens', () => {

	it('defines the approved typography and control roles', () => {

		expect(memberTheme.typography.screenTitle).toMatchObject({
			fontFamily: 'Inter-Variable',
			fontSize: 28,
			lineHeight: 34,
			fontWeight: '800',
		});
			expect(memberTheme.controls.minTouchTarget).toBeGreaterThanOrEqual(44);
			expect(memberTheme.spacing).toMatchObject({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 });
	});

	it('does not define a competing training palette', () => {

		expect(trainingTheme.colors.primary).toBe(memberTheme.colors.primary);
		expect(trainingTheme.colors.background).toBe(memberTheme.colors.background);
		expect(trainingTheme.spacing).toBe(memberTheme.spacing);
		expect(trainingTheme.radius.lg).toBe(memberTheme.radius.lg);
	});
});
```

- [ ] **Step 2: Run the token tests and confirm they fail.**

Run:

```powershell
npx jest src/theme/member.test.ts --runInBand
```

Expected: FAIL because the new typography and control roles are not defined and `trainingTheme` still owns duplicated values.

- [ ] **Step 3: Add the member token roles.** Extend `memberTheme` with these concrete values and keep all existing color values unchanged:

```ts
typography: {
	display: { fontFamily: 'Inter-Variable', fontSize: 32, lineHeight: 38, fontWeight: '800' },
	screenTitle: { fontFamily: 'Inter-Variable', fontSize: 28, lineHeight: 34, fontWeight: '800' },
	sectionTitle: { fontFamily: 'Inter-Variable', fontSize: 20, lineHeight: 26, fontWeight: '800' },
	body: { fontFamily: 'Inter-Variable', fontSize: 15, lineHeight: 22, fontWeight: '400' },
	label: { fontFamily: 'Inter-Variable', fontSize: 13, lineHeight: 18, fontWeight: '600' },
	meta: { fontFamily: 'Inter-Variable', fontSize: 12, lineHeight: 18, fontWeight: '400' },
	button: { fontFamily: 'Inter-Variable', fontSize: 15, lineHeight: 20, fontWeight: '700' },
},
controls: {
	minTouchTarget: 44,
	primaryHeight: 48,
	compactHeight: 40,
},
surfaces: {
	cardPadding: 16,
	sectionGap: 24,
	screenGutter: 16,
},
```

Add `info`, `disabled`, and the corresponding soft semantic backgrounds to the existing status palette. Keep `trainingTheme` as a typed projection of these values; it must not repeat literal colors, spacing, radii, or shadow values.

- [ ] **Step 4: Run the token tests and verify they pass.**

Run:

```powershell
npx jest src/theme/member.test.ts --runInBand
```

Expected: PASS with 2 tests and 0 failures.

- [ ] **Step 5: Commit the token layer.**

```powershell
git add src/theme/member.ts src/theme/training.ts src/theme/member.test.ts
git commit -m "feat: centralize member UI tokens"
```

### Task 2: Build and test shared member primitives

**Files:**
- Create: `src/components/member/MemberText.tsx`
- Create: `src/components/member/MemberButton.tsx`
- Create: `src/components/member/MemberScreen.tsx`
- Create: `src/components/member/MemberSection.tsx`
- Create: `src/components/member/MemberStatusPill.tsx`
- Modify: `src/components/member/MemberCard.tsx`
- Modify: `src/components/member/MemberPill.tsx`
- Modify: `src/components/member/index.ts`
- Create: `src/components/member/memberPrimitives.test.tsx`

- [ ] **Step 1: Write failing primitive tests.** Cover one behavior per test: semantic typography, button variants and disabled state, screen gutters, section action accessibility, status colors, and card variants. Use real rendered components and assert roles/labels/styles rather than mocking the primitives.

```tsx
it('renders a primary member button with the minimum touch target', () => {
	const { getByRole } = render(
		<MemberButton label="Save" variant="primary" onPress={jest.fn()} />,
	);

	const button = getByRole('button', { name: 'Save' });
	expect(button.props.accessibilityState).toMatchObject({ disabled: false });
	expect(StyleSheet.flatten(button.props.style)).toMatchObject({
		minHeight: memberTheme.controls.primaryHeight,
		backgroundColor: memberTheme.colors.primary,
	});
});
```

- [ ] **Step 2: Run the primitive tests and confirm the missing exports fail.**

Run:

```powershell
npx jest src/components/member/memberPrimitives.test.tsx --runInBand
```

Expected: FAIL because the new primitives do not exist.

- [ ] **Step 3: Implement the primitives with the approved contracts.** Use `Pressable` for buttons and expose these exact props:

```ts
type MemberButtonProps = {
	label: string;
	variant?: 'primary' | 'secondary' | 'outlined' | 'quiet' | 'danger';
	compact?: boolean;
	disabled?: boolean;
	onPress: () => void;
	accessibilityLabel?: string;
};

type MemberTextProps = React.ComponentProps<typeof RNText> & {
	role?: 'display' | 'screenTitle' | 'sectionTitle' | 'body' | 'label' | 'meta' | 'button';
	muted?: boolean;
};
```

`MemberScreen` must render a `SafeAreaView` with the canonical background and expose `contentContainerStyle`. `MemberSection` must render a heading and optional pressable action with a minimum 44pt target. `MemberStatusPill` must accept `status: 'default' | 'success' | 'warning' | 'danger' | 'info'` and provide an accessible label. Update `MemberCard` and `MemberPill` to use `MemberText` and the same radius, border, spacing, and touch-target tokens.

- [ ] **Step 4: Run the primitive tests and verify all variants pass.**

Run:

```powershell
npx jest src/components/member/memberPrimitives.test.tsx --runInBand
```

Expected: PASS with coverage for every public variant and 0 failures.

- [ ] **Step 5: Commit the primitives.**

```powershell
git add src/components/member src/theme/member.test.ts
git commit -m "feat: add shared member UI primitives"
```

### Task 3: Replace duplicated Workout Studio primitives

**Files:**
- Modify: `src/screens/Training/components/PrimaryButton.tsx`
- Modify: `src/screens/Training/components/TrainingCard.tsx`
- Modify: `src/screens/Training/components/SectionHeading.tsx`
- Modify: `src/screens/Training/components/TrainingState.tsx`
- Modify: `src/screens/Training/components/SkeletonCard.tsx`
- Modify: `src/screens/Training/components/OfflineBanner.tsx`
- Create: `src/screens/Training/components/memberVisualContract.test.tsx`

- [ ] **Step 1: Add failing visual-contract assertions.** Assert that the shared Training wrappers render the canonical member card/button styles, use theme text roles, expose `accessibilityRole`, and keep offline/error/empty actions at the minimum touch target.

- [ ] **Step 2: Run the focused test to establish the pre-migration failures.**

Run:

```powershell
npx jest src/screens/Training/components/memberVisualContract.test.tsx --runInBand
```

Expected: FAIL on the duplicated local style values and missing primitive delegation.

- [ ] **Step 3: Delegate the Training components to member primitives.** Keep current props and call sites stable. `PrimaryButton` maps `label` to `MemberButton`, `TrainingCard` maps `accent` to a `MemberCard` accent, `SectionHeading` maps `title/action` to `MemberSection`, and state components map their messages/actions to `MemberText`/`MemberButton`.

- [ ] **Step 4: Run the focused Training component tests.**

Run:

```powershell
npx jest src/screens/Training/components/memberVisualContract.test.tsx --runInBand
```

Expected: PASS with 0 failures.

- [ ] **Step 5: Commit the shared Training migration.**

```powershell
git add src/screens/Training/components
git commit -m "refactor: reuse member primitives in training UI"
```

### Task 4: Migrate Workout Studio entry and high-traffic screens

**Files:**
- Modify: `src/screens/Training/TrainingRoot.tsx`
- Modify: `src/screens/Training/More/TrainingMore.tsx`
- Modify: `src/screens/Training/Today/Today.tsx`
- Modify: `src/screens/Training/Wearables/Wearables.tsx`
- Modify: `src/screens/Training/AppleHealth/AppleHealthScreen.tsx`
- Modify: `src/screens/Training/Progress/Progress.tsx`
- Modify: `src/screens/Training/Recap/WeeklyRecap.tsx`
- Modify: `src/screens/Training/Notifications/NotificationsInbox.tsx`

- [ ] **Step 1: Add presentation assertions to the existing screen tests.** Extend `Today.readiness.test.ts`, `Wearables.readiness.test.ts`, `Progress.readiness.test.ts`, `WeeklyRecap.test.tsx`, and `NotificationsInbox.test.tsx` with stable accessibility labels for screen title, primary action, empty state, and error/offline state. Do not assert implementation-specific style object shapes in screen tests.

- [ ] **Step 2: Run the existing focused screen suites before migration.**

Run:

```powershell
npx jest src/screens/Training/Today/Today.readiness.test.ts src/screens/Training/Wearables/Wearables.readiness.test.ts src/screens/Training/Progress/Progress.readiness.test.ts src/screens/Training/Recap/WeeklyRecap.test.tsx src/screens/Training/Notifications/NotificationsInbox.test.tsx --runInBand
```

Expected: the existing behavior tests pass; any new accessibility assertions fail until the shared wrappers are applied.

- [ ] **Step 3: Migrate screen shells and duplicated styles.** Replace direct `SafeAreaView`/screen background/header copies with `MemberScreen`. Replace screen-local text roles, card surfaces, headings, status pills, and primary actions with shared primitives. Replace the identified literal UI colors in `Today.tsx`, `TrainingRoot.tsx`, `Recap`, `NotificationsInbox`, and `Wearables` with named member tokens. Keep decorative confetti and workout-share artwork palettes local.

- [ ] **Step 4: Run the focused suites after migration.**

Run the same Jest command from Step 2.

Expected: all existing behavior assertions and new accessibility assertions pass with 0 failures.

- [ ] **Step 5: Commit the high-traffic screen migration.**

```powershell
git add src/screens/Training/TrainingRoot.tsx src/screens/Training/More src/screens/Training/Today src/screens/Training/Wearables src/screens/Training/AppleHealth src/screens/Training/Progress src/screens/Training/Recap src/screens/Training/Notifications
git commit -m "refactor: align core training screens with member UI"
```

### Task 5: Migrate secondary Workout Studio features

**Files:**
- Modify: `src/screens/Training/Results/Results.tsx`
- Modify: `src/screens/Training/Results/ResultDetail.tsx`
- Modify: `src/screens/Training/Workouts/WorkoutList.tsx`
- Modify: `src/screens/Training/Workouts/WorkoutDetail.tsx`
- Modify: `src/screens/Training/Workouts/RunWorkout.tsx`
- Modify: `src/screens/Training/Workouts/WorkoutComplete.tsx`
- Modify: `src/screens/Training/Workouts/WorkoutLeaderboard.tsx`
- Modify: `src/screens/Training/Bookings/BookingsHub.tsx`
- Modify: `src/screens/Training/Bookings/BookingComposer.tsx`
- Modify: `src/screens/Training/Wellness/Wellness.tsx`
- Modify: `src/screens/Training/Injuries/InjuryList.tsx`
- Modify: `src/screens/Training/Injuries/InjuryLog.tsx`
- Modify: `src/screens/Training/Injuries/InjuryDailyUpdate.tsx`
- Modify: `src/screens/Training/Sharing/ShareWorkoutComposer.tsx`

- [ ] **Step 1: Add or extend one behavior/accessibility test per feature family.** Cover Results/Workouts action states, Booking confirmation/disabled state, Wellness offline queue state, Injury severity and save state, and Sharing selection/submit state. Use the current feature tests as the source of existing behavior.

- [ ] **Step 2: Run those feature-family tests before style changes.**

Run:

```powershell
npx jest src/screens/Training/Results src/screens/Training/Workouts src/screens/Training/Bookings src/screens/Training/Wellness src/screens/Training/Injuries src/screens/Training/Sharing --runInBand
```

Expected: the existing behavior tests pass before the visual migration begins.

- [ ] **Step 3: Replace duplicated member styles.** Use `MemberScreen` for safe-area/background/gutters, `MemberText` for all member copy, `MemberCard` for surfaces, `MemberButton` for actions, and `MemberStatusPill` for result/booking/wellness/injury state labels. Move remaining UI colors, radii, spacing, and control sizes to `memberTheme` tokens.

- [ ] **Step 4: Run the feature-family tests after migration.**

Run the same command from Step 2.

Expected: all feature-family tests pass with no new warnings or failures.

- [ ] **Step 5: Commit the secondary feature migration.**

```powershell
git add src/screens/Training/Results src/screens/Training/Workouts src/screens/Training/Bookings src/screens/Training/Wellness src/screens/Training/Injuries src/screens/Training/Sharing
git commit -m "refactor: align secondary training features with member UI"
```

### Task 6: Migrate legacy member-facing surfaces

**Files:**
- Modify: `src/screens/Dashboard/Dashboard.tsx`
- Modify: `src/screens/Dashboard/components/BookedSessionCard.tsx`
- Modify: `src/screens/Dashboard/components/DashboardActionButton.tsx`
- Modify: `src/screens/Dashboard/components/DashboardHeader.tsx`
- Modify: `src/screens/Session/Session.tsx`
- Modify: `src/screens/Session/components/TodaySessionCard.tsx`
- Modify: `src/screens/Session/components/SessionActionButtons.tsx`
- Modify: `src/screens/Session/components/SessionTabButtons.tsx`
- Modify: `src/screens/PerformanceSummary/PastPerformance.tsx`
- Modify: `src/screens/PerformanceSummary/AttendancePastPerformance.tsx`
- Modify: `src/screens/PerformanceSummary/WorkoutHistory/`
- Modify: `src/screens/NotificationScreen/NotificationScreen.tsx`

- [ ] **Step 1: Add focused render/accessibility tests for the legacy entry surfaces.** Test Dashboard greeting/action/attendance states, Session primary actions/tabs, PerformanceSummary empty/result states, and NotificationScreen unread/read/empty states. Preserve existing navigation callbacks and service mocks.

- [ ] **Step 2: Run the focused legacy tests before migration.**

Run:

```powershell
npx jest src/screens/Dashboard src/screens/Session src/screens/PerformanceSummary src/screens/NotificationScreen --runInBand
```

Expected: existing tests pass; new assertions identify only presentation/accessibility gaps.

- [ ] **Step 3: Migrate only member-facing UI.** Keep the legacy data loading and callbacks unchanged. Replace member-facing cards, buttons, headers, section labels, and status/empty states with the shared primitives. Use `MemberText` in the migrated paths so the legacy member surfaces adopt Inter without changing unrelated coach/admin/commerce screens.

- [ ] **Step 4: Run the focused legacy suites after migration.**

Run the same command from Step 2.

Expected: all focused legacy tests pass with 0 failures.

- [ ] **Step 5: Commit the legacy member migration.**

```powershell
git add src/screens/Dashboard src/screens/Session src/screens/PerformanceSummary src/screens/NotificationScreen
git commit -m "refactor: align legacy member surfaces with member UI"
```

### Task 7: Perform the hardcoded-style audit and visual review

**Files:**
- Modify: only remaining changed member-facing files identified by the audit.
- Test: existing primitive and screen suites.

- [ ] **Step 1: Run the raw-style audit.**

Run:

```powershell
rg -n "#[0-9A-Fa-f]{3,8}|fontFamily:|fontSize:|lineHeight:|padding(?:Horizontal|Vertical)?: [0-9]+|margin(?:Horizontal|Vertical)?: [0-9]+|borderRadius: [0-9]+" src/components/member src/screens/Training src/screens/Dashboard src/screens/Session src/screens/PerformanceSummary src/screens/NotificationScreen --glob '*.{ts,tsx}'
```

Expected: remaining matches are only semantic token definitions, decorative illustration/share/confetti palettes, or platform-specific values with an inline explanation. UI colors and layout values must resolve through `memberTheme` or the shared primitives.

- [ ] **Step 2: Review the seven visual checkpoints.** Compare Dashboard, Today, Wearables, Progress, Weekly Recap, Notifications, and Results for identical screen gutters, title hierarchy, card treatment, action height, status treatment, loading/empty/error states, and safe-area behavior. Record any discrepancy as a concrete token or primitive change, then rerun the relevant focused test.

- [ ] **Step 3: Run formatting and whitespace checks.**

Run:

```powershell
git diff --check
npx prettier --check src/theme src/components/member src/screens/Training src/screens/Dashboard src/screens/Session src/screens/PerformanceSummary src/screens/NotificationScreen
```

Expected: both commands exit 0.

- [ ] **Step 4: Commit the final style-audit fixes.**

```powershell
git add src/theme src/components/member src/screens/Training src/screens/Dashboard src/screens/Session src/screens/PerformanceSummary src/screens/NotificationScreen
git commit -m "style: finish member UI consistency audit"
```

### Task 8: Run full verification and hand off

**Files:** all implementation files from Tasks 1–7.

- [ ] **Step 1: Run mobile typecheck.**

```powershell
npm run check-types -- --pretty false
```

Expected: exit 0. If the repository's known baseline errors remain, capture the exact files and confirm they are outside the changed member UI paths before reporting them.

- [ ] **Step 2: Run the focused primitive and screen suites.**

```powershell
npx jest src/theme/member.test.ts src/components/member/memberPrimitives.test.tsx src/screens/Training/components/memberVisualContract.test.tsx src/screens/Training/Today src/screens/Training/Wearables src/screens/Training/Progress src/screens/Training/Recap src/screens/Training/Notifications --runInBand
```

Expected: all listed suites pass with 0 failures.

- [ ] **Step 3: Run the full Jest suite.**

```powershell
npm test -- --runInBand
```

Expected: the suite completes with no new failures attributable to the member UI changes.

- [ ] **Step 4: Run lint on changed TypeScript files.**

```powershell
npx eslint src/theme src/components/member src/screens/Training src/screens/Dashboard src/screens/Session src/screens/PerformanceSummary src/screens/NotificationScreen --ext .ts,.tsx --max-warnings 0
```

Expected: exit 0, or an explicit list of pre-existing lint issues with no new issues in changed files.

- [ ] **Step 5: Confirm protected files remain untouched.**

```powershell
git status --short
git diff --name-only origin/master...HEAD
```

Expected: the branch contains only the approved UI consistency files and design/plan docs; the user's main mobile worktree still has the four pre-existing local-only files unchanged and none are present in the branch diff.

- [ ] **Step 6: Commit the verified handoff if verification-only metadata changed.**

```powershell
git status --short
```

Expected: clean working tree. Do not create a no-op commit.
