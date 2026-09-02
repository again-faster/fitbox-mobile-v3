import type { ClassFiltersDataType } from '@/types/schemas/session';

import {
	DASHBOARD_EXPLORE_GRID_GAP,
	DASHBOARD_EXPLORE_MIN_TILE_WIDTH,
	LEADERBOARD_CLASS_FILTER,
	ensureLeaderboardClassFilter,
	getDashboardExploreActionDefinitions,
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

describe('DashboardExplore configuration and layout rules', () => {
	it('defines the built-in Leaderboard filter and tile layout constants', () => {
		expect(LEADERBOARD_CLASS_FILTER).toEqual({
			classIds: [],
			id: 0,
			isDefault: false,
			locationIds: [],
			name: 'Leaderboard',
		});
		expect(DASHBOARD_EXPLORE_MIN_TILE_WIDTH).toBe(96);
		expect(DASHBOARD_EXPLORE_GRID_GAP).toBe(12);
	});

	it('normalizes configured filters by appending one built-in Leaderboard', () => {
		const configuredEntries = [
			filter(1, 'Group Classes'),
			filter(2, 'Personal Training'),
		];

		const normalizedEntries =
			ensureLeaderboardClassFilter(configuredEntries);

		expect(normalizedEntries.map(entry => entry.name)).toEqual([
			'Group Classes',
			'Personal Training',
			'Leaderboard',
		]);
		expect(configuredEntries).toEqual([
			filter(1, 'Group Classes'),
			filter(2, 'Personal Training'),
		]);
	});

	it('removes API-provided Leaderboard duplicates before appending the built-in entry', () => {
		const entries = [
			filter(1, 'Group Classes'),
			filter(99, 'Leaderboard'),
			filter(2, 'Personal Training'),
		];

		const normalizedEntries = ensureLeaderboardClassFilter(entries);
		const normalizedLeaderboard = normalizedEntries[2];

		expect(normalizedEntries).toEqual([
			filter(1, 'Group Classes'),
			filter(2, 'Personal Training'),
			{
				classIds: [],
				id: 0,
				isDefault: false,
				locationIds: [],
				name: 'Leaderboard',
			},
		]);
		expect(normalizedEntries).toHaveLength(3);
		expect(normalizedLeaderboard).not.toBe(LEADERBOARD_CLASS_FILTER);
		expect(ensureLeaderboardClassFilter(entries)[2]).not.toBe(
			normalizedLeaderboard,
		);
	});

	it.each([
		[1, 320, 2],
		[4, 320, 2],
		[5, 312, 3],
		[6, 311, 2],
	])(
		'uses %i visible entries and %i available pixels to return %i columns',
		(visibleEntryCount, availableWidth, expectedColumns) => {
			expect(
				getDashboardExploreColumnCount(
					visibleEntryCount,
					availableWidth,
				),
			).toBe(expectedColumns);
		},
	);

	it('places Leaderboard after the first row of configured entries', () => {
		const entries = [
			filter(1, 'Group Classes'),
			filter(2, 'Personal Training'),
			filter(0, 'Leaderboard'),
			filter(3, 'Sauna'),
			filter(4, 'Extras'),
		];
		const originalEntries = [...entries];

		expect(
			orderDashboardExploreEntries(entries, 3).map(entry => entry.name),
		).toEqual([
			'Group Classes',
			'Personal Training',
			'Leaderboard',
			'Sauna',
			'Extras',
		]);
		expect(entries).toEqual(originalEntries);

		expect(
			orderDashboardExploreEntries(entries, 2).map(entry => entry.name),
		).toEqual([
			'Group Classes',
			'Leaderboard',
			'Personal Training',
			'Sauna',
			'Extras',
		]);
		expect(entries).toEqual(originalEntries);
	});

	it('handles empty and only-Leaderboard entries', () => {
		expect(orderDashboardExploreEntries([], 3)).toEqual([]);
		expect(
			orderDashboardExploreEntries([LEADERBOARD_CLASS_FILTER], 3),
		).toEqual([LEADERBOARD_CLASS_FILTER]);
	});
});
