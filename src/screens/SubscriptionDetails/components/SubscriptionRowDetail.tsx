import { Row, Text } from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { useState } from 'react';
import { StyleSheet, TextStyle, TouchableOpacity } from 'react-native';

type RowDetailTypes = {
	title: string;
	value: string | number;
	lowercase?: boolean;
	isClickable?: boolean;
	renderPopup?: () => JSX.Element;
};

const SubscriptionRowDetail = ({
	title,
	value,
	lowercase = false,
	isClickable = false,
	renderPopup,
}: RowDetailTypes) => {
	const valueStyles = {
		textTransform: lowercase ? 'lowercase' : 'capitalize',
		textDecorationLine: isClickable ? 'underline' : 'none',
		marginLeft: 15,
	};

	const [showPopup, setShowPopup] = useState(false);

	return (
		<>
			<Row
				spacing="space-between"
				style={{ marginVertical: config.metrics.rg }}
			>
				<Text size="md" color="darkgray" style={layout.flex_1}>
					{title}:
				</Text>

				<TouchableOpacity
					style={styles.valueContainer}
					disabled={!isClickable}
					onPress={() => setShowPopup(true)}
				>
					<Text
						size="md"
						color={isClickable ? 'brand' : 'darkgray'}
						style={valueStyles as TextStyle}
					>
						{value}
					</Text>
				</TouchableOpacity>
			</Row>
			<Modal visible={showPopup} onDismiss={() => setShowPopup(false)}>
				{showPopup && renderPopup && renderPopup()}
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	valueContainer: { flex: 1.5 },
});

export default SubscriptionRowDetail;
