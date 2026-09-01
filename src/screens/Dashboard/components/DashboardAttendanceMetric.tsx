import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, TextStyle, View } from 'react-native';

import { Text } from '@/components/atoms';
import { memberTheme } from '@/theme/member';

type Props = PropsWithChildren<{
	value: string;
	label: string;
	compact?: boolean;
	valueStyle?: StyleProp<TextStyle>;
}>;

const DashboardAttendanceMetric = ({
	children,
	value,
	label,
	compact = false,
	valueStyle,
}: Props) => (
	<View testID="attendance-metric" style={styles.cell}>
		<View
			testID="attendance-metric-value-row"
			style={[styles.valueRow, compact ? styles.compactValueRow : null]}
		>
			{children}
			<Text
				bold
				style={[
					styles.value,
					compact ? styles.compactValue : null,
					valueStyle,
				]}
				numberOfLines={1}
				adjustsFontSizeToFit
				minimumFontScale={0.75}
				allowFontScaling={false}
			>
				{value}
			</Text>
		</View>
		<Text testID="attendance-metric-label" style={styles.label}>
			{label.toUpperCase()}
		</Text>
	</View>
);

const styles = StyleSheet.create({
	cell: {
		flex: 1,
		minWidth: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	valueRow: {
		width: '100%',
		minWidth: 0,
		flexShrink: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	compactValueRow: {
		flexDirection: 'column',
	},
	value: {
		fontSize: 28,
		minWidth: 0,
		flexShrink: 1,
	},
	compactValue: {
		fontSize: 18,
		marginTop: 4,
		width: '100%',
		textAlign: 'center',
	},
	label: {
		textAlign: 'center',
		textTransform: 'uppercase',
		color: memberTheme.colors.primary,
		fontSize: 11,
		marginTop: 4,
	},
});

export default DashboardAttendanceMetric;
