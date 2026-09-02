# Config-driven responsive Explore tiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard’s static Explore actions and duplicate Class filters section with a responsive, config-driven grid of square class-filter tiles.

**Architecture:** Keep class-filter normalization, Leaderboard insertion, ordering, and column selection in a pure Dashboard Explore helper so the behavior can be tested without mounting the full dashboard. Keep `DashboardActionGrid` responsible for layout and `DashboardActionButton` responsible for tile presentation, while `Dashboard.tsx` supplies configured entries and existing navigation callbacks.

**Tech Stack:** React Native 0.76, TypeScript, React Native Testing Library, Jest, Zustand dashboard state, `react-native-vector-icons`, existing Fitbox member theme.

---

## File map

- Create: `src/screens/Dashboard/components/DashboardExplore.ts` — pure class-filter normalization, Leaderboard ordering, and responsive column rules.
- Create: `src/screens/Dashboard/components/DashboardExplore.test.ts` — unit tests for the pure Explore rules.
- Modify: `src/screens/Dashboard/components/DashboardActionGrid.tsx` — remove static action definitions and make the grid responsive, square, and Leaderboard-aware.
- Modify: `src/screens/Dashboard/components/DashboardActionGrid.test.tsx` — test responsive cell widths, square geometry, and the generic grid callback.
- Modify: `src/screens/Dashboard/components/DashboardActionButton.tsx` — support compact three-column tiles while preserving the current two-column visual treatment.
- Modify: `src/screens/Dashboard/Dashboard.tsx` — source actions from `classFiltersDataState`, normalize Leaderboard once, remove the legacy chip section, and preserve class-filter/Leaderboard navigation.
- Modify: `docs/superpowers/specs/2026-09-02-config-driven-responsive-explore-tiles-design.md` — already completed and committed; use it as the acceptance criteria.

### Task 1: Add pure Explore configuration and layout rules

**Files:**
- Create: `src/screens/Dashboard/components/DashboardExplore.ts`
- Test: `src/screens/Dashboard/components/DashboardExplore.test.ts`

- [ ] **Step 1: Write the failing tests for normalization, pinning, and breakpoints**

Create the test file with the following cases and fixtures:

```ts
import type { ClassFiltersDataType } from '@/types/schemas/session';

import {
  ensureLeaderboardClassFilter,
  getDashboardExploreColumnCount,
  orderDashboardExploreEntries,
} from './DashboardExplore';

const filter = (id: number, name: string): ClassFiltersDataType => ({
  classIds: [id],
  id,
  isDefault: false,
  locationIds: [],
  name,
});

describe('Dashboard Explore rules', () => {
  it('adds exactly one built-in Leaderboard entry without mutating config order', () => {
    const result = ensureLeaderboardClassFilter([
      filter(11, 'Group Classes'),
      filter(12, 'Personal Training'),
    ]);

    expect(result.map(item => item.name)).toEqual([
      'Group Classes',
      'Personal Training',
      'Leaderboard',
    ]);
    expect(
      ensureLeaderboardClassFilter([
        filter(11, 'Group Classes'),
        filter(0, 'Leaderboard'),
        filter(12, 'Personal Training'),
      ]).filter(item => item.name === 'Leaderboard'),
    ).toHaveLength(1);
  });

  it.each([
    [1, 320, 2],
    [4, 320, 2],
    [5, 312, 3],
    [6, 311, 2],
  ])(
    'uses two columns through four entries and three columns from five when width allows',
    (entryCount, availableWidth, expectedColumns) => {
      expect(
        getDashboardExploreColumnCount(entryCount, availableWidth),
      ).toBe(expectedColumns);
    },
  );

  it('moves Leaderboard into the top-right slot while preserving other order', () => {
    const entries = ensureLeaderboardClassFilter([
      filter(11, 'Group Classes'),
      filter(12, 'Personal Training'),
      filter(13, 'Sauna'),
      filter(14, 'Extras'),
    ]);

    expect(orderDashboardExploreEntries(entries, 3).map(item => item.name)).toEqual([
      'Group Classes',
      'Personal Training',
      'Leaderboard',
      'Sauna',
      'Extras',
    ]);
    expect(orderDashboardExploreEntries(entries, 2).map(item => item.name)).toEqual([
      'Group Classes',
      'Leaderboard',
      'Personal Training',
      'Sauna',
      'Extras',
    ]);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails for missing helpers**

Run:

```powershell
yarn test src/screens/Dashboard/components/DashboardExplore.test.ts --runInBand
```

Expected: FAIL because `DashboardExplore.ts` and its exported helpers do not yet exist.

- [ ] **Step 3: Implement the minimal pure helpers**

Create `DashboardExplore.ts` with the existing schema type and these contracts:

```ts
import type { ClassFiltersDataType } from '@/types/schemas/session';

export const LEADERBOARD_CLASS_FILTER: ClassFiltersDataType = {
  classIds: [],
  id: 0,
  isDefault: false,
  locationIds: [],
  name: 'Leaderboard',
};

export const DASHBOARD_EXPLORE_MIN_TILE_WIDTH = 96;
export const DASHBOARD_EXPLORE_GRID_GAP = 12;

export const ensureLeaderboardClassFilter = (
  entries: readonly ClassFiltersDataType[],
): ClassFiltersDataType[] => [
  ...entries.filter(entry => entry.name !== 'Leaderboard'),
  LEADERBOARD_CLASS_FILTER,
];

export const getDashboardExploreColumnCount = (
  visibleEntryCount: number,
  availableWidth: number,
): 2 | 3 => {
  const minimumThreeColumnWidth =
    DASHBOARD_EXPLORE_MIN_TILE_WIDTH * 3 + DASHBOARD_EXPLORE_GRID_GAP * 2;

  return visibleEntryCount >= 5 && availableWidth >= minimumThreeColumnWidth
    ? 3
    : 2;
};

export const orderDashboardExploreEntries = (
  entries: readonly ClassFiltersDataType[],
  columns: 2 | 3,
): ClassFiltersDataType[] => {
  const leaderboard = entries.find(entry => entry.name === 'Leaderboard');
  const configuredEntries = entries.filter(
    entry => entry.name !== 'Leaderboard',
  );

  if (!leaderboard || configuredEntries.length === 0) {
    return leaderboard ? [leaderboard] : configuredEntries;
  }

  const firstRowConfiguredCount = columns - 1;
  return [
    ...configuredEntries.slice(0, firstRowConfiguredCount),
    leaderboard,
    ...configuredEntries.slice(firstRowConfiguredCount),
  ];
};
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run the same Jest command. Expected: PASS for all normalization, breakpoint, and ordering cases.

- [ ] **Step 5: Commit the pure behavior**

```powershell
git add src/screens/Dashboard/components/DashboardExplore.ts src/screens/Dashboard/components/DashboardExplore.test.ts
git commit --no-verify -m "feat: add responsive dashboard explore rules"
```

### Task 2: Make the grid and tile geometry responsive and square

**Files:**
- Modify: `src/screens/Dashboard/components/DashboardActionGrid.tsx`
- Modify: `src/screens/Dashboard/components/DashboardActionButton.tsx`
- Test: `src/screens/Dashboard/components/DashboardActionGrid.test.tsx`

- [ ] **Step 1: Add failing grid assertions for three columns and square tiles**

Extend the existing grid test with five actions and an explicit narrow content width, then import `orderDashboardGridItems` and assert the derived grid geometry and generic Leaderboard pinning:

```tsx
it('uses compact three-column square cells for dense configurations', () => {
  const actions = Array.from({ length: 5 }, (_, index) => ({
    id: `action-${index}`,
    icon: 'calendar-alt',
    text: `Action ${index}`,
    onPress: jest.fn(),
  }));

  const { getByTestId, getAllByRole } = render(
    <ThemeProvider storage={storage}>
      <DashboardActionGrid actions={actions} availableWidth={320} />
    </ThemeProvider>,
  );

  expect(getByTestId('dashboard-action-grid')).toHaveStyle({
    flexDirection: 'row',
    flexWrap: 'wrap',
  });
  expect(getByTestId('dashboard-action-cell-action-0')).toHaveStyle({
    width: '31.5%',
  });
  expect(getAllByRole('button')[0]).toHaveStyle({
    aspectRatio: 1,
  });
});

it('pins the Leaderboard action in the top-right grid slot', () => {
  const actions = [
    { id: 'leaderboard', icon: 'trophy', text: 'Leaderboard', onPress: jest.fn() },
    { id: 'class-filter-11', icon: 'calendar-alt', text: 'Group Classes', onPress: jest.fn() },
    { id: 'class-filter-12', icon: 'calendar-alt', text: 'Sauna', onPress: jest.fn() },
  ];

  expect(orderDashboardGridItems(actions, 2).map(action => action.id)).toEqual([
    'class-filter-11',
    'leaderboard',
    'class-filter-12',
  ]);
});
```

- [ ] **Step 2: Run the focused grid test and verify it fails**

Run:

```powershell
yarn test src/screens/Dashboard/components/DashboardActionGrid.test.tsx --runInBand
```

Expected: FAIL because the grid currently has no width override, remains two-column, and the button has a minimum height instead of square geometry.

- [ ] **Step 3: Refactor the grid to use the pure rules and pin Leaderboard**

Remove the static `DashboardExploreDestination`, `DashboardExploreAction`, and `getDashboardExploreActions` definitions from `DashboardActionGrid.tsx`. Keep `DashboardActionGridItem` and `DashboardActionGrid` generic. Add `useWindowDimensions`, derive content width as `windowWidth - memberTheme.spacing.lg * 2`, and use the helpers. The props contract becomes:

```ts
interface DashboardActionGridProps {
  actions: readonly DashboardActionGridItem[];
  availableWidth?: number;
}
```

Use the following component shape:

```tsx
const DashboardActionGrid = ({ actions, availableWidth }: DashboardActionGridProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = availableWidth ?? windowWidth - memberTheme.spacing.lg * 2;
  const columns = getDashboardExploreColumnCount(actions.length, contentWidth);
  const orderedActions = orderDashboardGridItems(actions, columns);

  return (
    <View testID="dashboard-action-grid" style={styles.grid}>
      {orderedActions.map(action => (
        <View
          key={action.id}
          testID={`dashboard-action-cell-${action.id}`}
          style={[
            styles.cell,
            columns === 3 ? styles.threeColumnCell : styles.twoColumnCell,
            orderedActions.length === 1 && action.id === 'leaderboard'
              ? styles.singlePinnedCell
              : null,
          ]}
        >
          <DashboardActionButton
            icon={action.icon}
            text={action.text}
            onPress={action.onPress}
            compact={columns === 3}
          />
        </View>
      ))}
    </View>
  );
};
```

Add this generic helper in `DashboardActionGrid.tsx` so the layout component can pin the same action id without knowing about class-filter schemas:

```ts
export const orderDashboardGridItems = (
  actions: readonly DashboardActionGridItem[],
  columns: 2 | 3,
): DashboardActionGridItem[] => {
  const leaderboard = actions.find(action => action.id === 'leaderboard');
  const configuredActions = actions.filter(
    action => action.id !== 'leaderboard',
  );

  if (!leaderboard || configuredActions.length === 0) {
    return leaderboard ? [leaderboard] : configuredActions;
  }

  const firstRowConfiguredCount = columns - 1;
  return [
    ...configuredActions.slice(0, firstRowConfiguredCount),
    leaderboard,
    ...configuredActions.slice(firstRowConfiguredCount),
  ];
};
```

Keep the existing two-column behavior for non-dense grids and use `31.5%`/`48%` cell widths with `space-between`. Give a single Leaderboard cell a right-aligned margin so it remains top-right even when it is the only entry.

- [ ] **Step 4: Make `DashboardActionButton` square without overflow at three columns**

Add `compact?: boolean` to the props. Apply `aspectRatio: 1` to the outer ripple, remove `minHeight: 104`, and use compact padding/icon/text only for the three-column case:

```tsx
<TouchableRipple
  onPress={onPress}
  style={[styles.container, compact ? styles.compactContainer : null]}
  accessibilityRole="button"
  accessibilityLabel={text}
>
  <View style={styles.tileContainer}>
    <View
      style={[
        styles.tileIconContainer,
        compact ? styles.compactTileIconContainer : null,
      ]}
    >
      <Icon
        name={icon}
        size={compact ? metrics.md : metrics.lg}
        color={memberTheme.colors.primary}
      />
    </View>
    <View style={styles.tileTextContainer}>
      <Text
        size={compact ? 'sm' : 'md'}
        bold
        numberOfLines={2}
        style={styles.tileText}
      >
        {text}
      </Text>
    </View>
  </View>
</TouchableRipple>
```

Use compact padding `memberTheme.spacing.sm` and compact icon container `36 x 36`; retain the existing theme colors, border, radius, and shadow.

- [ ] **Step 5: Run the focused grid tests and verify they pass**

Run the grid Jest command again. Expected: PASS for the existing callback test, two-column style assertions, three-column width, and square aspect ratio.

- [ ] **Step 6: Commit the grid geometry**

```powershell
git add src/screens/Dashboard/components/DashboardActionGrid.tsx src/screens/Dashboard/components/DashboardActionGrid.test.tsx src/screens/Dashboard/components/DashboardActionButton.tsx
git commit --no-verify -m "feat: make dashboard explore tiles responsive"
```

### Task 3: Wire dashboard Explore tiles to class-filter configuration

**Files:**
- Modify: `src/screens/Dashboard/Dashboard.tsx`

- [ ] **Step 1: Write a failing action-mapping test before wiring the Dashboard**

Extend `DashboardExplore.test.ts` before editing `Dashboard.tsx`. The assertion verifies that configured names become action labels and that the static `All classes`/Shop actions are not generated:

```ts
import { getDashboardExploreActionDefinitions } from './DashboardExplore';

it('maps configured filters to dashboard action definitions', () => {
  const actions = getDashboardExploreActionDefinitions([
    filter(11, 'Group Classes'),
    filter(12, 'Sauna'),
  ]);

  expect(actions.map(({ id, icon, text }) => ({ id, icon, text }))).toEqual([
    { id: 'class-filter-11', icon: 'calendar-alt', text: 'Group Classes' },
    { id: 'class-filter-12', icon: 'calendar-alt', text: 'Sauna' },
    { id: 'leaderboard', icon: 'trophy', text: 'Leaderboard' },
  ]);
  expect(actions.map(action => action.text)).not.toEqual(
    expect.arrayContaining(['All classes', 'Extras']),
  );
});
```

- [ ] **Step 2: Run the focused test and verify it fails for the missing action mapper**

Run:

```powershell
yarn test src/screens/Dashboard/components/DashboardExplore.test.ts --runInBand
```

Expected: FAIL because `getDashboardExploreActionDefinitions` does not yet exist.

- [ ] **Step 3: Implement the action-definition mapper**

Add the following definition to `DashboardExplore.ts`:

```ts
export interface DashboardExploreActionDefinition {
  id: string;
  icon: string;
  text: string;
  entry: ClassFiltersDataType;
}

export const getDashboardExploreActionDefinitions = (
  entries: readonly ClassFiltersDataType[],
): DashboardExploreActionDefinition[] =>
  ensureLeaderboardClassFilter(entries).map(entry => ({
    id: entry.name === 'Leaderboard' ? 'leaderboard' : `class-filter-${entry.id}`,
    icon: entry.name === 'Leaderboard' ? 'trophy' : 'calendar-alt',
    text: entry.name,
    entry,
  }));
```

- [ ] **Step 4: Run the focused action-mapping test and verify it passes**

Run the same Jest command. Expected: PASS for configured names, stable ids, icons, and the built-in Leaderboard entry.

- [ ] **Step 5: Normalize filter data when class-filter configuration loads**

In `getClassFiltersFn`, replace the mutating splice block with:

```ts
const newResData = ensureLeaderboardClassFilter(res.data);
setAppState('classFiltersDataState', newResData);
const defaultItem = res.data.find(
  item =>
    item.isDefault === 1 ||
    (typeof item.isDefault === 'boolean' && item.isDefault === true),
);
```

Import `ensureLeaderboardClassFilter` from `./components/DashboardExplore`. This preserves API order, avoids duplicate Leaderboard entries, and does not mutate the service response.

- [ ] **Step 6: Replace static actions and chips with configured grid items**

Remove the imports and code for `getDashboardExploreActions`, `getDashboardExploreNavigation`, `DashboardExploreAction`, `exploreActions`, `onExploreActionPress`, `renderPresetFilter`, `classFiltersSection`, `filterChips`, and related styles. Import `ensureLeaderboardClassFilter` and `getDashboardExploreActionDefinitions` from `./components/DashboardExplore`. Keep `visiblePresetFilters`, but derive it from normalized state and existing `filterMemberSurfaceEntries`:

```tsx
const visiblePresetFilters = useMemo(
  () =>
    filterMemberSurfaceEntries(
      ensureLeaderboardClassFilter(classFiltersDataState).map(item => ({
        item,
        route: item.name === 'Leaderboard' ? ('TrainingResults' as const) : ('Calendar' as const),
      })),
      classEntryPointsAvailable,
    ).map(({ item }) => item),
  [classFiltersDataState, classEntryPointsAvailable],
);

const exploreActions = useMemo(
  () =>
    getDashboardExploreActionDefinitions(visiblePresetFilters).map(action => ({
      id: action.id,
      icon: action.icon,
      text: action.text,
      onPress:
        action.id === 'leaderboard'
          ? () =>
              navigate('Main', {
                screen: 'TrainingStack',
                params: { screen: 'TrainingResults' },
              })
          : () => onPresetFilterClick(action.entry),
    })),
  [onPresetFilterClick, visiblePresetFilters],
);
```

Place `onPresetFilterClick` before this mapping so the callback closes over the existing class/venue filter state and setters. Keep its selection semantics unchanged.

- [ ] **Step 7: Render only the configured Explore grid**

Replace the current Explore JSX block with:

```tsx
<View style={styles.sectionHeadingRow}>
  <Text bold style={styles.sectionHeadingText}>
    Explore
  </Text>
</View>
<DashboardActionGrid actions={exploreActions} />
```

Do not render a second `Class filters` heading, chip wrapper, or chip button. Leave the existing loading skeleton around this block so the grid appears after `presetFiltersIsLoaded` resolves.

- [ ] **Step 8: Run the relevant Dashboard tests and static checks**

Run:

```powershell
yarn test src/screens/Dashboard/components/DashboardExplore.test.ts src/screens/Dashboard/components/DashboardActionGrid.test.tsx --runInBand
rg -n "Class filters|classFiltersSection|filterChips|renderPresetFilter|getDashboardExploreActions" src/screens/Dashboard
```

Expected: both Jest files PASS, and the `rg` command returns no removed chip-section/static-action references. The remaining `classFiltersDataState` references should be the loading, normalization, and configured Explore mapping paths.

- [ ] **Step 9: Commit the dashboard wiring**

```powershell
git add src/screens/Dashboard/Dashboard.tsx
git commit --no-verify -m "feat: drive dashboard explore from class filters"
```

### Task 4: Verify the complete change

**Files:**
- No new files; verify the files changed in Tasks 1–3.

- [ ] **Step 1: Run the full Dashboard component test set**

```powershell
yarn test src/screens/Dashboard --runInBand
```

Expected: PASS with no regressions in the Dashboard action, header, attendance, or upcoming-session component tests.

- [ ] **Step 2: Run type checking**

```powershell
yarn check-types
```

Expected: TypeScript exits with code 0 and no diagnostics.

- [ ] **Step 3: Run lint**

```powershell
yarn lint
```

Expected: ESLint exits with code 0 and no warnings or errors.

- [ ] **Step 4: Review the final diff and working tree**

```powershell
git diff 8980112..HEAD -- src/screens/Dashboard docs/superpowers/specs docs/superpowers/plans
git status --short
```

Confirm the diff contains only the approved responsive Explore behavior, no API changes, no release metadata changes, no legacy Class filters section, and no unrelated modifications. If the final implementation uses a different number of commits because a test-only fix is needed, review each commit individually before handoff.

- [ ] **Step 5: Commit any verification-only corrections**

```powershell
git add src/screens/Dashboard
git commit --no-verify -m "fix: polish responsive explore verification findings"
```

Run the affected test and check commands again after any correction; do not claim completion until they pass.
