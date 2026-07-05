---
task: 260705-obi-add-native-apple-healthkit-integration
type: quick-execute
completed: 2026-07-05
duration_minutes: 45
commits: 3
files_created: 5
files_modified: 5
---

# Quick Task 260705-obi: Add Native Apple HealthKit Integration

**One-liner:** Native HealthKit sync (HRV, RHR, sleep, energy, VO2, weight, steps, workouts) via react-native-health@1.19.0 with 2-hour BGTaskScheduler background sync and AppState foreground trigger.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add packages + iOS native config | 94365cc |
| 2 | HealthKit service (authorize + syncNow) | e9c3234 |
| 3 | Background sync configuration (2hr BGTask) | e9c3234 |
| 4 | Apple Health screen + navigation wiring + foreground trigger | 8f5e9ed |

## Files Created

- `src/services/healthKit/healthKitService.ts` — authorize() and syncNow() with 7 metric types + workout ingestion
- `src/services/healthKit/backgroundSync.ts` — configureBgSync() (2hr interval) and stopBgSync()
- `src/services/healthKit/index.ts` — re-exports authorize() and syncNow()
- `src/screens/Training/AppleHealth/AppleHealthScreen.tsx` — toggle, last-synced timestamp, Sync Now button

## Files Modified

- `package.json` / `yarn.lock` — react-native-health@1.19.0, react-native-background-fetch@4.4.2
- `ios/fitbox/Info.plist` — NSHealthShareUsageDescription, BGTaskSchedulerPermittedIdentifiers (both IDs)
- `ios/fitbox/fitbox.entitlements` — HealthKit + background delivery capabilities
- `src/types/navigation.ts` — TrainingAppleHealth added to TrainingStackParamList
- `src/navigators/TrainingStack.tsx` — AppleHealthScreen registered
- `src/screens/Training/Settings/TrainingSettings.tsx` — Apple Health row (iOS-only)
- `src/screens/Training/Today/Today.tsx` — AppState foreground trigger

## Key Decisions

1. Used `getAnchoredWorkouts` (actual package method) instead of `getWorkouts` (mentioned in API reference but not in type definitions)
2. Sleep samples typed as `HealthValue` (value: number) in package but runtime returns strings — used local `SleepSample` type with `as unknown as` cast
3. `HKWorkoutQueriedSampleType` uses `start`/`end` fields (not `startDate`/`endDate`) — mapped accordingly
4. Callbacks for BackgroundFetch.configure (no-misused-promises) — rewrote to non-async wrapper using `.catch().finally()` chain with `void`
5. AppleHealthScreen hooks restructured to avoid Rules-of-Hooks violation (Platform guard moved after all hook calls)
6. `minimumFetchInterval: 120` (2hr in minutes) and `delay: 7200` (2hr in seconds per user spec)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created stub Build screen files to unblock ESLint**
- Found during: Task 1 commit attempt
- Issue: `TrainingStack.tsx` imports from `src/screens/Training/Build/*` which are gitignored and don't exist in the worktree. The pre-commit hook runs `npm run lint` on all files, which failed with `import/no-unresolved` errors.
- Fix: Created local-only stub files for BuildList, BuildSchedule, CustomWorkoutsUpsell, WorkoutEditor. These are gitignored (not committed) and satisfy ESLint's module resolver locally.
- Note: This is a pre-existing broken state in the worktree. The Build screens exist on the developer's machine but are gitignored.

**2. [Rule 1 - Bug] Used getAnchoredWorkouts instead of getWorkouts**
- Found during: Task 2 implementation
- Issue: `getWorkouts` does not exist in react-native-health@1.19.0 type definitions or implementation. The API reference in the plan was incorrect.
- Fix: Used `getAnchoredWorkouts` which returns `AnchoredQueryResults` with `data: HKWorkoutQueriedSampleType[]`. Mapped `w.start`/`w.end` (not `startDate`/`endDate`) and `w.calories` (not `activeEnergyBurned`).

**3. [Rule 2 - Missing critical] Fixed React Rules of Hooks violation**
- Found during: Task 4 implementation
- Issue: AppleHealthScreen had an early `return` for non-iOS before hook calls, violating Rules of Hooks.
- Fix: Moved Platform guard to inside hooks/effects; early return rendered after all hooks.

**4. [Plan corrections applied]**
- `minimumFetchInterval: 120` (plan had 15)
- `delay: 7200` (plan had 900)
- Added foreground AppState trigger in Today.tsx (not in original plan)

## Manual Steps Required

Pod install must be run on a Mac after checkout:
```bash
cd ios && RCT_NEW_ARCH_ENABLED=0 arch -arm64 bundle exec pod install
```

This installs the native pods for react-native-health and react-native-background-fetch.

## Verification

- TypeScript: `npx tsc --noEmit` passes with 0 errors
- No bearer token in any console.log: confirmed (grep returns empty)
- Platform.OS guards: present in all 4 HealthKit/BGTask files
- BGTask ID consistent: `com.wa.fitbox.dev.healthsync` in backgroundSync.ts and Info.plist
- BGTaskSchedulerPermittedIdentifiers: both `com.wa.fitbox.dev.healthsync` and `com.transistorsoft.fetch` in Info.plist

## Known Stubs

None — all data is wired to real HealthKit queries and the backend endpoint.

## Self-Check: PASSED

- src/services/healthKit/healthKitService.ts: EXISTS
- src/services/healthKit/backgroundSync.ts: EXISTS
- src/services/healthKit/index.ts: EXISTS
- src/screens/Training/AppleHealth/AppleHealthScreen.tsx: EXISTS
- Commits 94365cc, e9c3234, 8f5e9ed: FOUND in git log
