import { Row, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Switch } from 'react-native-paper';

interface ScoreHeaderProps {
	title: string;
	hideRxSwitch: boolean;
	isRx: boolean;
	onRxChange: (val: boolean) => void;
}

const ScoreHeader = ({
	title,
	hideRxSwitch,
	isRx,
	onRxChange,
}: ScoreHeaderProps) => {
	const { width } = Dimensions.get('window');
	const characterLimit = width < 400 ? 20 : 30;
	const titleFontSize = title.length > characterLimit ? 'lg' : 'xl';
	const numberOfLines = title.length > characterLimit ? 4 : 0;

	return (
		<View style={styles.titleContainer}>
			<Text
				size={titleFontSize}
				bold
				style={layout.flex_1}
				numberOfLines={numberOfLines}
			>
				{title}
			</Text>

			{!hideRxSwitch && (
				<Row style={[layout.itemsCenter]}>
					<Switch
						color={config.fonts.colors.brand}
						value={isRx}
						onValueChange={val => {
							onRxChange(val);
						}}
						style={styles.switch}
					/>
					<Text size="xl" bold color="darkgray">
						Rx
					</Text>
				</Row>
			)}
		</View>
	);
};

export default memo(ScoreHeader);

const styles = StyleSheet.create({
	titleContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		padding: config.metrics.rg,
	},
	switch: {
		transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
	},
});
