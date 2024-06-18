import { config } from '@/theme/_config';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type HRProps = {
	color?: string;
	thickness?: number;
	margin?: boolean;
	style?: StyleProp<ViewStyle>;
	noMarginBottom?: boolean;
};

const HR = (props: HRProps) => {
	const { color, thickness, margin, style, noMarginBottom } = props;
	const marginBottom = noMarginBottom ? { marginBottom: 0 } : {};
	return (
		<View
			style={[
				{
					borderColor: color || config.borders.colors.gray,
					borderWidth: thickness || StyleSheet.hairlineWidth,
					marginVertical: margin
						? config.metrics.rg
						: config.metrics.xs,
					...marginBottom,
				},
				style,
			]}
		/>
	);
};

HR.defaultProps = {
	color: config.borders.colors.gray,
	thickness: StyleSheet.hairlineWidth,
	margin: true,
	style: undefined,
	noMarginBottom: false,
};

export default HR;
