import { PropsWithChildren, Children } from 'react';
import { StyleSheet, View } from 'react-native';

import { memberTheme } from '@/theme/member';

type DashboardAttendanceRowProps = PropsWithChildren;

const DashboardAttendanceRow = ({ children }: DashboardAttendanceRowProps) => {
	const metrics = Children.toArray(children);

	return (
		<View testID="attendance-metrics-row" style={styles.row}>
			{metrics.map((metric, index) => (
				<View
					key={`attendance-metric-${index}`}
					style={styles.metricColumn}
					testID="attendance-metric-column"
				>
					{metric}
					{index < metrics.length - 1 ? (
						<View
							testID="attendance-metric-separator"
							style={styles.separator}
						/>
					) : null}
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	row: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'stretch',
	},
	metricColumn: {
		flex: 1,
		minWidth: 0,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'relative',
	},
	separator: {
		position: 'absolute',
		right: 0,
		top: 0,
		bottom: 0,
		width: 1,
		backgroundColor: memberTheme.colors.border,
	},
});

export default DashboardAttendanceRow;
