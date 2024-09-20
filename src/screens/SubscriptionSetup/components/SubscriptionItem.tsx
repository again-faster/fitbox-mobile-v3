import { Row, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type SubscriptionItemProps = {
	title: string;
	price: number;
	description: string;
	disabled: boolean;
	plusFees: boolean | number;
	onPress: () => void;
};

const SubscriptionItem = ({
	title,
	price,
	description,
	disabled,
	plusFees,
	onPress,
}: SubscriptionItemProps) => {
	const textColor = disabled ? 'lightgrey' : 'darkgray';

	return (
		<TouchableOpacity
			style={styles.subscriptionItemStyle}
			onPress={onPress}
		>
			<Row spacing="space-between">
				<Text
					size="lg"
					style={{ ...layout.flex_1, ...styles.textStyle }}
					color={textColor}
				>
					{title}
				</Text>
				<View style={styles.feesContainer}>
					<Text size="lg" style={styles.textStyle} color={textColor}>
						{price ? `$${price}` : ''}
					</Text>
					{plusFees ? (
						<Text
							size="xs"
							style={styles.textStyle}
							color={textColor}
						>
							+ fees
						</Text>
					) : null}
				</View>
			</Row>

			{description ? (
				<Text size="rg" style={styles.textStyle} color={textColor}>
					{description}
				</Text>
			) : null}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	subscriptionItemStyle: {
		borderWidth: 1,
		borderColor: '#f2f2f2',
		borderRadius: 4,
		paddingHorizontal: config.metrics.sm,
		paddingVertical: config.metrics.rg,
		marginBottom: config.metrics.md,
		...layout.shadowLight,
	},
	textStyle: {
		fontFamily: 'Alata-Regular',
	},
	feesContainer: {
		alignItems: 'flex-end',
	},
});

export default SubscriptionItem;
