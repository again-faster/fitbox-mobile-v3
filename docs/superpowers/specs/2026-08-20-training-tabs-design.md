# Member Training Tabs Design

**Date:** 2026-08-20  
**Repository:** `again-faster/fitbox-mobile-v3`  
**Audience:** Members using the mobile Training experience

## Goal

Reduce the visual density of the member Training landing page by moving optional feature content into a compact tab model. A tab is visible only when its feature is enabled and the destination has meaningful content or an immediate member action.

The design preserves the existing Fitbox application shell and global bottom navigation. It changes only the contained Training experience.

## Selected approach

Use a shared, horizontally scrollable `TrainingTabBar` across the primary Training destinations. Each tab maps to an existing stack destination or a small hub screen, and peer-tab changes use `navigation.replace` so repeated tab switches do not grow the back stack.

This approach was selected over:

1. A single large screen that mounts every feature panel and swaps local state. That would tightly couple independent screens and load unnecessary data.
2. A new nested top-tab navigator dependency. That would add navigation complexity and a package dependency for behavior the existing stack can provide.

## Tab model

The ordered tab set is:

1. **Today**
2. **Progress**
3. **Readiness**
4. **Wellness**
5. **More**

The rail is horizontally scrollable at narrow widths and uses native tab accessibility roles and selected state. If Today is the only visible destination, the entire tab rail is hidden.

### Today

Today is always available and remains the default Training destination.

It contains only:

- The member's immediate workout or the existing actionable empty state.
- Any in-progress workout continuation action.
- The compact weekly attendance goal.

Progress, readiness, wellness, recent PRs, recap, and secondary feature cards are removed from Today because they belong to their destination tabs.

### Progress

Progress is eligible when at least one of these flags is enabled:

- `progress`
- `results`
- `prs`
- `my_maxes`
- `benchmarks`
- `digest`

It is visible only when at least one enabled progress capability has member content, such as a workout result, PR, max, benchmark result, progress summary, or weekly recap snapshot.

The tab opens the existing Progress experience, filtered by the existing child feature flags. If all available progress content is deleted or becomes unavailable, the tab disappears on the next availability refresh.

### Readiness

Readiness is eligible when `wearables` is enabled.

It is visible only when the current readiness response contains real provider-backed readiness or recovery data. Loading, unavailable, no-connection, and insufficient-data states do not make the tab visible.

Members can still connect or manage a wearable through More while the Readiness tab is hidden. No readiness score or placeholder content is fabricated.

### Wellness

Wellness is eligible when either `wellness` or `pain_reports` is enabled.

It is visible whenever at least one enabled module provides an immediate member action:

- `wellness`: complete or update today's check-in.
- `pain_reports`: view, create, or update a pain/injury report.

The tab opens a lightweight Wellness hub that displays only enabled modules and links to the existing Wellness and Pain & Injuries flows. If neither module is enabled, the tab is absent.

### More

More contains secondary enabled Training tools that have not been promoted to their own tabs. It uses the existing feature-filtered grouping logic.

The More tab is visible only if at least one secondary item remains after filtering. Wearable connection and management remains available here whenever `wearables` is enabled, including when Readiness is hidden for lack of data.

## Availability model

Create a focused `useTrainingTabAvailability` hook that combines:

- The existing member feature map.
- Lightweight, cached content-presence queries.
- The existing readiness response.
- Existing entitlement state where required.

The hook returns an ordered list of visible destinations rather than exposing raw query details to the UI:

```ts
type TrainingTabKey =
  | 'today'
  | 'progress'
  | 'readiness'
  | 'wellness'
  | 'more';

type TrainingTabAvailability = {
  status: 'loading' | 'ready';
  visibleTabs: TrainingTabKey[];
};
```

Content-presence requests must fetch only enough information to establish that at least one relevant record exists. They share React Query cache keys with destination data where practical and must not download full history solely to decide tab visibility.

## Loading, refresh, and fallback behavior

- While feature flags or availability are loading, show Today without the tab rail. Do not briefly show tabs that may disappear.
- Once availability is ready, reveal the final tab set without animation that shifts content vertically.
- If a selected tab becomes unavailable after a feature refresh or data deletion, replace it with Today.
- A failure in an optional availability query hides only the affected optional tab. It must not block Today.
- Pull-to-refresh on a primary Training destination invalidates availability along with that destination's existing queries.
- Tab visibility is recalculated after completing a workout, recording or deleting a result, updating a max or PR, syncing readiness, completing a wellness action, and refreshing feature flags.

## Navigation and presentation

- `TrainingTabBar` is a shared member component rendered beneath each primary Training header.
- Today keeps the personalised greeting and date.
- Other primary destinations use concise titles while preserving the same tab rail position.
- Tab presses use `navigation.replace` between peer destinations.
- Detail screens such as Workout Detail, Active Workout, Result Detail, Wearable setup, and Wellness forms do not show the tab rail.
- The existing global Fitbox bottom navigation remains unchanged.

## Accessibility

- Each tab uses `accessibilityRole="tab"` and `accessibilityState={{ selected }}`.
- Labels remain visible; icons are not required to understand destinations.
- The horizontal rail supports native scrolling and does not truncate labels.
- Focus moves to the destination heading after a tab change.
- Hidden tabs are removed from the accessibility tree rather than disabled.

## Components and responsibilities

### `TrainingTabBar`

Renders the supplied visible destinations, selected destination, and press callbacks. It contains no feature or data-fetching logic.

### `useTrainingTabAvailability`

Owns feature-to-tab policy, content-presence checks, caching, and safe fallback behavior.

### `TrainingWellnessHub`

Composes enabled Wellness and Pain & Injuries entry points. It does not duplicate the existing forms or history screens.

### Primary destination screens

Today, Progress, Readiness, Wellness hub, and More render the shared tab bar and keep their existing domain-specific data and actions.

## Testing

Unit tests cover:

- The exact feature and content rules for every tab.
- Progress visibility for each child feature and content type.
- Readiness hidden for unavailable, unconnected, and insufficient states.
- Wellness visibility for wellness-only, pain-only, both, and neither.
- More visibility after secondary-item filtering.
- The one-tab case hiding the complete tab rail.
- Safe fallback to Today when the selected destination disappears.

Component tests cover:

- Tab order, labels, accessibility roles, and selected state.
- Pressing a peer tab uses replacement navigation.
- Today no longer renders Progress, Readiness, Wellness, recap, or recent-PR cards.
- Availability loading does not flash optional tabs.

The existing full Jest suite and TypeScript checks must pass before release. The final change must also be exercised on a physical iOS device before creating a new TestFlight build.

## Out of scope

- Changes to the global Fitbox bottom navigation.
- New feature flags or admin controls.
- Redesigning the detailed Progress, Readiness, Wellness, Pain & Injuries, or More screens.
- Backend scoring changes or fabricated readiness values.
- Changes to `fitbox-web-v2`.

