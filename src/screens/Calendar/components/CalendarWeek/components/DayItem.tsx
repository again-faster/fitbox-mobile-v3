import { Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memo } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

export type IWeek = {
	weekday: string;
	date: string;
	display: string;
};

interface DayItemProps {
	item: IWeek;
	isActive: boolean;
	isToday: boolean;
	onPress: () => void;
}

const DayItem = ({
	item: { display, weekday },
	isActive,
	isToday,
	onPress,
}: DayItemProps) => (
	<TouchableWithoutFeedback onPress={onPress}>
		<View style={[layout.flex_1, layout.justifyCenter, layout.itemsCenter]}>
			<Text color="gray100" bold size="xs">
				{weekday}
			</Text>
			<View
				style={[
					styles.itemDay,
					isActive && styles.itemDayActive,
					isToday && styles.itemDayToday,
				]}
			>
				<Text
					center
					color={
						// eslint-disable-next-line no-nested-ternary
						isActive ? 'light' : isToday ? 'brand' : 'gray800'
					}
					size="rg"
				>
					{display}
				</Text>
			</View>
		</View>
	</TouchableWithoutFeedback>
);

export default memo(DayItem);

const styles = StyleSheet.create({
	itemDay: {
		borderRadius: 100,
		padding: 5,
		height: config.fonts.metrics.md * 2,
		width: config.fonts.metrics.md * 2,
		marginTop: config.metrics.sm,
		justifyContent: 'center',
		alignItems: 'center',
	},
	itemDayActive: {
		backgroundColor: config.fonts.colors.brand,
	},
	itemDayToday: {
		borderColor: config.fonts.colors.brand,
		borderWidth: 1,
	},
});
