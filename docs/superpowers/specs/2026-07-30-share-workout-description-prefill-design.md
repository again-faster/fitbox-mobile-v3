# Public Workout Summaries for Sharing and Siri

## Goal

Generate a consistent public workout summary for two member experiences: an editable post-workout share description and natural spoken answers from Siri for today's or tomorrow's workout.

## User experience

When the share composer loads its workout detail, the description field is populated once in this form:

`Workout name — Section: movement summary · Section: movement summary`

Example:

`Midweek Engine — Strength: Deadlift 5×3 · Metcon: 18 min EMOM — Bike, DB Snatches & Burpees`

The generated value is ordinary text. Typing, replacing, or clearing it must not cause the app to regenerate it during the same composer session.

## Siri experience

The existing `ReadTodayWorkoutIntent` and `ReadTomorrowWorkoutIntent` answer with the same public workout information, rendered as natural sentences instead of a compact caption.

Example:

`Today's workout is Midweek Engine. Strength is deadlift, five sets of three. The Metcon is an eighteen-minute EMOM with bike, dumbbell snatches, and burpees.`

Both intents continue returning `ProvidesDialog`; this is the App Intents mechanism that lets Siri display or speak the result. The intent must work without opening the app when the stored Training session is valid.

## Description generation

- Start with the workout name.
- Include every section that contains member-visible programming. In current workouts, labels such as Strength and Metcon are section names rather than `section_mode` values.
- Label each included section with its public section name when available; otherwise use a human-readable version of `section_mode`.
- Prefer each section's member-visible `coach_notes` as its summary when present. Despite the database field name, this text is displayed to members in the workout runner and is part of the public programming for text-based sessions such as Midweek Engine.
- When a section has no member-visible notes, summarize movements using public prescription fields already available in `WorkoutDetail`, such as sets, repetitions, duration, distance, calories, and weight.
- Preserve programming order and remove duplicate movement summaries.
- Never include block intent, scaling notes, foundations notes, or movement notes.
- Keep the final value at or below the existing 180-character input limit.
- Prefer removing later movement or section summaries at natural boundaries instead of cutting words. If even the workout name is longer than the limit, truncate only the name to fit.
- If no usable section summary is available, use the workout name by itself. If the workout has no usable name, leave the description empty.

## Siri formatting and limits

- Use the same ordered, public section information as the share caption.
- Convert compact prescriptions into speech-friendly phrases where practical, including minutes, sets, repetitions, distance, calories, and weight.
- Introduce the requested day explicitly: `Today's workout is ...` or `Tomorrow's workout is ...`.
- Keep the spoken response concise by stopping at section or movement boundaries at 500 characters. Do not cut a word or prescription in half.
- For multiple assigned workouts, retain the current concise list of workout names and estimated durations rather than reading every section of every workout.
- If detailed section loading fails after assignments load, fall back to the existing workout name and duration response instead of failing the entire Siri request.
- Retain the current signed-out, expired-session, network-error, and no-assignment dialogs.

## Architecture and data flow

The existing `ShareWorkoutComposer` continues loading the workout through `useWorkoutDetail`. A pure TypeScript formatter converts that `WorkoutDetail` into a public summary model and renders the 180-character default description. The composer assigns the result only during its existing one-time initialization effect, preserving all subsequent member edits.

The native `FitboxWorkoutSummaryService` continues loading assignments through the mobile workout API. For a single assignment, it decodes the existing top-level `workout_id` and uses it with the stored Supabase URL, anonymous key, and member access token to load the same public section fields needed for summarization. A Swift formatter follows the same ordering, inclusion, and exclusion contract and renders speech-friendly sentences. The TypeScript and Swift implementations share a documented data contract and matching fixtures; JavaScript cannot be executed reliably by a background App Intent, so they do not share runtime code.

No database columns, persisted generated captions, or changes to the mobile workout API are required because its existing assignment payload already includes `workout_id`.

## Error handling

Missing or partial workout detail should produce the most useful safe result available: workout name only, a partial public summary, or an empty string. Description generation must not prevent the share composer from opening or sharing. Siri detail failures fall back to the already-loaded assignment name and duration; authentication and assignment failures retain their current user-facing dialogs.

## Testing

Unit tests for the pure formatter will cover:

- workout name plus ordered Strength and Metcon summaries;
- use of member-visible section notes for text-based Strength and Metcon programming;
- exclusion of block intent, scaling/foundations notes, and movement notes;
- fallback to workout name when there are no member-visible notes or structured movements;
- natural-boundary shortening to 180 characters;
- an empty result when neither a usable name nor public workout information exists.

The existing composer behavior will continue to ensure the default is assigned once, leaving the field editable and clearable.

Native tests will cover:

- decoding the workout ID required for section-detail loading;
- natural spoken summaries for member-visible Strength and Metcon notes;
- fallback to structured movements when member-visible notes are absent;
- the 500-character natural-boundary limit;
- fallback to name and duration when section-detail loading fails;
- unchanged signed-out, expired-session, and no-assignment responses.

The signed iOS artifact must continue embedding `ReadTodayWorkoutIntent` and `ReadTomorrowWorkoutIntent` in `Metadata.appintents/extract.actionsdata`.
