import { fireEvent, render } from '@testing-library/react-native';
import { MMKV } from 'react-native-mmkv';

import { ThemeProvider } from '@/theme';

import DashboardUpcomingSection from './DashboardUpcomingSection';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
	const actualNavigation = jest.requireActual<
		typeof import('@react-navigation/native')
	>('@react-navigation/native');

	return {
		...actualNavigation,
		useNavigation: () => ({ navigate: mockNavigate }),
	};
});

const sessions = [
	{
		id: 101,
		startTime: '2026-09-02T08:00:00+10:00',
		endTime: '2026-09-02T09:00:00+10:00',
		title: 'Morning Flow',
		venue: 'Studio One',
		isCoach: false,
		waitlistEnabled: true,
		waitlistTime: 30,
		color: '#7775E6',
	},
	{
		id: 102,
		startTime: '2026-09-03T17:00:00+10:00',
		endTime: '2026-09-03T18:00:00+10:00',
		title: 'Evening Strength',
		isCoach: true,
		waitlistEnabled: false,
		waitlistTime: 0,
		color: '#43A047',
	},
];

const storage = new MMKV();

describe('DashboardUpcomingSection', () => {
	beforeEach(() => mockNavigate.mockClear());

	it('shows the live count, only the first session, and valid navigation actions', () => {
		const onViewAll = jest.fn();
		const { getByRole, getByTestId, getByText, queryByText } = render(
			<ThemeProvider storage={storage}>
				<DashboardUpcomingSection
					sessions={sessions}
					onViewAll={onViewAll}
				/>
			</ThemeProvider>,
		);

		expect(getByText('UPCOMING CLASS (2)')).toBeTruthy();
		expect(getByText('Morning Flow')).toBeTruthy();
		expect(queryByText('Evening Strength')).toBeNull();
		expect(getByTestId('booked-session-card')).toHaveStyle({
			minHeight: 96,
			padding: 12,
		});

		fireEvent.press(getByRole('button', { name: 'Open Morning Flow' }));
		expect(mockNavigate).toHaveBeenCalledWith('Session', {
			id: 101,
			title: 'Morning Flow',
			waitlistEnabled: true,
			waitlistTime: 30,
		});

		fireEvent.press(
			getByRole('button', { name: 'View all upcoming classes' }),
		);
		expect(onViewAll).toHaveBeenCalledTimes(1);
	});

	it('hides View all unless there is another session and a valid callback', () => {
		const { queryByRole, rerender } = render(
			<ThemeProvider storage={storage}>
				<DashboardUpcomingSection sessions={sessions.slice(0, 1)} />
			</ThemeProvider>,
		);

		expect(
			queryByRole('button', { name: 'View all upcoming classes' }),
		).toBeNull();

		rerender(
			<ThemeProvider storage={storage}>
				<DashboardUpcomingSection sessions={sessions} />
			</ThemeProvider>,
		);
		expect(
			queryByRole('button', { name: 'View all upcoming classes' }),
		).toBeNull();
	});
});
