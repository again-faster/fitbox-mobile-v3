import { config } from '@/theme/_config';
import { View } from 'react-native';
import { FontSizeMetrics } from '../Text/Text';

type SpacerSize = FontSizeMetrics | number;
interface SpacerProps {
	size?: SpacerSize;
	horizontal?: boolean;
}

const Spacer = ({ size = 'sm', horizontal = false }: SpacerProps) => {
	const fontMetrics = config.fonts.metrics;

	let height: number;
	let width: number;

	if (typeof size === 'number') {
		height = horizontal ? 0 : size;
		width = horizontal ? size : 0;
	} else {
		height = horizontal ? 0 : fontMetrics[size];
		width = horizontal ? fontMetrics[size] : 0;
	}

	return <View style={{ height, width }} />;
};

Spacer.defaultProps = {
	size: 'sm',
	horizontal: false,
};

export default Spacer;
