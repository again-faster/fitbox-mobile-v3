# Mobile Member Feature Flags Design

Date: 2026-07-30

## Objective

Make `fitbox-mobile-v3` honor Workout Studio's resolved member feature flags for the active tenant. Mobile navigation, composite hubs, controls, and deep links must hide or block the same member-facing capabilities as the web app while preserving the core Fitbox experience.

The source of truth is:

`GET https://studio.fitbox.iq/api/public/mobile/features?tenantId=<uuid>`

The request uses the member's Workout Studio Supabase bearer token. The expected response is:

```json
{
  "ok": true,
  "data": {
    "tenant_id": "uuid",
    "features": {
      "classes": true,
      "results": false
    }
  }
}
```

The server returns a complete 22-key map. Unknown keys are ignored so the server can add flags before mobile supports their surfaces.

## Product Semantics

### Classes are the physical-gym minimum

The `classes` flag controls one combined capability:

- class timetable;
- class details;
- booking and cancelling class attendance;
- class/session entry points in the dashboard and calendar.

Existing gyms must retain class access during migration. New gyms begin with `classes` enabled as the minimum physical-gym experience. An online gym can explicitly disable `classes` while retaining assigned workouts, online coaching, progress, and other enabled capabilities.

### Service bookings are separate

The `bookings` and `my_bookings` flags apply only to Workout Studio services such as personal training, treatments, and resources. They do not control class booking.

### Features outside this contract

Fitbox gym memberships, billing, payment methods, waivers, inbox, notifications, and the existing gym shop are not Workout Studio member features and remain available. Workout Studio Marketplace and programming subscriptions do not currently have native mobile surfaces.

## Architecture

### Central provider

Add one provider above the main tab navigator. It owns:

- the active Workout Studio session and tenant identity;
- the resolved feature map;
- the cache and refresh lifecycle;
- `isEnabled(feature)` and loading/source metadata.

This avoids separate network requests and divergent fallback behavior across screens. `TrainingRoot` will consume the shared session instead of independently exchanging credentials. Session bootstrap must be deduplicated so app startup and navigation cannot perform concurrent exchanges.

### Types and parsing

Mobile declares the same 22 stable keys as Workout Studio:

- Training: `custom_workouts`, `results`, `my_maxes`, `prs`, `progress`, `benchmarks`, `training_profile`.
- Engagement: `challenges`, `digest`, `badges`, `adaptive_goals`, `feed`, `streaks`.
- Wellbeing: `wellness`, `pain_reports`, `wearables`.
- Bookings: `bookings`, `my_bookings`.
- Commerce: `marketplace`, `subscriptions`.
- Coaching: `coach_notes`, `classes`.

A validated server response is normalized into a complete map. Missing or non-boolean known keys resolve to `false` after a successful response, matching the server's fail-closed resolver. The distinct first-load fallback is an explicit all-enabled map, not a permissive parser.

### Tenant-scoped cache

Persist the last successful map in MMKV under a versioned key containing the tenant UUID. Never reuse one tenant's flags for another tenant.

Load order:

1. Identify the active tenant from the Workout Studio session.
2. Render its cached map immediately when present.
3. If no cache exists, render the explicit all-enabled first-load fallback.
4. Refresh in the background.
5. Replace and persist the map only when the response is valid and its `tenant_id` matches the request.

Refresh after authentication, active-gym changes, manual retry, and when the app returns to the foreground after the stale interval. A failed refresh keeps the last cached or first-load map and does not remove navigation during an outage.

## Mobile Surface Mapping

### Primary navigation and classes

- `classes`: include or remove the main class Calendar tab and class/session entry points.
- Training Today and assigned workout lists remain available because there is no general workouts flag.
- Disabling classes must not remove non-class workout assignments.

### Workout viewing and result logging

- Workout descriptions remain readable regardless of `results`.
- `results=false` removes start/finish workout actions, section-score controls, result forms, Results history, Result Detail, and workout-share entry points.
- Direct links to result-only routes render the disabled-feature state.

### Progress hub

The current My Progress screen aggregates independently flagged features. It must filter its contents rather than applying one blanket gate:

- charts and KPIs require `progress`;
- My Results and recent result activity require `results`;
- My PRs requires `prs`;
- My Maxes requires `my_maxes`;
- Benchmarks requires `benchmarks`;
- Weekly Recap requires `digest`.

Show the My Progress entry point when at least one of these capabilities is enabled. If only child capabilities are enabled, the hub displays its filtered Explore links without disabled charts or queries.

### Wellbeing

- `wellness`: wellness consent, check-ins, trends, and queued wellness synchronization.
- `pain_reports`: injury/pain list, logging, and daily update routes.
- `wearables`: Wearables and Apple Health entry points.

Wellness and pain reporting are independently reachable. If wellness becomes disabled while offline entries are queued, retain the encrypted entries but do not synchronize them until the flag is enabled again.

### Services and coaching

- `bookings`: service discovery and creation/rescheduling controls.
- `my_bookings`: upcoming and past service bookings.
- The Bookings hub remains visible when either is enabled and filters its tabs/actions accordingly.
- `coach_notes`: Coach Notes entry point and route.
- `feed`: Gym Feed entry point and route.
- `training_profile`: Training Profile entry point and route.
- `custom_workouts`: builder and scheduling routes, except an existing sponsored/active entitlement continues to grant access as it does on web.

### Flags without native mobile surfaces

`challenges`, `badges`, `adaptive_goals`, `streaks`, `marketplace`, and `subscriptions` are cached and exposed but do not alter unrelated legacy Fitbox screens. They can be connected when native surfaces are introduced.

## Route Protection and Disabled State

Hiding menu items is not sufficient. Every flagged route gets a guard that checks the provider before rendering member data. Disabled deep links render a consistent state:

- title: `Feature unavailable`;
- message: `Your gym hasn't enabled this feature for members.`;
- primary action: return to Training Today or the nearest safe parent.

Composite screens guard individual data queries and actions so disabled features do not fetch or briefly flash. Staff behavior is not changed by this mobile member integration.

## Error Handling

- `401`: reconcile or refresh the Workout Studio session once, then retry once.
- `403`: keep the last-known map and record the refresh failure; do not substitute another tenant.
- malformed success payload or tenant mismatch: reject it and preserve the current map.
- network/server failure: preserve cached or first-load state and expose retry metadata without a blocking alert.
- server-side `feature_disabled`: show the disabled state and refresh flags, because the server may have changed since the last cache load.

UI gating is not authorization. Sensitive writes still require server-side enforcement.

## Testing

Unit tests cover:

- complete-map normalization and unknown-key tolerance;
- explicit all-enabled first-load fallback;
- cache persistence and tenant isolation;
- malformed and wrong-tenant response rejection;
- cached-state retention on refresh failure;
- route-to-feature and composite-hub mapping;
- result controls when `results` is disabled;
- independent wellness and pain-report behavior;
- independent service-booking tabs;
- gym/session switching and refresh deduplication.

Integration checks cover a physical gym with only `classes` enabled, an online gym with `classes` disabled, selective feature changes, deep links, offline startup, and returning to the foreground.

## Web Review Findings and Required Follow-up

Review of Workout Studio commit `d34f6f2109270e9d2e04ec4c5aff8ed2d0ecd16c` found three contract gaps:

1. Migration `20260730055023_60433cdb-85f9-4e3d-ae29-7b5a92db5d53.sql` only backfills `marketplace`, `subscriptions`, and `custom_workouts`. All other keys resolve to `false`, so it does not preserve existing-gym behavior. A corrective additive migration must enable previously available features for existing gym tenants and establish `classes=true` for new physical-gym defaults.
2. No committed mobile endpoint returns `feature_disabled`; the promised server-side enforcement for result logging, wellness writes, and bookings is not present. These controls need authorization checks independent of mobile UI gating.
3. The features response does not contain the planned `version` or `updated_at`. The mobile design does not depend on them, but they should be added if explicit cache invalidation or contract versioning is required later.

The mobile implementation can consume the current endpoint safely, but these web/server findings must not be described as already end-to-end.

## Acceptance Criteria

- Mobile uses the active tenant's resolved feature map and remembers its last successful value per tenant.
- A first-ever endpoint failure leaves existing mobile capabilities visible.
- Physical gyms can operate with Classes as the minimum product; online gyms can disable Classes.
- Class booking is controlled only by `classes`, never by service-booking flags.
- Disabled capabilities disappear from navigation and cannot be opened through deep links.
- Composite hubs retain enabled children and avoid disabled queries/actions.
- Legacy Fitbox membership, billing, messaging, and shop surfaces are unaffected.
- Web/server gaps are tracked separately and are not hidden by client-side gating.
