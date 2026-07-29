# Share Workout Description Prefill

## Goal

Prepopulate the post-workout share description with a concise, public summary of the completed workout. The member can edit or completely remove the generated text before sharing.

## User experience

When the share composer loads its workout detail, the description field is populated once in this form:

`Workout name — Section: movement summary · Section: movement summary`

Example:

`Midweek Engine — Strength: Deadlift 5×3 · Metcon: 18 min EMOM — Bike, DB Snatches & Burpees`

The generated value is ordinary text. Typing, replacing, or clearing it must not cause the app to regenerate it during the same composer session.

## Description generation

- Start with the workout name.
- Include every programmed section mode, including Strength and Metcon; do not restrict generation to sections whose mode is `workout`.
- Label each included section with its public section name when available; otherwise use a human-readable version of its section mode.
- Prefer each section's member-visible `coach_notes` as its summary when present. Despite the database field name, this text is displayed to members in the workout runner and is part of the public programming for text-based sessions such as Midweek Engine.
- When a section has no member-visible notes, summarize movements using public prescription fields already available in `WorkoutDetail`, such as sets, repetitions, duration, distance, calories, and weight.
- Preserve programming order and remove duplicate movement summaries.
- Never include block intent, scaling notes, foundations notes, or movement notes.
- Keep the final value at or below the existing 180-character input limit.
- Prefer removing later movement or section summaries at natural boundaries instead of cutting words. If even the workout name is longer than the limit, truncate only the name to fit.
- If no usable section summary is available, use the workout name by itself. If the workout has no usable name, leave the description empty.

## Architecture and data flow

The existing `ShareWorkoutComposer` continues loading the workout through `useWorkoutDetail`. A pure formatter in `shareWorkout.ts` converts that `WorkoutDetail` into the default description. The composer assigns the result only during its existing one-time initialization effect, preserving all subsequent member edits.

No database columns, API changes, or persisted generated captions are required.

## Error handling

Missing or partial workout detail should produce the most useful safe result available: workout name only, a partial public summary, or an empty string. Description generation must not prevent the share composer from opening or sharing.

## Testing

Unit tests for the pure formatter will cover:

- workout name plus ordered Strength and Metcon summaries;
- use of member-visible section notes for text-based Strength and Metcon programming;
- exclusion of block intent, scaling/foundations notes, and movement notes;
- fallback to workout name when there are no member-visible notes or structured movements;
- natural-boundary shortening to 180 characters;
- an empty result when neither a usable name nor public workout information exists.

The existing composer behavior will continue to ensure the default is assigned once, leaving the field editable and clearable.
