# Public Workout Summaries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepopulate the editable workout-share description and make Siri speak detailed, member-visible summaries for today's and tomorrow's assigned workouts.

**Architecture:** The React Native composer keeps its one-time initialization effect and receives a bounded caption from a pure TypeScript formatter. The native App Intent decodes the assignment workout ID, fetches member-visible workout sections from Supabase with the stored member session, and passes them to an internal pure Swift formatter that returns an `IntentDialog` string. Both implementations prefer displayed section notes, fall back to structured movements, preserve programmed order, and exclude block intent and scaling/movement notes.

**Tech Stack:** React Native, TypeScript, Jest, Swift 5, App Intents, XCTest, Supabase PostgREST, GitHub Actions/Xcode.

---

### Task 1: Generate the editable share caption

**Files:**
- Modify: `src/screens/Training/Sharing/shareWorkout.test.ts`
- Modify: `src/screens/Training/Sharing/shareWorkout.ts`
- Modify: `src/screens/Training/Sharing/ShareWorkoutComposer.tsx`

- [ ] **Step 1: Write failing formatter tests**

Add tests that construct ordered Warm-up, Strength, and Metcon sections and assert:

```ts
expect(buildWorkoutShareDescription(workout)).toContain('Midweek Engine');
expect(buildWorkoutShareDescription(workout)).toContain('Strength:');
expect(buildWorkoutShareDescription(workout)).toContain('Deadlift: 5 x 3');
expect(buildWorkoutShareDescription(workout)).toContain('Metcon:');
expect(buildWorkoutShareDescription(workout)).toContain('18-minute EMOM');
expect(buildWorkoutShareDescription(workout).length).toBeLessThanOrEqual(
	SHARE_DESCRIPTION_MAX_LENGTH,
);
```

Add separate tests for movement fallback, workout-name fallback, empty input, programmed section order, and exclusion of `intent`, `scaled_notes`, `foundations_notes`, and movement `notes`.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm test -- src/screens/Training/Sharing/shareWorkout.test.ts --runInBand
```

Expected: FAIL because the current formatter omits the workout name, ignores notes-only sections, and does not export the shared length constant.

- [ ] **Step 3: Implement the pure TypeScript formatter**

In `shareWorkout.ts`, export:

```ts
export const SHARE_DESCRIPTION_MAX_LENGTH = 180;
```

Implement these focused helpers:

```ts
const compactWhitespace = (value?: string | null) =>
	value?.split(/\s+/).filter(Boolean).join(' ').trim() ?? '';

const truncateAtWord = (value: string, limit: number) => {
	if (value.length <= limit) return value;
	if (limit <= 1) return value.slice(0, Math.max(0, limit));
	const candidate = value.slice(0, limit - 1).trimEnd();
	const boundary = candidate.lastIndexOf(' ');
	return `${(boundary > 0 ? candidate.slice(0, boundary) : candidate).trimEnd()}…`;
};
```

For each section in `position` order:

1. Use the compacted member-visible `coach_notes` when present, bounded to a concise per-section preview.
2. Otherwise collect unique structured movement summaries in block/movement position order.
3. Prefix the value with the section name.
4. Append complete section chunks while the total remains at or below 180 characters.
5. Always keep the workout name; when no public section data exists, return the name alone.

Do not read block intent, scaled/foundations notes, or movement notes.

- [ ] **Step 4: Keep the composer editable and length-aligned**

Import `SHARE_DESCRIPTION_MAX_LENGTH` in `ShareWorkoutComposer.tsx`, use it for `TextInput.maxLength`, and change the helper text to:

```tsx
<Text style={styles.helperText}>
	Generated from the workout name and member-visible sections. You can edit or remove it.
</Text>
```

Keep `descriptionWasInitialised` so the generated value is assigned once and never overwrites member edits.

- [ ] **Step 5: Verify GREEN and commit**

Run:

```powershell
npm test -- src/screens/Training/Sharing/shareWorkout.test.ts --runInBand
npm run check-types
```

Expected: focused tests and TypeScript PASS.

Commit:

```powershell
git add src/screens/Training/Sharing/shareWorkout.ts src/screens/Training/Sharing/shareWorkout.test.ts src/screens/Training/Sharing/ShareWorkoutComposer.tsx
git commit -m "feat(training): prefill workout share descriptions"
```

### Task 2: Make Siri load and speak public section details

**Files:**
- Modify: `ios/fitbox/FitboxAppIntents.swift`
- Create: `ios/fitboxTests/FitboxWorkoutSummaryTests.swift`
- Modify: `ios/fitbox.xcodeproj/project.pbxproj`
- Modify: `.github/workflows/build-ios-app.yml`

- [ ] **Step 1: Add the failing Swift formatter tests**

Create an XCTest case that imports the app module and verifies:

```swift
@testable import fitbox
import XCTest

final class FitboxWorkoutSummaryTests: XCTestCase {
  func testFormatsMemberVisibleNotesForSpeech() {
    let sections = [
      FitboxPublicWorkoutSection(
        id: "strength",
        name: "Strength",
        position: 1,
        sectionMode: "workout",
        coachNotes: "Deadlift: 5 x 3 at a moderate load.",
        sectionBlocks: []
      ),
      FitboxPublicWorkoutSection(
        id: "metcon",
        name: "Metcon",
        position: 2,
        sectionMode: "workout",
        coachNotes: "18-minute EMOM with bike, dumbbell snatches, and burpees.",
        sectionBlocks: []
      )
    ]

    let result = FitboxWorkoutSpeechFormatter.format(
      workoutName: "Midweek Engine",
      estimatedDurationMinutes: 45,
      sections: sections,
      dayName: "today"
    )

    XCTAssertTrue(result.contains("Today's workout is Midweek Engine"))
    XCTAssertTrue(result.contains("Strength: Deadlift: 5 x 3"))
    XCTAssertTrue(result.contains("Metcon: 18-minute EMOM"))
    XCTAssertLessThanOrEqual(result.count, 500)
  }
}
```

Add tests for structured-movement fallback, programmed order, 500-character boundary truncation, and name/duration fallback.

Register the Swift test file in the existing `fitboxTests` target in `project.pbxproj`.

Add a `Test workout summary formatter` workflow step after Pod installation:

```yaml
            - name: Test workout summary formatter
              run: |
                  cd ios
                  xcodebuild test -workspace fitbox.xcworkspace \
                  -scheme fitbox \
                  -destination 'platform=iOS Simulator,name=iPhone 16 Pro' \
                  -only-testing:fitboxTests/FitboxWorkoutSummaryTests
```

- [ ] **Step 2: Verify the test is RED on the macOS runner**

Commit and push the test-only RED state to the manual preview branch, then dispatch the preview workflow. The test must fail to compile because `FitboxPublicWorkoutSection` and `FitboxWorkoutSpeechFormatter` do not exist yet. No archive or store upload can occur after this failing gate. The macOS command is:

```bash
xcodebuild test -workspace ios/fitbox.xcworkspace -scheme fitbox \
  -destination 'platform=iOS Simulator,name=iPhone 16 Pro' \
  -only-testing:fitboxTests/FitboxWorkoutSummaryTests
```

- [ ] **Step 3: Add decodable public workout-detail models and the pure speech formatter**

In `FitboxAppIntents.swift`:

- Decode top-level `workout_id` on `FitboxWorkoutAssignment`.
- Add internal `Decodable` section, block, movement, and movement-name structs matching the PostgREST embedded response.
- Add `FitboxWorkoutSpeechFormatter.format(...)` that prefers compacted `coach_notes`, falls back to structured movement prescriptions, orders by `position`, and appends complete sentences up to 500 characters.
- Keep error strings and the multiple-workout response unchanged.

- [ ] **Step 4: Fetch section detail for a single assignment**

Add `fetchWorkoutSections(credentials:workoutId:)` using:

```text
GET {supabaseUrl}/rest/v1/workout_sections
select=id,name,position,section_mode,coach_notes,section_blocks(id,position,block_movements(id,position,sets,reps_scheme,weight_kg,duration_seconds,distance_meters,calories,movements(id,name)))
workout_id=eq.{workoutId}
order=position.asc
```

Send `Authorization: Bearer <access token>`, `apikey: <anon key>`, and `Accept: application/json`. For a single assignment, attempt this detail request and render it through the formatter. If it fails, return the existing name/duration response instead of failing the entire intent.

- [ ] **Step 5: Keep Siri voice delivery intact**

Do not change the intent result contract:

```swift
func perform() async throws -> some IntentResult & ProvidesDialog {
  let summary = await FitboxWorkoutSummaryService.spokenSummary(daysFromToday: 0)
  return .result(dialog: "\(summary)")
}
```

Apply the same behavior to tomorrow through the existing `daysFromToday: 1` path.

- [ ] **Step 6: Run the Swift test and archive compile gate**

Run the selected XCTest on macOS, then build/archive through `.github/workflows/build-ios-app.yml`. Expected: the selected tests PASS, archive succeeds, and App Intent metadata still contains `ReadTodayWorkoutIntent` and `ReadTomorrowWorkoutIntent`.

- [ ] **Step 7: Commit**

```powershell
git add ios/fitbox/FitboxAppIntents.swift ios/fitboxTests/FitboxWorkoutSummaryTests.swift ios/fitbox.xcodeproj/project.pbxproj
git commit -m "feat(ios): speak detailed workout summaries"
```

### Task 3: Final verification and publication

**Files:**
- Modify: `docs/superpowers/plans/2026-07-30-public-workout-summaries.md` (checkbox tracking only)

- [ ] **Step 1: Run all JavaScript gates**

```powershell
npm test -- --runInBand
npm run check-types
```

Expected: all Jest suites and TypeScript PASS. The clean GitHub runner must also pass the repository lint command before upload.

- [ ] **Step 2: Inspect the branch and diff**

```powershell
git status -sb
git diff --check origin/testflight-preview-ci..HEAD
git log --oneline origin/testflight-preview-ci..HEAD
```

Expected: only the approved plan, share formatter/composer, Swift App Intent, Swift test, Xcode project, and focused workflow-test changes are present.

- [ ] **Step 3: Push the normal fast-forward**

```powershell
git push origin testflight-preview-ci
```

Expected: `origin/testflight-preview-ci` advances without force push.

- [ ] **Step 4: Verify the signed preview artifact**

Dispatch the manual preview iOS workflow, require every validation/build/upload step to pass, and inspect the signed IPA for:

- `CFBundleIdentifier = com.againfaster.fitbox.preview`
- `CFBundleDisplayName = fitbox Preview`
- the reported version/build number
- `ReadTodayWorkoutIntent` and `ReadTomorrowWorkoutIntent` in `Metadata.appintents/extract.actionsdata`

Report Apple upload separately from TestFlight processing and tester availability.
