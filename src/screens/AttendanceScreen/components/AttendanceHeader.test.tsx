import { fireEvent, render } from '@testing-library/react-native';
import AttendanceHeader from './AttendanceHeader';

describe('AttendanceHeader', () => {
	it('renders the Attendance title and supporting copy', () => {
		const { getByText, getByTestId } = render(
			<AttendanceHeader onBack={jest.fn()} />,
		);

		expect(getByText('Attendance')).toBeTruthy();
		expect(
			getByText('Track your visits and build consistency.'),
		).toBeTruthy();
		expect(getByTestId('attendance-header-gradient')).toBeTruthy();
	});

	it('provides an accessible back action', () => {
		const onBack = jest.fn();
		const { getByRole } = render(<AttendanceHeader onBack={onBack} />);

		fireEvent.press(getByRole('button', { name: 'Go back' }));

		expect(onBack).toHaveBeenCalledTimes(1);
	});
});
