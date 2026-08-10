# Fitbox Member UI Consistency Design

**Date:** 2026-08-10

**Goal:** Give the legacy member experience and all Workout Studio member features one coherent visual language without changing business logic, service contracts, or navigation behavior.

## Approved direction

The refreshed member/training visual system is the source of truth. It is represented by `memberTheme` and the derived `trainingTheme` in the mobile app. Legacy coach, admin, commerce, authentication, and account-specific surfaces remain behaviorally unchanged and are only migrated when they share member-facing UI primitives.

The current split is explicit:

- Legacy surfaces use the original theme configuration, atom components, Montserrat typography, compact metrics, and older card/button treatments.
- Workout Studio surfaces use `memberTheme`/`trainingTheme`, Inter typography, larger rounded surfaces, and screen-local copies of cards, buttons, headings, and state views.
- Several new screens still contain hardcoded colors and raw React Native text styles that drift from the shared tokens.

## Design system foundation

`memberTheme` becomes the canonical member-facing token set. Extend it with:

- typography roles for display, screen title, section title, body, label, metadata, and button text;
- control sizes and touch-target constants;
- semantic surface, success, warning, danger, disabled, and informational colors;
- screen gutter, section gap, card padding, and control spacing roles;
- shared border and shadow variants.

`trainingTheme` remains a compatibility alias for Workout Studio code. It must derive values from `memberTheme` instead of defining parallel values. The existing legacy `config` remains available for non-member surfaces, but member-facing migrations must not add new dependencies on it.

## Shared primitives

Create focused primitives under `src/components/member/`:

- `MemberText`: Inter-based semantic text roles with consistent color, weight, size, and line-height defaults.
- `MemberCard`: shared surface, bordered, elevated, soft, and accent variants.
- `MemberButton`: primary, secondary, outlined, quiet, danger, disabled, and compact variants with a 44–48pt minimum touch target.
- `MemberScreen`: safe-area-aware background and standard screen gutters/content spacing.
- `MemberSection`: heading, optional action, and section spacing contract.
- `MemberStatusPill`: semantic status colors and accessible state labels.

Primitives must accept normal React Native style overrides for screen-specific layout without allowing screens to redefine the core visual contract. They must use `memberTheme`, support the existing light/dark context where applicable, and expose accessibility roles/states consistently.

## Migration scope

Migrate the shared shell and high-traffic member surfaces first:

- Legacy: Dashboard, sessions/bookings, results/performance, notifications, and member profile entry points.
- Workout Studio: Today, Wearables, Apple Health, Progress, Weekly Recap, Notifications Inbox, Results, Workouts, More, Wellness, Injuries, Bookings, and sharing flows.

The migration will standardize:

- screen background, safe-area behavior, headers, back affordances, and horizontal gutters;
- Inter typography and the approved hierarchy of display, title, section, body, label, and metadata roles;
- the 4/8/12/16/24/32 spacing rhythm;
- 18–24pt card radii, borders, and shadows;
- 44–48pt minimum controls and consistent pressed/disabled states;
- loading, empty, error, offline, success, and destructive states;
- section headings, action labels, status pills, and accessibility labels.

Business logic, navigation destinations, feature flags, data fetching, persistence, and service contracts remain unchanged. Visual-only changes must not alter server payloads or state transitions.

## Hardcoded-style policy

Changed member-facing screens must use theme tokens for colors, spacing, radii, typography, and control dimensions. Literal white/black values are allowed only when they are semantic on-primary/on-dark content and should be represented by named theme tokens where a reusable primitive needs them. Illustration/confetti palettes may remain local because they are decorative rather than UI system tokens.

## Validation and rollout

Add or extend tests for:

- theme token and primitive variants;
- typography, spacing, state, touch-target, and accessibility contracts;
- representative legacy and Workout Studio screen states: loading, empty, error, offline, connected, success, and disabled;
- visual migration helpers that normalize screen-level styling without changing navigation or data behavior.

Run, where dependencies are available:

- `npm run check-types -- --pretty false`;
- focused Jest tests for the new primitives and migrated screens;
- the full Jest suite;
- `npm run lint` with no new errors in changed files;
- a raw-color/font/spacing audit over the migrated member surfaces;
- a visual comparison of Dashboard, Today, Wearables, Progress, Weekly Recap, Notifications, and Results.

The work is performed in an isolated branch from the latest mobile `master`. The pre-existing local-only changes in `src/navigators/Application.tsx`, `src/utils/Constant.ts`, `metro-verify.err.log`, and `metro-verify.out.log` must not be staged, changed, or removed. The `fitbox-web-v2` repository is out of scope.

