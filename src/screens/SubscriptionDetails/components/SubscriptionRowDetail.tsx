import { Row, Text } from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { useState } from 'react';
import { StyleSheet, TextStyle, TouchableOpacity, View } from 'react-native';

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
			<Row spacing="space-between" style={styles.row}>
				<Text size="md" style={[layout.flex_1, styles.label]}>
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
				<View style={styles.modalContainer}>
					{showPopup && renderPopup && renderPopup()}
				</View>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	valueContainer: { flex: 1.5 },
	row: {
		borderBottomColor: memberTheme.colors.border,
		borderBottomWidth: 1,
		paddingVertical: memberTheme.spacing.md,
	},
	label: { color: memberTheme.colors.textMuted },
	modalContainer: {
		padding: config.metrics.sm,
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.lg,
		width: '90%',
		alignSelf: 'center',
	},
});

export default SubscriptionRowDetail;
