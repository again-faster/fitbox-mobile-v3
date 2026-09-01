# Member Training Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Make the member Training experience show only useful, feature-enabled tabs, while keeping Today focused on the immediate workout and weekly goal.

**Architecture:** Keep the existing React Navigation stack and global Fitbox bottom navigation. Add a shared TrainingTabBar, a pure tab-availability policy, and a focused availability hook that combines feature flags with lightweight content-presence queries. Primary screens render the tab bar; detail screens remain unchanged.

**Tech Stack:** React Native, TypeScript, React Navigation Stack, React Query, Jest, existing Workout Studio API helpers and member theme primitives.

---

### Task 1: Define and test tab availability policy

**Files:**
- Create: src/screens/Training/Tabs/trainingTabs.ts
- Test: src/screens/Training/Tabs/trainingTabs.test.ts

- [ ] Write failing tests for Today always visible; Progress requiring an enabled progress feature plus content; Readiness requiring wearables plus ready provider data; Wellness requiring an enabled wellness or pain-report action; More requiring secondary items; and the one-tab rail-hidden case.
- [ ] Run: node_modules/.bin/jest.cmd src/screens/Training/Tabs/trainingTabs.test.ts --runInBand. Confirm it fails because the policy module is missing.
- [ ] Implement TrainingTabKey, TrainingTabAvailabilityInput, visibleTrainingTabs(input), tabRouteForKey(key), and fallbackTrainingTab(selected, visibleTabs). The policy must start with Today, add Progress only for progressFeature && progressContent, add Readiness only for wearablesFeature && readinessStatus === 'ready', add Wellness only for (wellnessFeature || painReportsFeature) && healthActionAvailable, and add More only when secondaryItemCount > 0.
- [ ] Re-run the focused test and confirm all cases pass.
- [ ] Commit with: git add src/screens/Training/Tabs && git commit -m "feat: define training tab availability".

### Task 2: Add lightweight availability queries

**Files:**
- Create: src/screens/Training/Tabs/useTrainingTabAvailability.ts
- Test: src/screens/Training/Tabs/useTrainingTabAvailability.test.ts
- Modify only if needed: src/services/workoutStudio/api.ts

- [ ] Write failing adapter tests for no progress rows hiding Progress and optional query failure preserving Today.
- [ ] Run: node_modules/.bin/jest.cmd src/screens/Training/Tabs/useTrainingTabAvailability.test.ts --runInBand. Confirm the missing-module failure.
- [ ] Implement buildTrainingTabAvailability(features, presence, readiness, secondaryCount) and useTrainingTabAvailability(). Use React Query with cached select=id&limit=1 presence requests for enabled result, PR, max, benchmark, and recap capabilities; reuse the existing readiness query; and derive secondary count from the existing feature-filtered More groups. Optional query errors resolve to no content for only that tab and never block Today. Return { status: 'loading' | 'ready', visibleTabs }.
- [ ] Re-run the adapter and policy tests.
- [ ] Commit with: git add src/screens/Training/Tabs src/services/workoutStudio/api.ts && git commit -m "feat: add training tab availability queries".

### Task 3: Build the shared tab bar

**Files:**
- Create: src/screens/Training/Tabs/TrainingTabBar.tsx
- Test: src/screens/Training/Tabs/TrainingTabBar.test.tsx
- Create if needed: src/screens/Training/Tabs/TrainingTabShell.tsx

- [ ] Write failing component tests for tab order, hidden destinations, native tab accessibility roles and selected state, peer navigation with navigation.replace, and hiding the full rail when only Today is visible.
- [ ] Run: node_modules/.bin/jest.cmd src/screens/Training/Tabs/TrainingTabBar.test.tsx --runInBand. Confirm the component is missing.
- [ ] Implement a compact horizontal ScrollView using trainingTheme, visible text labels, accessibilityRole="tab", accessibilityState={{ selected }}, and navigation.replace(tabRouteForKey(tab)). Render null when visibleTabs.length <= 1; do not add a navigation dependency.
- [ ] Re-run the component test and commit with: git add src/screens/Training/Tabs && git commit -m "feat: add member training tab bar".

### Task 4: Integrate the primary Training destinations

**Files:**
- Modify: src/screens/Training/Today/Today.tsx
- Modify: src/screens/Training/Progress/Progress.tsx
- Modify: src/screens/Training/Wearables/Wearables.tsx
- Modify: src/screens/Training/Wellness/Wellness.tsx
- Modify: src/screens/Training/More/TrainingMore.tsx
- Modify only if needed: src/navigators/TrainingStack.tsx
- Test: src/screens/Training/Tabs/trainingTabIntegration.test.tsx

- [ ] Add failing integration assertions that each primary destination renders the shared shell, peer tabs use replacement navigation, Today retains only the immediate workout/in-progress state/weekly goal, and old inline Progress, Readiness, Wellness, Recent PR, recap, and secondary cards are absent.
- [ ] Run: node_modules/.bin/jest.cmd src/screens/Training/Tabs/trainingTabIntegration.test.tsx --runInBand. Confirm the expected failures.
- [ ] Integrate the shell through the availability hook. While availability is loading, render Today without optional tabs. If a selected destination becomes unavailable, replace it with TrainingToday. Keep detail screens unchanged. If pain reports are enabled without Wellness, add a small TrainingWellnessHub that links to existing Wellness and Injury screens without duplicating their forms.
- [ ] Remove the crowded optional panels from Today while preserving existing workout, empty-state, in-progress, and weekly-goal behavior.
- [ ] Run the integration tests plus src/screens/Training/More/trainingMoreItems.test.ts and commit with: git add src/screens/Training src/navigators/TrainingStack.tsx && git commit -m "feat: organize member training into conditional tabs".

### Task 5: Add refresh, fallback, and accessibility regression coverage

**Files:**
- Modify: src/screens/Training/Tabs/useTrainingTabAvailability.ts
- Modify refresh handlers in Today.tsx, Progress.tsx, Wearables.tsx, Wellness.tsx, and TrainingMore.tsx as needed
- Test: src/screens/Training/Tabs/*.test.ts* and existing member visual-contract tests

- [ ] Add failing tests for optional-query errors hiding only the affected tab, refresh invalidating availability, and selected-tab fallback to Today after feature/data changes.
- [ ] Run: node_modules/.bin/jest.cmd src/screens/Training/Tabs --runInBand. Confirm the failures.
- [ ] Invalidate availability after workout completion, result/max/PR changes, wearable sync, Wellness/pain updates, and feature refresh. Keep hidden tabs out of the accessibility tree and preserve native tab order.
- [ ] Re-run the focused suite and commit with: git add src/screens/Training/Tabs src/screens/Training src/services/workoutStudio && git commit -m "test: cover conditional training tab refresh".

### Task 6: Full local and device verification

**Files:** No new files; inspect the complete diff.

- [ ] Run: node_modules/.bin/jest.cmd --runInBand. Expected result: all suites pass.
- [ ] Run: node_modules/.bin/tsc.cmd --noEmit --pretty false. Expected result: exit code 0 or only documented pre-existing errors.
- [ ] Run: node_modules/.bin/eslint.cmd "**/*.{ts,tsx}" --report-unused-disable-directives --max-warnings 0. Record any repository baseline issue and ensure no new tab errors.
- [ ] Run the app on the connected iOS device and verify: all flags show all applicable tabs; Progress hides with no progress records; Readiness hides without real readiness data but Wearables remains in More; Wellness shows only enabled actions; optional flags off leaves a clean Today; and peer tab switching preserves global navigation without a growing back stack.
- [ ] Run git status --short and git diff --check; only intended mobile changes may remain.

### Task 7: Create the TestFlight preview build

**Files:** No workflow changes unless the existing preview workflow requires the verified commit on testflight-preview-ci.

- [ ] Record git rev-parse HEAD and prove the source relationship with git merge-base --is-ancestor HEAD origin/master.
- [ ] Push only codex/training-tabs with git push -u origin codex/training-tabs.
- [ ] Dispatch .github/workflows/build-ios-app.yml on testflight-preview-ci, preserving com.againfaster.fitbox.preview and fitbox Preview. Never touch fitbox-web-v2 or production identifiers.
- [ ] Monitor archive/export/artifact/upload jobs. Record workflow URL, source SHA, version/build number, upload result, and Apple delivery UUID.
- [ ] Download and inspect the IPA for bundle identifier, display name, version/build, and App Intent metadata.
- [ ] Confirm TestFlight processing and tester availability separately from upload, then report any App Store Connect action still requiring the user.
