import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import DashboardAttendanceRow from './DashboardAttendanceRow';

describe('DashboardAttendanceRow', () => {
	it('gives three metrics equal columns separated by two dividers', () => {
		const { getAllByTestId, getByTestId } = render(
			<DashboardAttendanceRow>
				<Text>Month</Text>
				<Text>Year</Text>
				<Text>Lifetime</Text>
			</DashboardAttendanceRow>,
		);

		expect(getByTestId('attendance-metrics-row')).toHaveStyle({
			width: '100%',
			flexDirection: 'row',
			alignItems: 'stretch',
		});
		expect(getAllByTestId('attendance-metric-column')).toHaveLength(3);
		getAllByTestId('attendance-metric-column').forEach(column => {
			expect(column).toHaveStyle({ flex: 1, minWidth: 0 });
		});
		expect(getAllByTestId('attendance-metric-separator')).toHaveLength(2);
	});
});
