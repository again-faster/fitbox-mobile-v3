import { render } from '@testing-library/react-native';
import { MMKV } from 'react-native-mmkv';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { ThemeProvider } from '@/theme';

import DashboardAttendanceMetric from './DashboardAttendanceMetric';

describe('DashboardAttendanceMetric', () => {
	it('uses the same centered cell layout for one- and two-digit values', () => {
		const storage = new MMKV();
		const { getByTestId, getByText, rerender } = render(
			<ThemeProvider storage={storage}>
				<DashboardAttendanceMetric value="10" label="this year">
					<View testID="attendance-metric-icon" />
				</DashboardAttendanceMetric>
			</ThemeProvider>,
		);

		expect(getByText('10')).toBeTruthy();
		expect(getByText('THIS YEAR')).toBeTruthy();
		expect(getByTestId('attendance-metric-icon')).toBeTruthy();
		expect(getByTestId('attendance-metric')).toHaveStyle({
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
		});
		expect(getByTestId('attendance-metric-value-row')).toHaveStyle({
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
		});
		expect(getByTestId('attendance-metric-label')).toHaveStyle({
			textAlign: 'center',
		});
		const initialMetricStyle = StyleSheet.flatten(
			getByTestId('attendance-metric').props
				.style as StyleProp<ViewStyle>,
		);
		expect(initialMetricStyle).not.toHaveProperty('paddingLeft');

		rerender(
			<ThemeProvider storage={storage}>
				<DashboardAttendanceMetric value="0" label="this month">
					<View testID="attendance-metric-icon" />
				</DashboardAttendanceMetric>
			</ThemeProvider>,
		);

		expect(getByText('0')).toBeTruthy();
		expect(getByText('THIS MONTH')).toBeTruthy();
		expect(getByTestId('attendance-metric')).toHaveStyle({
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
		});
		expect(getByTestId('attendance-metric-value-row')).toHaveStyle({
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'center',
		});
		expect(getByTestId('attendance-metric-label')).toHaveStyle({
			textAlign: 'center',
			textTransform: 'uppercase',
			color: '#7775E6',
		});
		expect(getByTestId('attendance-metric-icon')).toBeTruthy();

		const rerenderedMetricStyle = StyleSheet.flatten(
			getByTestId('attendance-metric').props
				.style as StyleProp<ViewStyle>,
		);
		expect(rerenderedMetricStyle).not.toHaveProperty('paddingLeft');
	});

	it('supports a compact goal value in a narrow three-metric row', () => {
		const storage = new MMKV();
		const { getAllByTestId, getByText } = render(
			<ThemeProvider storage={storage}>
				<View
					testID="attendance-metrics-row"
					style={{ width: 312, flexDirection: 'row' }}
				>
					<DashboardAttendanceMetric
						compact
						value="10 / 12"
						label="monthly goal"
						valueStyle={{ fontSize: 23 }}
					>
						<View style={{ width: 38, height: 38 }} />
					</DashboardAttendanceMetric>
					<DashboardAttendanceMetric value="24" label="this year">
						<View style={{ width: 25, height: 25 }} />
					</DashboardAttendanceMetric>
					<DashboardAttendanceMetric value="80" label="all time">
						<View style={{ width: 25, height: 25 }} />
					</DashboardAttendanceMetric>
				</View>
			</ThemeProvider>,
		);

		expect(getByText('10 / 12')).toHaveStyle({
			fontSize: 23,
			flexShrink: 1,
			minWidth: 0,
		});
		expect(getByText('10 / 12').props).toMatchObject({
			numberOfLines: 1,
			adjustsFontSizeToFit: true,
			minimumFontScale: 0.75,
		});
		expect(getAllByTestId('attendance-metric')).toHaveLength(3);
		expect(getAllByTestId('attendance-metric-value-row')).toHaveLength(3);
		expect(getAllByTestId('attendance-metric-value-row')[0]).toHaveStyle({
			width: '100%',
			flexShrink: 1,
		});
	});

	it('stacks the compact goal content inside an 85 point metric cell', () => {
		const storage = new MMKV();
		const { getAllByTestId, getByText } = render(
			<ThemeProvider storage={storage}>
				<View
					testID="attendance-metrics-row"
					style={{ width: 255, flexDirection: 'row' }}
				>
					<DashboardAttendanceMetric
						compact
						value="10 / 12"
						label="monthly goal"
						valueStyle={{ fontSize: 17 }}
					>
						<View style={{ width: 26, height: 26 }} />
					</DashboardAttendanceMetric>
					<DashboardAttendanceMetric value="24" label="this year">
						<View style={{ width: 25, height: 25 }} />
					</DashboardAttendanceMetric>
					<DashboardAttendanceMetric value="80" label="all time">
						<View style={{ width: 25, height: 25 }} />
					</DashboardAttendanceMetric>
				</View>
			</ThemeProvider>,
		);

		expect(getByText('10 / 12')).toHaveStyle({
			fontSize: 17,
			flexShrink: 1,
			minWidth: 0,
			width: '100%',
			textAlign: 'center',
		});
		expect(getAllByTestId('attendance-metric')).toHaveLength(3);
		expect(getAllByTestId('attendance-metric-value-row')[0]).toHaveStyle({
			width: '100%',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			flexShrink: 1,
		});
	});
});
