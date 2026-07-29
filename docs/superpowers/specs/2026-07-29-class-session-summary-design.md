# Class Session Summary Design

**Status:** Approved
**Date:** 2026-07-29

## Goal

Show members a concise summary of the Workout Studio workout mapped to the exact class event they are viewing. The existing Class Description remains unchanged, and a separate **Today’s session** card appears immediately beneath it.

## Scope

This is a v3 mobile-only change. It reuses the exact tenant, class ID, event ID, and session date mapping already used by the class **Workout** and **Results** tabs. It does not change the Studio backend, use the legacy v2 workout data, or guess from workouts that merely share the same date.

The separate Studio requirement that new Warm-up sections default to unscored is not part of this design.

## Data Flow

1. The existing class-session query loads the class event.
2. When a Workout Studio session and active tenant are available, a cached class-training resolution query calls `resolveClassTrainingWorkout` with the tenant ID, class ID, event ID, and session date.
3. A resolved mapping supplies the Workout Studio workout ID. A missing, ambiguous, offline, authentication, or unexpected result does not fall back to another workout.
4. `useWorkoutDetail` loads the mapped workout with its ordered sections, blocks, movements, and public prescription fields.
5. A pure formatter converts the workout into member-safe summary data.
6. `SessionInformationTab` renders the summary beneath the existing Class Description.

The class Workout and Results actions consume the same cached resolution rather than independently guessing or selecting a workout. Their existing alerts and activation flow remain in place.

## Summary Format

The card title is **Today’s session**. It shows the mapped workout name followed by each `section_mode = workout` section in programmed order.

Each section contains:

- the section name;
- up to three unique movement prescriptions in programmed order;
- sets, reps, duration, distance, calories, or prescribed weight when present; and
- `+N more` when additional movement prescriptions are omitted.

Example:

```text
Today’s session
Wednesday CrossFit

Warm-up
3 rounds · 200 m Run · 10 Air Squats

Strength
Deadlift · 5 sets · 5 reps

Conditioning
12 min AMRAP · Bike · Burpees
```

The formatter must not include coach notes, member or athlete notes, staff-only notes, scaled or foundations notes, or score-entry controls. Unscored workout sections such as Warm-up are included because this is a session preview, not a scoring interface.

## UI States

- **Loading:** Render the Today’s session card with a quiet loading indicator after an exact mapping is being resolved or its workout is loading.
- **Resolved:** Render the workout name and formatted sections.
- **No exact mapping:** Omit the card.
- **Ambiguous mapping:** Omit the card. The Workout or Results action continues to show its existing mapping-conflict alert.
- **Offline, authentication, or unexpected error:** Omit the card so booking and class information remain usable. The Workout and Results actions retain their current retry, activation, and error behavior.
- **Mapped workout with no public workout sections:** Omit the card rather than display an empty summary.

## Component Boundaries

- The existing class-training resolver remains responsible only for exact mapping and status classification.
- A React Query wrapper owns caching of that resolution for the class screen and tab actions.
- `useWorkoutDetail` remains responsible for fetching complete workout detail.
- A new pure summary formatter owns public field selection, formatting, ordering, deduplication, and truncation.
- `SessionInformationTab` only renders the supplied loading or resolved summary state.

These boundaries keep mapping, fetching, formatting, and presentation independently testable.

## Testing

Automated tests will verify:

- the existing exact class and event mapping remains authoritative;
- section order is preserved;
- unscored Warm-up sections are included;
- movement prescriptions include supported public values;
- duplicate movements are removed within the summary;
- each section is limited to three prescriptions with a correct `+N more` suffix;
- notes and private fields never appear in formatter output;
- an empty or notes-only workout produces no summary; and
- no mapping or a mapping error does not substitute another workout.

Before release, the full TypeScript, lint, and Jest gates must pass. A TestFlight check should confirm the Info card, loading behavior, Workout and Results navigation, and readable layout on a physical iPhone.

## Acceptance Criteria

- The existing Class Description is preserved.
- A member viewing a class with one exact mapped workout sees a separate Today’s session card beneath Class Description.
- The card represents the same workout opened by the Workout and Results tabs.
- The summary is concise, ordered, and member-safe.
- No card is shown when an exact safe summary cannot be produced.
- Existing booking, attendance, Workout, and Results flows continue to work.
