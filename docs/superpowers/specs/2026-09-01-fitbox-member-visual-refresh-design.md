# Fitbox member visual refresh

## Goal

Bring the member-facing V3 screens into one Fitbox visual system. The home dashboard, Attendance, Switch Gym, Memberships, and related Menu screens should feel like the same product: generous spacing, clear alignment, light lavender surfaces, and Fitbox violet as the primary action color.

The supplied screenshots are visual references, not pixel-perfect device specifications. Existing live data, navigation behavior, and gym-provided imagery remain authoritative.

## Approved visual direction

Use the shared Fitbox palette direction:

- Primary member accent: `#7775E6` (`memberTheme.colors.primary` / `config.colors.brand`).
- Page background: existing light `#F8F8FC` member background.
- Cards and controls: existing white surface and soft lavender surface tokens.
- Success/current state: existing green token and green current-status pill.
- Text: existing member ink/text/muted tokens.

Do not globally replace the deep accent token. Training-specific surfaces may continue to use their own deeper treatment. Replace deep maroon usage only where it is a member-facing Menu, Switch Gym, Membership, payment, or settings action/surface.

## Home dashboard

1. Make the gym banner edge-to-edge within the screen width, preserving the supplied image with `cover` behavior and a stable responsive height.
2. Put the banner in an outer layout wrapper that allows the logo to overlap below its lower edge without clipping.
3. Keep the gym logo square with a fixed aspect ratio, white backing, border, and shadow. The logo may extend below the banner but must remain visible above the page content.
4. Remove the `Here is your training at a glance` subtitle.
5. Keep the greeting, attendance card, and Explore content aligned to one horizontal page inset.
6. Replace number-dependent padding hacks in the attendance card with equal-width metric cells. Each visible metric gets a centered icon/value row and centered label, so one-, two-, and three-digit values occupy the same visual grid.
7. Preserve conditional attendance metrics and live attendance-goal data. Do not hardcode the screenshot values.
8. Retain existing Explore actions and improve vertical rhythm around the greeting, attendance card, and section heading without changing their navigation behavior.

## Attendance screen

Use the supplied Attendance screenshot as the layout model while retaining the existing live graph and goal data.

- Replace the generic top copy with a Fitbox-purple gradient header containing a back affordance, `Attendance`, and `Track your visits and build consistency.`.
- Use a white rounded goal card with the purple progress ring, dark text, clear goal metadata, remaining visits, and an outlined Edit control.
- Keep the Month/Year switch as a two-option pill control. Selected state uses Fitbox violet; unselected state uses white/soft lavender surfaces.
- Present the trend graph in a white rounded card with consistent internal padding, a year selector, a purple bar series, readable axis labels, and a stable chart height across phone widths.
- Place the summary statistics in a balanced two-column area below the chart, with icon circles using soft lavender surfaces.
- Present the monthly summary as a white rounded card with two balanced columns of month/value rows and a violet outlined year action where the existing navigation supports it.
- Keep the existing global bottom navigation structure unchanged. The labeled bottom bar in the reference is treated as a visual hierarchy reference, not a request to redesign all application tabs.
- Continue using the API values and current-month/year selection; do not use screenshot data as fixtures in production UI.

## Switch Gym

- Use the member background, white gym rows, soft lavender intro surface, and shared borders/radii already established by `memberTheme`.
- Change the intro icon and Add Gym CTA from maroon to `#7775E6`.
- Keep the green Current badge and check icon as success semantics.
- Preserve gym logos, gym selection behavior, modal navigation, and the existing close/header treatment.

## Menu and member detail pages

Apply the approved violet accent to member-facing pages reached from Menu, including:

- Menu icons and the Menu hero icon.
- Memberships feature icons, Add Membership/View actions, and Membership detail hero card.
- Payment and related member action buttons.
- Notifications, waivers, help, About, Switch User, and other member settings controls that currently use the maroon deep accent.

Use the existing light lavender surfaces and white cards for hierarchy. Keep text, borders, loaders, and status colors semantically assigned. Avoid changing Workout Studio training cards or unrelated brand colors.

## Functional compatibility

Fitbox IQ owns the legacy Calendar, Bookings, and Session surfaces. These remain available independently of the newer Workout Studio `classes` feature flag. The visual refresh must not reintroduce feature gating for those paths.

V2 remains out of scope; all changes apply only to the Fitbox V3 mobile app.

## Implementation notes

- Prefer existing `memberTheme` tokens and shared member components over new one-off colors.
- Keep the existing data-fetching and navigation contracts intact.
- Make layout changes responsive to narrow Android screens and larger iOS/iPad surfaces.
- Keep accessibility labels and button roles on all revised actions.
- Preserve unrelated working-tree changes in `Application.tsx`, `Constant.ts`, and existing local verification artifacts.

## Verification

- Add or update focused tests for any extracted layout/palette policy helpers.
- Run the relevant Jest tests and the full Jest suite.
- Run TypeScript checking.
- Run lint; if the workspace dependency mismatch still prevents ESLint startup, report that separately rather than masking it.
- Review the affected screens in the local app/browser at narrow phone dimensions and compare the spacing, logo visibility, metric alignment, and violet treatment against the supplied references.
