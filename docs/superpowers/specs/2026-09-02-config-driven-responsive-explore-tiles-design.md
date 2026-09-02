# Config-driven responsive Explore tiles

## Context

The member dashboard currently renders a static Explore action grid and a separate
Class filters chip section. The dashboard already receives the gym's configured
class-filter presets in `classFiltersDataState`, so the two surfaces can be
combined into one source-driven entry-point grid.

The approved direction is the dense responsive layout shown as option C in the
visual companion: sparse configurations keep larger two-column tiles, while
denser configurations use three columns without stretching the tiles.

## Requirements

1. Render Explore tiles from the gym's configured class-filter entries.
2. Remove the separate `Class filters` section and its chip presentation.
3. Keep `Leaderboard` as a built-in entry point and place it in the top-right
   grid position, regardless of the configured class-filter order.
4. Preserve existing behavior:
   - normal class-filter entries select the configured classes and locations,
     update the calendar title, and navigate to Calendar;
   - Leaderboard navigates to TrainingResults;
   - class entry-point availability continues to control whether class-filter
     entries are shown;
   - the existing loading state remains visible while filter configuration is
     loading, and the config-driven grid appears after loading completes.
5. Keep every Explore tile square using `aspectRatio: 1` (or equivalent
   measured geometry), including tiles with wrapped labels.
6. Use two columns for one through four visible Explore entries and three
   columns for five or more visible Explore entries.
7. On a narrow phone where three columns would not provide a usable tile width,
   fall back to two columns.
8. Keep the existing Fitbox palette and tile visual language.

## Proposed design

### Data and ordering

Create a dashboard-specific list from `classFiltersDataState`, first filtering
through the existing member-surface availability check. Ensure a Leaderboard
entry exists exactly once, independent of the API response. Reorder the list so
that Leaderboard occupies the last cell of the first row (`columns - 1`), then
fill the remaining cells in their configured sequence.

This gives the following behavior:

| Visible entries | Columns | First row |
| --- | ---: | --- |
| 2 | 2 | configured entry, Leaderboard |
| 4 | 2 | configured entry, Leaderboard |
| 5+ | 3 | configured entry, configured entry, Leaderboard |

When there is no configured class-filter entry, Leaderboard remains the only
entry point and is aligned in the top-right position of the two-column grid.

### Tile behavior

Reuse the existing `DashboardActionButton` visual component, extending its
input model only as needed for configured class-filter actions. Class-filter
tiles use the existing calendar icon treatment; Leaderboard uses the trophy
icon. The action callback is created from the entry's data, rather than from a
static list of action names.

### Responsive geometry

Extend `DashboardActionGrid` to accept a column count or derive it from the
visible item count and available width. The grid uses equal-width cells with a
consistent gap, and each button uses square geometry. The count-based rule is
the primary rule:

```text
visible entries < 5  => 2 columns
visible entries >= 5 => 3 columns
```

The width guard lowers three columns to two when the available content width
falls below the minimum width needed for a readable square tile. The grid must
not introduce horizontal scrolling or rectangular tiles.

### Empty/loading states

Keep the current loading skeleton while the class-filter request is unresolved.
Once loading completes, show the Explore heading and the config-driven grid. Do
not render the removed Class filters heading, chip wrappers, or duplicated
filter controls.

## Testing strategy

- Unit-test the ordering helper: Leaderboard is present once and occupies the
  top-right slot for both two- and three-column layouts.
- Unit-test the responsive column rule at four and five entries, including the
  narrow-width fallback.
- Update DashboardActionGrid tests to expect square cells and the selected
  column count.
- Update Dashboard tests or add focused pure-helper tests for configured
  class-filter navigation and removal of the legacy chip section.
- Run the relevant Dashboard Jest tests, TypeScript/lint checks, and the
  project verification commands before claiming completion.

## Non-goals

- No changes to the class-filter API or admin configuration editor.
- No changes to class-filter selection semantics.
- No new dashboard destinations beyond Calendar and TrainingResults.
- No release upload in this design step.
