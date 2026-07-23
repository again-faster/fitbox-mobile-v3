# Workout Studio Member parity contract

Status: active implementation contract

## Product boundary

The existing Fitbox app remains responsible for bookings, billing, messaging,
gym switching, waivers, and account management. Workout Studio remains a
deliberately segmented experience entered through the Training icon.

Inside Training, the mobile experience should provide complete Member and Solo
coverage for prescribed training, workout execution, results, wellness,
progress, wearables, coach communication, and entitled personal training tools.

## Training information architecture

The Training experience uses five stable destinations:

1. Today — readiness, today's work, wellness prompt, recent progress, coach notes.
2. Workouts — assignments, workout library, benchmarks, and entitled Build actions.
3. Wellness — check-in, trends, pain reports, injuries, consent and privacy.
4. Progress — results, PRs, maxes, benchmarks, consistency and volume trends.
5. More — coach notes, notifications, wearables, training profile and settings.

Bookings, billing, messaging, PT commerce, marketplace commerce, and gym account
administration should deep-link back to the original Fitbox experience rather
than being duplicated inside Training.

## Visual direction

Training uses a calm, data-led health and fitness language inspired by the
clarity of Fitbit while retaining Fitbox identity.

- Background: warm off-white / very light neutral.
- Surfaces: white cards, 16 px radius, subtle border, minimal shadow.
- Primary action: Fitbox training blue.
- Text: near-black charcoal with muted cool grey secondary text.
- Semantic colour: green completion/improvement, amber attention/recovery,
  red only for pain, genuine errors, and destructive actions.
- Typography: Inter for product UI and data; Montserrat only for selected Fitbox
  brand moments.
- Layout: 16 px page gutter, 12–16 px card padding, minimum 44 px touch targets.
- Cards show one primary idea or action; summaries lead to details.
- Workout execution prioritises action controls over dashboard-style cards.

## Cross-cutting acceptance criteria

Every Member surface must:

- Enforce access in Supabase/RPC/server code, never only in navigation.
- Respect the active tenant and Member/Solo persona returned by authentication.
- Apply entitlement and gym feature gates consistently with the web app.
- Provide loading, empty, error, offline, retry, and success states.
- Avoid duplicate writes through idempotency keys or conflict-safe operations.
- Meet 44 px touch targets, readable contrast, screen-reader labels and dynamic text.
- Work on both iOS and Android unless explicitly marked platform-specific.
- Emit analytics for entry, completion, failure and abandonment where appropriate.

## Feature matrix

| Domain | Web Member capability | Mobile state | Required outcome |
| --- | --- | --- | --- |
| Entry | Member/Solo gating | Implemented | Preserve Home → Training boundary and handle activation errors clearly. |
| Today | Greeting, assignments, program context, wellness, PRs, notes | Partial | Add readiness and sync state; retain action-first hierarchy. |
| Assignments | Due workouts and program context | Implemented | Verify pagination, overdue/upcoming states and tenant changes. |
| Workout detail | Sections, prescriptions, scaling, notes, leaderboard | Mostly implemented | Use server-backed scaling default and signed media URLs. |
| Run workout | Timers, wake lock, section/set logging | Partial | Add resumable state, clear wake-lock state and robust partial-result recovery. |
| Results | Scores, components, reactions, feedback, edit/delete | Partial | Complete component formats, edit/delete and feedback parity. |
| Benchmarks | Browse, detail, history and log result | Missing | Build first-class benchmark list/detail/log journey. |
| Maxes | RM ladder and manual entry | Partial | Add manual entry/edit and server-backed training profile linkage. |
| PRs | Filtered PR history | Implemented | Align scoring formats and time-window filters with web. |
| Progress | KPIs, RM charts, volume, heatmap, benchmark history | Missing | Build unified Progress destination with 30/90/365/all filters. |
| Training profile | Scaling preference and RM profile | Missing | Read/write athlete scaling and show completion state. |
| Wellness | Consent, check-in, notes, pain, trends, history | Partial | Add notes, pain/contact, withdrawal, delete/replace and history. |
| Offline wellness | Queue, retry, idempotency and queued state | Missing | Implement secure durable queue and conflict-safe replay. |
| Injuries | Register, sharing and daily recovery updates | Implemented | Verify edit/resolve flows and privacy copy. |
| Coach notes | Inbox and read state | Implemented | Verify deep links and bulk/single read behaviour. |
| Notifications | Inbox and read state | Partial | Add Workout Studio push/realtime routing and deep links. |
| Gym Feed | Results and reactions | Implemented | Verify write parity and pagination. |
| Custom Workouts | Entitlement, builder and scheduling | Partial | Complete sections, schemes, scoring, templates, versions and media. |
| Personal programs | Build/schedule programs if product scope remains | Missing | Confirm scope before implementation. |
| Apple Health | Native permission and ingest | Partial | Add unified connection status, errors, recent sessions and attachment. |
| Health Connect | Native Android ingest | Missing | Implement Android permission, sync and management experience. |
| WHOOP | OAuth connection and sync | Missing | Add mobile connection management and status. |
| Fitbit | OAuth connection and sync | Missing | Add mobile connection management and status. |
| Readiness | Daily metrics and wearable readiness | Missing | Add Today summary and detailed wearable view. |
| Session attachment | Attach wearable session to workout result | Missing | Add post-result and result-detail attachment flow. |
| Challenges | Member challenge participation | Missing | Add after the core daily loop and Progress are stable. |
| Weekly recap | Member digest | Missing | Add to Progress/Today with notification deep link. |
| Settings | Units, timer, consent, wearables, disconnect | Partial | Persist preferences; add confirmations and privacy controls. |

## Delivery order

1. Authentication and API/session foundation.
2. Today → Workout → Run → Log → Result vertical slice.
3. Wellness, pain, injuries and offline queue.
4. Unified Wearables and readiness.
5. Progress, benchmarks and training profile.
6. Custom Workouts and confirmed personal-program scope.
7. Challenges, recap, notifications and remaining extensions.
8. Accessibility, analytics, automated tests and release verification.

## Definition of parity

Parity does not require identical web and mobile layouts. It means a Member can
complete the same meaningful task, see the same authoritative data, encounter
the same access rules, and understand the same privacy consequences. Mobile may
use native interaction patterns and may deep-link to the original Fitbox app for
capabilities outside the Training product boundary.
