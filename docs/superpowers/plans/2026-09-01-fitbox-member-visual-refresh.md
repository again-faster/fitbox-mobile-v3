# Fitbox Member Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the Fitbox V3 member experience so the home dashboard, Attendance, Switch Gym, Memberships, and Menu detail screens share the approved Fitbox-purple visual system and improved spacing.

**Architecture:** Keep the existing React Native navigation, live API data, and `memberTheme` tokens. Use `memberTheme.colors.primary` (`#7775E6`) for member-facing actions and feature surfaces, while leaving the deep training accent and green status semantics intact. Rework the two high-impact layouts in their existing screens, extracting only small presentational pieces where that makes alignment testable.

**Tech Stack:** React Native 0.76, TypeScript, React Navigation, React Native SVG Charts, React Native Paper, Jest, Testing Library for React Native.

---

## File map

- Modify `src/screens/Dashboard/components/DashboardHeader.tsx` to make the banner full width and allow a fixed square logo to overlap without clipping.
- Modify `src/screens/Dashboard/Dashboard.tsx` to remove the subtitle, replace number-dependent attendance padding with equal metric cells, and tune page rhythm.
- Create `src/screens/Dashboard/components/DashboardAttendanceMetric.tsx` for a reusable centered metric cell with optional progress-ring content.
- Test `src/screens/Dashboard/components/DashboardAttendanceMetric.test.tsx` for stable equal-cell and centered-label styles.
- Modify `src/screens/AttendanceScreen/MonthlyAttendanceGoal.tsx` to render the white goal-card treatment while retaining saved goals, editing, celebration, and live counts.
- Modify `src/screens/AttendanceScreen/AttendanceScreen.tsx` to match the supplied Attendance hierarchy, chart spacing, stat layout, and summary table.
- Create `src/screens/AttendanceScreen/components/AttendanceHeader.tsx` for the purple gradient header and back affordance.
- Modify `src/navigators/DashboardStack.tsx` so Attendance uses the custom header instead of duplicating the native header.
- Modify `src/components/member/MemberPill.tsx` so selected pills use Fitbox violet and unselected pills use white/soft-lavender surfaces.
- Modify `src/theme/member.ts` to expose a semantic member-action accent alias with the approved `#7775E6` value.
- Test `src/theme/member.test.ts` for the member-action and success color roles.
- Modify `src/modals/SwitchGym/SwitchGym.tsx` to replace member-facing maroon accents with Fitbox violet.
- Modify member-facing accent usages in `src/screens/Menu/Menu.tsx`, `src/screens/Subscription/Subscription.tsx`, `src/screens/Subscription/components/SubscriptionList.tsx`, `src/screens/SubscriptionDetails/SubscriptionDetails.tsx`, `src/screens/PaymentInformation/PaymentInformation.tsx`, `src/screens/AboutUs/AboutUs.tsx`, `src/screens/AcceptedWaiversScreen/AcceptedWaiversScreen.tsx`, `src/screens/HelpScreen/HelpScreen.tsx`, `src/screens/NotificationScreen/NotificationScreen.tsx`, `src/modals/SwitchUser/SwitchUser.tsx`, and `src/components/molecules/RowSelectItem/RowSelectItem.tsx`.
- Preserve the already-implemented Fitbox IQ availability changes in `src/screens/Training/features/memberFeatureRoutes.ts`, `src/screens/Training/features/memberFeatureRoutes.test.ts`, and `src/screens/Training/components/MemberFeatureGate.test.tsx`.

## Task 1: Add a testable dashboard attendance metric component

**Files:**

- Create: `src/screens/Dashboard/components/DashboardAttendanceMetric.tsx`
- Test: `src/screens/Dashboard/components/DashboardAttendanceMetric.test.tsx`

- [ ] **Step 1: Write the failing component test**

Create a test that renders a metric with a two-digit value and verifies the outer cell is flexible/centered, the value row is centered, and the label is centered. Also render a one-digit value to ensure the component does not add value-length-specific padding.

```tsx
it('uses the same centered cell layout for one- and two-digit values', () => {
	const { getByTestId, rerender } = render(
		<DashboardAttendanceMetric value="100" label="this year">
			<View testID="attendance-metric-icon" />
		</DashboardAttendanceMetric>,
	);

	expect(getByTestId('attendance-metric')).toHaveStyle({
		flex: 1,
		alignItems: 'center',
	});
	expect(getByTestId('attendance-metric-value-row')).toHaveStyle({
		justifyContent: 'center',
	});
	expect(getByTestId('attendance-metric-label')).toHaveStyle({
		textAlign: 'center',
	});

	rerender(
		<DashboardAttendanceMetric value="0" label="this month">
			<View testID="attendance-metric-icon" />
		</DashboardAttendanceMetric>,
	);

	const metricStyle = StyleSheet.flatten(
		getByTestId('attendance-metric').props.style,
	);
	expect(metricStyle).not.toHaveProperty('paddingLeft');
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run:

```bash
npx jest --runInBand src/screens/Dashboard/components/DashboardAttendanceMetric.test.tsx
```

Expected: FAIL because `DashboardAttendanceMetric` does not exist yet.

- [ ] **Step 3: Implement the minimal metric component**

Create a component with this shape:

```tsx
type Props = PropsWithChildren<{ value: string; label: string }>;

const DashboardAttendanceMetric = ({ children, value, label }: Props) => (
	<View testID="attendance-metric" style={styles.cell}>
		<View testID="attendance-metric-value-row" style={styles.valueRow}>
			{children}
			<Text bold style={styles.value} allowFontScaling={false}>
				{value}
			</Text>
		</View>
		<Text testID="attendance-metric-label" style={styles.label}>
			{label}
		</Text>
	</View>
);
```

Use `flex: 1`, `minWidth: 0`, `alignItems: 'center'`, `justifyContent: 'center'`, and `textAlign: 'center'`. Do not accept or derive a value-length padding prop.

- [ ] **Step 4: Run the focused test and verify it passes**

Run the same Jest command. Expected: PASS.

- [ ] **Step 5: Commit the component**

```bash
git add src/screens/Dashboard/components/DashboardAttendanceMetric.tsx src/screens/Dashboard/components/DashboardAttendanceMetric.test.tsx
git commit -m "refactor: standardize dashboard attendance metrics"
```

## Task 2: Apply the dashboard banner and spacing refresh

**Files:**

- Modify: `src/screens/Dashboard/components/DashboardHeader.tsx`
- Modify: `src/screens/Dashboard/Dashboard.tsx`

- [ ] **Step 1: Replace the clipped header layout**

Wrap the banner in an outer `View` with `overflow: 'visible'` and a bottom reservation equal to the logo overlap. Keep the image background `resizeMode="cover"`, use the existing Fitbox brand fallback, and give the logo wrapper a fixed square size with white backing, border, radius, and shadow. The banner itself remains edge-to-edge; the page content starts below the overlap.

- [ ] **Step 2: Remove the greeting subtitle**

Delete the `Here is your training at a glance` `Text` node and its style. Keep the greeting and switch-user control aligned in the same row.

- [ ] **Step 3: Use the new metric component for all visible attendance stats**

Replace the inline metric `View` blocks with `DashboardAttendanceMetric`. Pass the existing live values and labels. Preserve the optional monthly `MemberProgressRing`, icon assets, and conditional `attendanceFilter` behavior. Remove `thisStyle`, `yearLeftPadding`, `getMonthAttendanceStatStyle`, and all number-length padding branches.

- [ ] **Step 4: Tune shared dashboard rhythm**

Keep one horizontal inset for greeting, attendance, and Explore. Adjust only member spacing tokens/styles around the banner overlap, greeting, attendance card, section heading, and preset-filter row. Preserve the current `getClassFilters` data and Fitbox IQ class buttons.

- [ ] **Step 5: Run dashboard-focused verification**

Run:

```bash
npx jest --runInBand src/screens/Dashboard/components/DashboardAttendanceMetric.test.tsx src/screens/Training/features/memberFeatureRoutes.test.ts
npm run check-types
```

Expected: both tests pass and TypeScript exits with code 0.

## Task 3: Build the Attendance reference layout

**Files:**

- Create: `src/screens/AttendanceScreen/components/AttendanceHeader.tsx`
- Modify: `src/screens/AttendanceScreen/AttendanceScreen.tsx`
- Modify: `src/screens/AttendanceScreen/MonthlyAttendanceGoal.tsx`
- Modify: `src/navigators/DashboardStack.tsx`
- Modify: `src/components/member/MemberPill.tsx`

- [ ] **Step 1: Write focused layout tests for the custom header and goal card**

Add tests for the small presentational header and goal-card states:

```tsx
it('renders the Attendance title and supporting copy', () => {
	const { getByText } = render(
		<AttendanceHeader onBack={jest.fn()} />,
	);

	expect(getByText('Attendance')).toBeTruthy();
	expect(getByText('Track your visits and build consistency.')).toBeTruthy();
});

it('renders a white goal card with the live count and remaining visits', () => {
	const { getByText } = render(
		<MonthlyAttendanceGoal attendanceCount={0} gymId={1} memberId={2} />,
	);

	expect(getByText('September goal')).toBeTruthy();
	expect(getByText('8 visits to go')).toBeTruthy();
});
```

Mock only the existing MMKV storage boundary as needed; do not hardcode production attendance data.

- [ ] **Step 2: Run the focused tests and verify the expected failures**

Run:

```bash
npx jest --runInBand src/screens/AttendanceScreen/components/AttendanceHeader.test.tsx src/screens/AttendanceScreen/MonthlyAttendanceGoal.test.tsx
```

Expected: FAIL until the custom header and revised goal-card content exist.

- [ ] **Step 3: Implement the custom Attendance header**

Use a full-width purple-to-blue gradient or the existing brand-compatible gradient primitive, with a back button, `Attendance`, and the supplied supporting copy. Expose `onBack` and accessibility labels; do not own navigation inside the component.

- [ ] **Step 4: Render the goal card as a light member card**

Retain the existing goal storage keys, editor modal, celebration modal, goal calculations, and live `attendanceCount`. Change the achieved/active goal presentation from the purple hero to a white rounded card: purple progress ring, dark ink count, `YOUR GOAL`, month goal title, remaining-visits copy, and outlined purple Edit control. Keep the no-goal state functional and use the same member palette.

- [ ] **Step 5: Recompose the Attendance screen around the reference hierarchy**

Render the custom header first, then the goal card, Month/Year pills, trend card, two-column stat area, and two-column monthly summary. Keep `getAttendanceGraph`, current-month trimming, year selector state, and API-driven values intact. Use white cards, light borders, soft-lavender icon circles, purple bars, readable axis labels, and stable internal padding. Add the `View year` action only where the existing navigation/data contract supports it; never fabricate data.

- [ ] **Step 6: Update selected pill styling and native header visibility**

Make selected `MemberPill` controls use `memberTheme.colors.primary` with white text and keep unselected controls white/soft lavender with primary ink. Set the Attendance stack screen to hide the native title header so the custom header is the only page header; preserve the stack back behavior through the custom callback.

- [ ] **Step 7: Run Attendance-focused verification**

Run:

```bash
npx jest --runInBand src/screens/AttendanceScreen/components/AttendanceHeader.test.tsx src/screens/AttendanceScreen/MonthlyAttendanceGoal.test.tsx
npm run check-types
```

Expected: PASS and TypeScript exits with code 0.

## Task 4: Migrate member-facing maroon accents to Fitbox violet

**Files:**

- Modify: `src/modals/SwitchGym/SwitchGym.tsx`
- Modify: `src/screens/Menu/Menu.tsx`
- Modify: `src/screens/Subscription/Subscription.tsx`
- Modify: `src/screens/Subscription/components/SubscriptionList.tsx`
- Modify: `src/screens/SubscriptionDetails/SubscriptionDetails.tsx`
- Modify: `src/screens/PaymentInformation/PaymentInformation.tsx`
- Modify: `src/screens/AboutUs/AboutUs.tsx`
- Modify: `src/screens/AcceptedWaiversScreen/AcceptedWaiversScreen.tsx`
- Modify: `src/screens/HelpScreen/HelpScreen.tsx`
- Modify: `src/screens/NotificationScreen/NotificationScreen.tsx`
- Modify: `src/modals/SwitchUser/SwitchUser.tsx`
- Modify: `src/components/molecules/RowSelectItem/RowSelectItem.tsx`

- [ ] **Step 1: Add a palette regression check**

Create a focused `src/theme/member.test.ts` test that asserts the new semantic member-action accent is `#7775E6` while the success accent remains `#43A047`.

```ts
it('keeps member actions violet without changing success green', () => {
	expect(memberTheme.colors.memberAction).toBe('#7775E6');
	expect(memberTheme.colors.success).toBe('#43A047');
});
```

- [ ] **Step 2: Run the palette test before the migration**

Run:

```bash
npx jest --runInBand src/theme/member.test.ts
```

Expected: FAIL because `memberAction` is not yet defined.

- [ ] **Step 3: Replace only member-facing deep-accent usages**

Add `memberAction: '#7775E6'` to `memberTheme.colors`, then change the listed Menu, Switch Gym, Membership, payment, notification, waiver, help, About, Switch User, and row-selection accents from `memberTheme.colors.primaryDeep` to `memberTheme.colors.memberAction`. Do not change `memberTheme.colors.primaryDeep` globally. Keep success/current green, muted text, borders, and the dark bottom navigation unchanged.

- [ ] **Step 4: Run the palette test and scan for remaining scoped maroon usages**

Run:

```bash
npx jest --runInBand src/theme/member.test.ts
rg -n "memberTheme\.colors\.primaryDeep" src/screens/Menu src/screens/Subscription src/screens/SubscriptionDetails src/modals/SwitchGym src/screens/PaymentInformation src/screens/AboutUs src/screens/AcceptedWaiversScreen src/screens/HelpScreen src/screens/NotificationScreen src/modals/SwitchUser src/components/molecules/RowSelectItem
```

Expected: palette test PASS; the scoped search returns no member-facing action/card usages. Any remaining result must be documented as a deliberate non-member/training use before continuing.

- [ ] **Step 5: Run Switch Gym and member-flow verification**

Run:

```bash
npx jest --runInBand src/screens/Training/features/memberFeatureRoutes.test.ts src/screens/Training/components/MemberFeatureGate.test.tsx
npm run check-types
```

Expected: all selected tests pass and TypeScript exits with code 0.

## Task 5: Visual QA and full verification

**Files:**

- Review: all files changed in Tasks 1–4
- Preserve: pre-existing edits in `src/navigators/Application.tsx`, `src/utils/Constant.ts`, and `metro-verify.*`

- [ ] **Step 1: Review the local app at narrow phone dimensions**

Use the local app/browser to inspect:

- Home: full-width banner, visible square logo overlap, no greeting subtitle, evenly spaced `0 / 10`, `100`, and `623`-style metrics.
- Attendance: purple header, white goal card, selected purple Month pill, readable chart and stats, balanced summary card.
- Switch Gym: purple intro icon and Add Gym button, green Current badge.
- Memberships/Menu: no maroon member-facing hero/action accents; white cards and lavender surfaces remain.

- [ ] **Step 2: Run the full test suite**

```bash
npm test -- --runInBand
```

Expected: all Jest suites pass with zero failures.

- [ ] **Step 3: Run type checking and lint**

```bash
npm run check-types
npm run lint
```

Expected: TypeScript exits 0. Lint should exit 0; if ESLint still fails before linting because of the known `@typescript-eslint/no-unused-expressions`/ESLint dependency mismatch, report that exact infrastructure failure separately.

- [ ] **Step 4: Review the final diff**

```bash
git diff --check
git status --short
git diff --stat
```

Confirm only the approved visual-refresh files plus the already-existing user changes are present. Do not stage or overwrite the unrelated `Application.tsx`, `Constant.ts`, or `metro-verify.*` changes.

- [ ] **Step 5: Commit the visual refresh**

```bash
git add src/screens/Dashboard src/screens/AttendanceScreen src/components/member/MemberPill.tsx src/modals/SwitchGym src/screens/Menu src/screens/Subscription src/screens/SubscriptionDetails src/screens/PaymentInformation src/screens/AboutUs src/screens/AcceptedWaiversScreen src/screens/HelpScreen src/screens/NotificationScreen src/modals/SwitchUser src/components/molecules/RowSelectItem
git commit -m "style: refresh fitbox member visual system"
```

Do not include unrelated working-tree files in this commit.
