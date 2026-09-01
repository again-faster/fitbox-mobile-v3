import { fireEvent, render } from '@testing-library/react-native';
import { MMKV } from 'react-native-mmkv';

import { ThemeProvider } from '@/theme';

import DashboardActionGrid, {
	getDashboardExploreNavigation,
	getDashboardExploreActions,
} from './DashboardActionGrid';

const storage = new MMKV();

describe('DashboardActionGrid', () => {
	it('exposes only the approved actions with valid route contracts', () => {
		expect(getDashboardExploreActions(true)).toEqual([
			expect.objectContaining({
				text: 'Group Classes',
				destination: { tab: 'Calendar' },
			}),
			expect.objectContaining({
				text: 'Personal Training',
				destination: {
					tab: 'TrainingStack',
					screen: 'TrainingPT',
				},
			}),
			expect.objectContaining({
				text: 'Leaderboard',
				destination: {
					tab: 'TrainingStack',
					screen: 'TrainingResults',
				},
			}),
			expect.objectContaining({
				text: 'Extras',
				destination: { tab: 'Shop' },
			}),
			expect.objectContaining({
				text: 'All classes',
				destination: { tab: 'Calendar' },
			}),
		]);

		const withoutShop = getDashboardExploreActions(false);
		expect(withoutShop.map(action => action.text)).not.toContain('Extras');
		expect(withoutShop.map(action => action.text)).not.toContain('Sauna');
		expect(
			getDashboardExploreActions(false, false).map(action => action.text),
		).not.toEqual(expect.arrayContaining(['Group Classes', 'All classes']));
		expect(
			getDashboardExploreActions(true, true, false, false).map(
				action => action.text,
			),
		).toEqual(['Group Classes', 'Extras', 'All classes']);
	});

	it('builds nested Main-tab navigation for dashboard actions', () => {
		expect(
			getDashboardExploreNavigation({ tab: 'Shop' }),
		).toEqual({ screen: 'Shop' });
		expect(
			getDashboardExploreNavigation({
				tab: 'TrainingStack',
				screen: 'TrainingResults',
			}),
		).toEqual({
			screen: 'TrainingStack',
			params: { screen: 'TrainingResults' },
		});
	});

	it('renders a stable two-column grid and invokes the selected tile', () => {
		const onPress = jest.fn();
		const { getByRole, getByTestId } = render(
			<ThemeProvider storage={storage}>
				<DashboardActionGrid
					actions={[
						{
							id: 'personal-training',
							icon: 'user-clock',
							text: 'Personal Training',
							onPress,
						},
					]}
				/>
			</ThemeProvider>,
		);

		expect(getByTestId('dashboard-action-grid')).toHaveStyle({
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'space-between',
		});
		expect(
			getByTestId('dashboard-action-cell-personal-training'),
		).toHaveStyle({
			width: '48%',
			minWidth: 0,
		});

		fireEvent.press(getByRole('button', { name: 'Personal Training' }));
		expect(onPress).toHaveBeenCalledTimes(1);
	});
});
