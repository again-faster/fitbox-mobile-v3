---
task: 260705-obi-add-native-apple-healthkit-integration
type: execute
autonomous: true
wave: 1
files_modified:
  - package.json
  - ios/fitbox/Info.plist
  - ios/fitbox/fitbox.entitlements
  - src/services/healthKit/healthKitService.ts
  - src/services/healthKit/backgroundSync.ts
  - src/services/healthKit/index.ts
  - src/screens/Training/AppleHealth/AppleHealthScreen.tsx
  - src/types/navigation.ts
  - src/navigators/TrainingStack.tsx
  - src/screens/Training/Settings/TrainingSettings.tsx

must_haves:
  truths:
    - "HealthKit authorization prompt appears on first tap of Apple Health in Settings"
    - "Sync posts metrics and workouts to backend using getValidWSToken() bearer token"
    - "Background sync fires on iOS without app open using com.wa.fitbox.dev.healthsync"
    - "All HealthKit code is guarded with Platform.OS === 'ios'"
    - "Bearer token is never logged"
  artifacts:
    - path: "src/services/healthKit/healthKitService.ts"
      provides: "authorize(), syncNow() — queries 7 metric types + workouts, batches, POSTs"
    - path: "src/services/healthKit/backgroundSync.ts"
      provides: "configureBgSync() — registers BGTask, triggers syncNow()"
    - path: "src/screens/Training/AppleHealth/AppleHealthScreen.tsx"
      provides: "Enable/disable toggle, last synced timestamp, manual sync button"
  key_links:
    - from: "AppleHealthScreen.tsx"
      to: "healthKitService.ts"
      via: "syncNow() call on manual sync button"
    - from: "backgroundSync.ts"
      to: "healthKitService.ts"
      via: "syncNow() inside BGTask callback"
    - from: "healthKitService.ts"
      to: "https://studio.fitbox.iq/api/public/wearables/apple-health/native-ingest"
      via: "fetch POST with Authorization: Bearer <token from getValidWSToken()>"
---

<objective>
Add native Apple HealthKit integration to fitbox-mobile-v2 (iOS only).

Purpose: Let athletes sync HRV, resting HR, sleep, active energy, VO2 max, weight, step count,
and workouts from HealthKit to the Fitbox backend automatically (background) and on-demand.

Output: HealthKit service + background sync + Apple Health settings screen wired into Training navigation.
</objective>

<context>
@src/services/workoutStudio/auth.ts        — provides getValidWSToken(), getStoredWSSession()
@src/storage.ts                             — provides mmkvStorage (MMKV instance)
@src/types/navigation.ts                    — TrainingStackParamList (add TrainingAppleHealth here)
@src/navigators/TrainingStack.tsx           — register new screen
@src/screens/Training/Settings/TrainingSettings.tsx  — add Apple Health row

<!-- Interfaces the executor needs -->
<interfaces>
From src/services/workoutStudio/auth.ts:
  export function getValidWSToken(): Promise<string | null>
  export function getStoredWSSession(): WSSession | null

From src/storage.ts:
  export const mmkvStorage: MMKV   // use mmkvStorage.set(key, value) / mmkvStorage.getString(key)

Storage key convention: 'healthkit.lastSyncedAt' (ISO string)

Backend endpoint:
  POST https://studio.fitbox.iq/api/public/wearables/apple-health/native-ingest
  Authorization: Bearer <token>
  Content-Type: application/json
  Body: { metrics: MetricPayload[], workouts: WorkoutPayload[] }
  Batch limits: metrics ≤ 400 per request, workouts ≤ 200 per request

MetricPayload:
  { date: "YYYY-MM-DD", type: MetricType, value: number, source: "com.apple.health" }

MetricType union:
  "hrv_sdnn" | "resting_heart_rate" | "sleep_hours" | "active_energy_kcal"
  | "vo2_max" | "body_mass_kg" | "step_count"

WorkoutPayload:
  { external_id: string, workout_type: string, started_at: string, ended_at: string,
    duration_seconds: number, active_energy_kcal: number, distance_meters: number,
    source: "com.apple.health" }
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add packages and configure iOS native files</name>
  <files>
    package.json
    ios/fitbox/Info.plist
    ios/fitbox/fitbox.entitlements
  </files>
  <action>
    1. Run in project root (Bash):
       yarn add react-native-health react-native-background-fetch

    2. Edit ios/fitbox/Info.plist — add inside the root <dict>:
       a. NSHealthShareUsageDescription:
          <key>NSHealthShareUsageDescription</key>
          <string>fitbox reads your workouts, heart rate, and sleep to personalize your training.</string>

       b. BGTaskSchedulerPermittedIdentifiers:
          <key>BGTaskSchedulerPermittedIdentifiers</key>
          <array>
            <string>com.wa.fitbox.dev.healthsync</string>
          </array>

       Note: UIBackgroundModes already has 'fetch' — do NOT remove or duplicate it.

    3. Edit ios/fitbox/fitbox.entitlements — add inside root <dict>:
       <key>com.apple.developer.healthkit</key>
       <true/>
       <key>com.apple.developer.healthkit.background-delivery</key>
       <true/>

    MANUAL STEP (cannot run on Windows):
    After these changes, on a Mac run:
      cd ios && pod install
    This installs react-native-health and react-native-background-fetch pods.
  </action>
  <verify>
    package.json contains "react-native-health" and "react-native-background-fetch" in dependencies.
    Info.plist contains NSHealthShareUsageDescription and BGTaskSchedulerPermittedIdentifiers.
    fitbox.entitlements contains com.apple.developer.healthkit key.
  </verify>
  <done>
    All three native config files updated. yarn.lock updated. Pod install documented as manual step.
  </done>
</task>

<task type="auto">
  <name>Task 2: HealthKit sync service</name>
  <files>
    src/services/healthKit/healthKitService.ts
    src/services/healthKit/index.ts
  </files>
  <action>
    Create src/services/healthKit/healthKitService.ts:

    Guard ALL exports with Platform.OS === 'ios' at call-site level (import Platform from react-native).
    Import AppleHealthKit from 'react-native-health'. Import getValidWSToken from workoutStudio/auth.
    Import mmkvStorage from src/storage.

    STORAGE_KEY = 'healthkit.lastSyncedAt'

    PERMISSIONS object — read only, no write:
      read: [
        AppleHealthKit.Constants.Permissions.HeartRateVariability,
        AppleHealthKit.Constants.Permissions.RestingHeartRate,
        AppleHealthKit.Constants.Permissions.SleepAnalysis,
        AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
        AppleHealthKit.Constants.Permissions.Vo2Max,
        AppleHealthKit.Constants.Permissions.Weight,
        AppleHealthKit.Constants.Permissions.StepCount,
        AppleHealthKit.Constants.Permissions.Workout,
      ],
      write: []

    Export async function authorize(): Promise<boolean>
      - If Platform.OS !== 'ios' return false
      - Wrap AppleHealthKit.initHealthKit(PERMISSIONS, callback) in a Promise
      - Return true on success, false on error

    Export async function syncNow(): Promise<void>
      - If Platform.OS !== 'ios' return
      - Get token = await getValidWSToken()
      - If !token return (no auth, silent fail)
      - lastSyncedAt = mmkvStorage.getString(STORAGE_KEY) ?? 30 days ago ISO string
      - startDate = lastSyncedAt, endDate = new Date().toISOString()
      - Query all 7 metric types (promisify each AppleHealthKit query):
          * getHeartRateVariabilitySamples → type 'hrv_sdnn', value = sample.value
          * getRestingHeartRateSamples → type 'resting_heart_rate'
          * getSleepSamples → type 'sleep_hours', aggregate: sum minutes where value === 'ASLEEP'
            per calendar day, convert to hours (minutes / 60)
          * getActiveEnergyBurned → type 'active_energy_kcal', aggregate daily sum
          * getVo2MaxSamples → type 'vo2_max'
          * getWeightSamples → type 'body_mass_kg'
          * getDailyStepCountSamples → type 'step_count', value = sample.value
        Map each result to MetricPayload: { date: "YYYY-MM-DD" from sample.startDate, type, value, source: "com.apple.health" }
      - Query AppleHealthKit.getSamples for workouts (type: AppleHealthKit.Constants.Activities.*)
          Map to WorkoutPayload: {
            external_id: sample.id (HKWorkout uuid),
            workout_type: sample.activityName,
            started_at: sample.startDate,
            ended_at: sample.endDate,
            duration_seconds: sample.duration,
            active_energy_kcal: sample.activeEnergyBurned ?? 0,
            distance_meters: sample.distance ?? 0,
            source: "com.apple.health"
          }
      - Batch metrics (chunks of 400) and workouts (chunks of 200)
      - For each batch POST to endpoint:
          fetch('https://studio.fitbox.iq/api/public/wearables/apple-health/native-ingest', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,  // NEVER log this value
            },
            body: JSON.stringify({ metrics: metricChunk, workouts: workoutChunk }),
          })
        Throw on non-2xx. Catch and console.error without logging the token.
      - On success: mmkvStorage.set(STORAGE_KEY, endDate)

    Create src/services/healthKit/index.ts:
      export { authorize, syncNow } from './healthKitService';
  </action>
  <verify>
    TypeScript compiles: npx tsc --noEmit (from project root, ignore react-native-health type errors if pod not installed)
    File exists at src/services/healthKit/healthKitService.ts with authorize() and syncNow() exports.
    grep -n "Bearer" src/services/healthKit/healthKitService.ts shows token used in header only, no console.log of token.
  </verify>
  <done>
    healthKitService.ts exports authorize() and syncNow(). All HealthKit calls Platform-guarded.
    Token never logged. Batching respects 400/200 limits. lastSyncedAt persisted to MMKV.
  </done>
</task>

<task type="auto">
  <name>Task 3: Background sync configuration</name>
  <files>
    src/services/healthKit/backgroundSync.ts
  </files>
  <action>
    Create src/services/healthKit/backgroundSync.ts:

    Import BackgroundFetch from 'react-native-background-fetch'.
    Import { Platform } from 'react-native'.
    Import { syncNow } from './healthKitService'.

    const BG_TASK_ID = 'com.wa.fitbox.dev.healthsync';

    Export async function configureBgSync(): Promise<void>
      - If Platform.OS !== 'ios' return

      - Call BackgroundFetch.configure(
          {
            minimumFetchInterval: 15,       // 15 minutes minimum (iOS enforces this)
            stopOnTerminate: false,
            startOnBoot: false,             // iOS-only, not applicable
            enableHeadless: false,
            forceAlarmManager: false,       // iOS ignores this
          },
          async (taskId: string) => {
            try {
              await syncNow();
            } catch (e) {
              console.error('[HealthSync] bg sync error', e);
            } finally {
              BackgroundFetch.finish(taskId);
            }
          },
          (taskId: string) => {
            // Timeout handler
            BackgroundFetch.finish(taskId);
          }
        )

      - Call BackgroundFetch.scheduleTask({
          taskId: BG_TASK_ID,
          delay: 900,          // 15 minutes in seconds for BGTaskScheduler
          periodic: true,
          requiresNetworkConnectivity: true,
        })

    Export function stopBgSync(): void
      - If Platform.OS !== 'ios' return
      - BackgroundFetch.stop(BG_TASK_ID)
  </action>
  <verify>
    npx tsc --noEmit passes (or shows only missing-pod errors, not logic errors).
    BG_TASK_ID matches 'com.wa.fitbox.dev.healthsync' (same as Info.plist entry).
    Platform guard present at function entry.
  </verify>
  <done>
    configureBgSync() registers BGTask with 15-min interval. stopBgSync() cancels it.
    Both no-op on non-iOS platforms.
  </done>
</task>

<task type="auto">
  <name>Task 4: Apple Health screen and navigation wiring</name>
  <files>
    src/screens/Training/AppleHealth/AppleHealthScreen.tsx
    src/types/navigation.ts
    src/navigators/TrainingStack.tsx
    src/screens/Training/Settings/TrainingSettings.tsx
  </files>
  <action>
    1. src/types/navigation.ts
       Add to TrainingStackParamList:
         TrainingAppleHealth: undefined;

    2. src/navigators/TrainingStack.tsx
       Import AppleHealthScreen from '../screens/Training/AppleHealth/AppleHealthScreen'.
       Add inside Stack.Navigator:
         <Stack.Screen name="TrainingAppleHealth" component={AppleHealthScreen} />

    3. src/screens/Training/AppleHealth/AppleHealthScreen.tsx
       Create screen component. Platform.OS !== 'ios' → show "HealthKit is only available on iOS."

       State:
         - isAuthorized: boolean (from mmkvStorage.getString('healthkit.authorized') === 'true')
         - lastSyncedAt: string | null (from mmkvStorage.getString('healthkit.lastSyncedAt'))
         - isSyncing: boolean

       UI (follow existing screen style — check sibling screens for StyleSheet patterns):
         - Header: "Apple Health"
         - Row: "Connect Apple Health" with a toggle switch
           - onToggle ON: call authorize() from healthKitService, on success:
               mmkvStorage.set('healthkit.authorized', 'true')
               configureBgSync() from backgroundSync
               setIsAuthorized(true)
           - onToggle OFF: stopBgSync(), mmkvStorage.set('healthkit.authorized', 'false'), setIsAuthorized(false)
         - If authorized: show "Last synced: {lastSyncedAt formatted}" or "Never synced"
         - If authorized: show "Sync Now" button
           - onPress: setIsSyncing(true), await syncNow(), setIsSyncing(false),
             setLastSyncedAt(mmkvStorage.getString('healthkit.lastSyncedAt') ?? null)
         - ActivityIndicator when isSyncing

       On mount: if mmkvStorage.getString('healthkit.authorized') === 'true', call configureBgSync()
         (re-registers task after app restart).

    4. src/screens/Training/Settings/TrainingSettings.tsx
       Add a tappable row "Apple Health" (iOS only — Platform.OS === 'ios' ? <Row/> : null).
       onPress: navigation.navigate('TrainingAppleHealth')
       Match existing row style/pattern in that file.
  </action>
  <verify>
    npx tsc --noEmit — no new TypeScript errors.
    TrainingAppleHealth exists in TrainingStackParamList in navigation.ts.
    AppleHealthScreen.tsx has Platform.OS !== 'ios' guard at top of render.
    TrainingSettings.tsx Apple Health row is wrapped in Platform.OS === 'ios' check.
  </verify>
  <done>
    Apple Health screen navigable from Training Settings (iOS only).
    Toggle authorizes HealthKit and starts background sync.
    Sync Now button triggers manual sync and updates displayed timestamp.
  </done>
</task>

</tasks>

<verification>
TypeScript compilation:
  npx tsc --noEmit

Check no token logging:
  grep -rn "console.log.*token\|console.log.*Bearer" src/services/healthKit/

Check platform guards present:
  grep -n "Platform.OS" src/services/healthKit/healthKitService.ts
  grep -n "Platform.OS" src/services/healthKit/backgroundSync.ts
  grep -n "Platform.OS" src/screens/Training/AppleHealth/AppleHealthScreen.tsx
  grep -n "Platform.OS" src/screens/Training/Settings/TrainingSettings.tsx

Check BGTask ID consistency:
  grep -rn "com.wa.fitbox.dev.healthsync" src/ ios/

Manual integration test (requires Mac + physical iPhone):
  1. pod install (Mac required)
  2. Build and run on iPhone
  3. Open Training > Settings > Apple Health
  4. Toggle on — HealthKit permission dialog appears
  5. Grant permissions — toggle shows enabled state
  6. Tap "Sync Now" — spinner appears then "Last synced: just now" shows
  7. Check Xcode console — no bearer token logged
  8. Background task fires within ~15 min (verify via Xcode Simulate Background Fetch)
</verification>

<success_criteria>
- All TypeScript compiles without new errors
- HealthKit authorize() + syncNow() implemented with correct batch limits (metrics 400, workouts 200)
- Background sync registered with identifier com.wa.fitbox.dev.healthsync
- Apple Health screen reachable from Training Settings on iOS
- All HealthKit/BGTask code no-ops on Android (Platform.OS === 'ios' guards)
- Bearer token never appears in any console.log
- lastSyncedAt persisted in MMKV under 'healthkit.lastSyncedAt'
- getValidWSToken() reused — no new auth flow
</success_criteria>

<output>
No SUMMARY.md required for quick tasks. Return path to this PLAN.md.
</output>
