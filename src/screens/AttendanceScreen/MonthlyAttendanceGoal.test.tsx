import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { MMKV } from 'react-native-mmkv';

import { ThemeProvider } from '@/theme';
import { mmkvStorage } from '@/storage';

import MonthlyAttendanceGoal from './MonthlyAttendanceGoal';

jest.mock('@/storage', () => ({
	mmkvStorage: {
		delete: jest.fn(),
		getBoolean: jest.fn(() => false),
		getNumber: jest.fn(() => 8),
		set: jest.fn(),
	},
}));

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
	const { Text } = require('react-native');

	return ({ name }: { name: string }) => <Text>{name}</Text>;
});

describe('MonthlyAttendanceGoal', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(mmkvStorage.getNumber as jest.Mock).mockReturnValue(8);
		(mmkvStorage.getBoolean as jest.Mock).mockReturnValue(false);
	});

	const renderGoal = () =>
		render(
			<ThemeProvider storage={new MMKV()}>
				<MonthlyAttendanceGoal
					attendanceCount={0}
					gymId={1}
					memberId={2}
				/>
			</ThemeProvider>,
		);

	it('renders the live monthly goal card with remaining visits', async () => {
		const { getByText, getByLabelText } = renderGoal();
		const monthName = new Date().toLocaleString('en-AU', {
			month: 'long',
		});

		await waitFor(() => expect(getByText('YOUR GOAL')).toBeTruthy());

		expect(getByText(`${monthName} goal`)).toBeTruthy();
		expect(getByText('8 visits to go')).toBeTruthy();
		expect(getByText('Keep showing up')).toBeTruthy();
		expect(getByLabelText('Edit monthly attendance goal')).toHaveStyle({
			borderWidth: 1,
		});
	});

	it('keeps the no-goal state actionable', async () => {
		(mmkvStorage.getNumber as jest.Mock).mockReturnValue(undefined);
		const { getByText } = renderGoal();

		await waitFor(() => expect(getByText('Set monthly goal')).toBeTruthy());
		fireEvent.press(getByText('Set monthly goal'));

		expect(getByText('Set your monthly rhythm')).toBeTruthy();
	});
});
