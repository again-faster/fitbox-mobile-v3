import { Row, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { TextStyle } from 'react-native';

type RowDetailTypes = {
	title: string;
	value: string | number;
	lowercase?: boolean;
};

const SubscriptionRowDetail = ({ title, value, lowercase }: RowDetailTypes) => {
	const valueStyles = {
		flex: 1.5,
		textTransform: lowercase ? 'lowercase' : 'capitalize',
		marginLeft: 15,
	};

	return (
		<Row
			spacing="space-between"
			style={{ marginVertical: config.metrics.rg }}
		>
			<Text size="md" color="darkgray" style={layout.flex_1}>
				{title}:
			</Text>
			<Text size="md" color="darkgray" style={valueStyles as TextStyle}>
				{value}
			</Text>
		</Row>
	);
};

SubscriptionRowDetail.defaultProps = {
	lowercase: false,
};

export default SubscriptionRowDetail;
