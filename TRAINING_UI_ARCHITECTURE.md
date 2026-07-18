# Workout Studio mobile UI architecture

This document defines the low-fidelity structure for the native Member/Solo
Training experience. It preserves the existing Fitbox application shell and
the deliberate Home → Training product boundary.

## Navigation model

Training opens as a contained experience with its own five destinations:

| Destination | Purpose | Primary action |
| --- | --- | --- |
| Today | Answer “what should I do now?” | Start or continue today's workout |
| Workouts | Find prescribed, benchmark and personal workouts | Open or build a workout |
| Wellness | Check in and manage recovery context | Complete today's check-in |
| Progress | Understand change over time | Explore a metric or log a benchmark |
| More | Reach secondary training tools | Context-dependent |

The original Fitbox tab bar should not compete with Training navigation while
the user is inside the experience. Training must provide a clear Back to Fitbox
or Home control that preserves state.

## Screen 1 — Today

```text
Good morning, Sam                         Bell
Saturday, 11 July

┌ Readiness ────────────────────────────────┐
│ 78  Ready to train                        │
│ Sleep 7h 24m · HRV stable · synced 8:10  │
└───────────────────────────────────────────┘

TODAY'S TRAINING
┌ Strength + Conditioning ─────────────────┐
│ Week 3 of 8 · Day 2 · ~48 min            │
│ Front squat · Row intervals · Core       │
│                          [Start workout]  │
└───────────────────────────────────────────┘

┌ Wellness ────────────────────────────────┐
│ How are you feeling today?               │
│                             [Check in]    │
└───────────────────────────────────────────┘

THIS WEEK
┌ Consistency ───────┐ ┌ Latest PR ───────┐
│ 3 of 4 sessions    │ │ Back squat 120 kg │
└────────────────────┘ └───────────────────┘

┌ Coach note ──────────────────────────────┐
│ “Keep the final sets around RPE 8…”      │
└───────────────────────────────────────────┘

 Today     Workouts     Wellness     Progress     More
```

Rules:

- Today's primary workout owns the strongest action on the page.
- Readiness is hidden when no real wearable data exists; never fabricate a score.
- Empty training state offers Browse Workouts and Build only when entitled.
- Completed wellness collapses to a quiet confirmation row.
- Cards provide summaries; tapping opens detail.

## Screen 2 — Workout detail

```text
‹ Workouts                           More

Strength + Conditioning
Week 3 of 8 · Day 2
~48 min

Scaling
[ Rx ] [ Scaled ] [ Foundations ]
Your saved level: Scaled

WARM-UP · 8 MIN
┌ 3 rounds                                  │
│ 10 air squats                             │
│ 8 push-ups                                │
└───────────────────────────────────────────┘

STRENGTH · 20 MIN
┌ Front squat                               │
│ 5 × 5 · Suggested 82.5 kg                 │
│ Coach: Keep two reps in reserve           │
└───────────────────────────────────────────┘

CONDITIONING · 15 MIN
┌ 4 rounds for time                         │
│ 400 m row · 12 wall balls                 │
└───────────────────────────────────────────┘

              [Start workout]
```

Rules:

- Scaling begins with the server-backed athlete preference, then gym default.
- Section structure is scannable without opening every block.
- Suggested loads are labelled as suggestions, never prescriptions.
- Coach notes remain adjacent to the relevant section or movement.
- The primary action stays reachable without obscuring content.

## Screen 3 — Active workout

```text
Exit                         1 of 3 sections

STRENGTH
Front squat
5 sets × 5 reps

                 02:14
              Rest remaining

Set       Weight       Reps       RPE
 1         80 kg         5         7     ✓
 2         82.5 kg       5         8     ✓
 3        [82.5]        [5]       [ ]

             [Complete set]

Previous: 80 kg × 5 · RPE 8
Coach: Keep two reps in reserve
```

Rules:

- One dominant action per state.
- Inputs are large enough for use during training.
- Current set, section progress and save state remain visible.
- Draft workout state is persisted locally and recoverable after interruption.
- Wake lock, offline and unsynced states are visible and understandable.
- Exiting an incomplete workout requires a Save and exit / Discard decision.

## Screen 4 — Wellness

```text
Wellness
Private by default · Learn more

How are you feeling today, Sam?

Energy                                      4
Low        ─────────────●──────       High

Sleep quality                               3
Poor       ─────────●──────────       Great

Soreness                                    2
None       ─────●──────────────       Severe

Anything worth remembering?
[ Tight shoulders after yesterday's presses ]

Are you experiencing pain?
[ No ]  [ Yes, add a pain report ]

                [Save check-in]

YOUR TREND
Energy        ↑ Improving
Sleep         → Steady
Soreness      ↓ Improving

My injuries                                      ›
Consent and privacy                               ›
```

Rules:

- Dimension endpoints use plain-language labels, not unexplained numbers.
- Wellness remains supportive and deliberately avoids streak pressure.
- Pain reporting is available in the same flow but visually distinct.
- Offline saves show Queued, then Synced; failures offer Retry.
- Consent can be reviewed and withdrawn without contacting support.

## Screen 5 — Progress

```text
Progress
[30 days] [90 days] [1 year] [All]

┌ Training consistency ─────────────────────┐
│ 12 sessions · 86% of plan                 │
│ ▂ ▃ ▅ ▅ ▆ ▇                               │
└───────────────────────────────────────────┘

┌ Strength progress ────────────────────────┐
│ Back squat                  +7.5 kg        │
│ 100 ────────╮                            │
│  90 ────╮   ╰────                         │
└───────────────────────────────────────────┘

┌ Recent PRs ───────────────────────────────┐
│ Back squat · 120 kg                 8 Jul │
│ Fran · 4:32                         2 Jul │
└───────────────────────────────────────────┘

Benchmarks                                      ›
My maxes                                        ›
Workout history                                 ›
```

Rules:

- Default to 90 days for meaningful signal without excessive history.
- Charts always include a textual summary and accessible values.
- Use encouraging factual language; do not invent causal health claims.
- Empty states lead directly to the action that creates the first data point.

## More destination

Group secondary features rather than presenting one long undifferentiated list:

- Coaching: Coach Notes, Notifications.
- Health data: Wearables, Injuries, Wellness privacy.
- Training setup: Training Profile, Scaling, Units, Timer preferences.
- Personal tools: Custom Workouts, subscriptions/entitlement status.
- Support: Training help, Send feedback, Disconnect Training.
- Fitbox links: Bookings, billing and other original-app capabilities when relevant.

## Shared component vocabulary

Build or standardise these before broad screen rewrites:

- `TrainingScreen`
- `TrainingHeader`
- `TrainingCard`
- `MetricCard`
- `SectionHeading`
- `PrimaryButton` / `SecondaryButton` / `DestructiveButton`
- `StatusPill`
- `EmptyState`
- `ErrorState`
- `OfflineBanner`
- `SyncStatus`
- `SkeletonCard`
- `TrainingBottomTabs`

## Motion and feedback

- Use short, restrained transitions that clarify hierarchy.
- Reserve celebration for genuine achievements such as a PR or completed challenge.
- Respect Reduce Motion.
- Use haptics for completed sets, successful saves and timer completion, not every tap.
- Never rely on colour alone to communicate completion, pain or sync failure.

## Implementation checkpoint

The first visual implementation slice is Today → Workout Detail → Active Workout
→ Result. It should establish tokens and shared components without redesigning
the original Fitbox bookings/billing shell.
