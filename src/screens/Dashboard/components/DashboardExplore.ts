import type { ClassFiltersDataType } from '@/types/schemas/session';

const createLeaderboardClassFilter = (): ClassFiltersDataType => ({
	classIds: [],
	id: 0,
	isDefault: false,
	locationIds: [],
	name: 'Leaderboard',
});

export const LEADERBOARD_CLASS_FILTER = createLeaderboardClassFilter();

export const DASHBOARD_EXPLORE_MIN_TILE_WIDTH = 96;
export const DASHBOARD_EXPLORE_GRID_GAP = 12;

export const ensureLeaderboardClassFilter = (
	entries: readonly ClassFiltersDataType[],
): ClassFiltersDataType[] => [
	...entries.filter(entry => entry.name !== LEADERBOARD_CLASS_FILTER.name),
	createLeaderboardClassFilter(),
];

export interface DashboardExploreActionDefinition {
	id: string;
	icon: string;
	text: string;
	entry: ClassFiltersDataType;
}

export const orderDashboardExploreItems = <T>(
	items: readonly T[],
	columns: 2 | 3,
	isLeaderboard: (item: T) => boolean,
): T[] => {
	const leaderboardItem = items.find(isLeaderboard);
	const configuredItems = items.filter(item => !isLeaderboard(item));

	if (!leaderboardItem) return [...configuredItems];

	const insertionIndex = columns - 1;
	return [
		...configuredItems.slice(0, insertionIndex),
		leaderboardItem,
		...configuredItems.slice(insertionIndex),
	];
};

export const getDashboardExploreActionDefinitions = (
	entries: readonly ClassFiltersDataType[],
): DashboardExploreActionDefinition[] =>
	ensureLeaderboardClassFilter(entries).map(entry => ({
		id:
			entry.name === 'Leaderboard'
				? 'leaderboard'
				: `class-filter-${entry.id}`,
		icon: entry.name === 'Leaderboard' ? 'trophy' : 'calendar-alt',
		text: entry.name,
		entry,
	}));

export const getDashboardExploreColumnCount = (
	visibleEntryCount: number,
	availableWidth: number,
): 2 | 3 =>
	visibleEntryCount >= 5 &&
	availableWidth >=
		DASHBOARD_EXPLORE_MIN_TILE_WIDTH * 3 + DASHBOARD_EXPLORE_GRID_GAP * 2
		? 3
		: 2;

export const orderDashboardExploreEntries = (
	entries: readonly ClassFiltersDataType[],
	columns: 2 | 3,
): ClassFiltersDataType[] =>
	orderDashboardExploreItems(
		entries,
		columns,
		entry => entry.name === LEADERBOARD_CLASS_FILTER.name,
	);
