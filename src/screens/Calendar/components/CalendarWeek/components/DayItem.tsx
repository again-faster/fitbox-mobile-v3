import { Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import useStore from '@/zustand/Store';
import moment from 'moment';
import { memo, useMemo } from 'react';
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
	item: { date, display, weekday },
	isActive,
	isToday,
	onPress,
}: DayItemProps) => {
	const activeMonth = useStore(s => s.activeMonth);

	const isFirstOrLastDayOfMonth = useMemo(() => {
		return (
			moment(date).isSame(moment(date).startOf('month'), 'day') ||
			moment(date).isSame(moment(date).endOf('month'), 'day')
		);
	}, [date]);

	const topDisplay = useMemo(() => {
		const isSameMonth = moment(date).format('MMM') === activeMonth;
		if (isSameMonth || !isFirstOrLastDayOfMonth) {
			return weekday;
		}

		return moment(date).format('MMM');
	}, [activeMonth]);

	return (
		<TouchableWithoutFeedback
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`${weekday} ${moment(date).format('D MMMM')}`}
			accessibilityState={{ selected: isActive }}
		>
			<View
				pointerEvents="box-only"
				style={[
					layout.flex_1,
					layout.justifyCenter,
					layout.itemsCenter,
				]}
			>
				<Text
					style={{
						color: isFirstOrLastDayOfMonth
							? memberTheme.colors.primary
							: memberTheme.colors.textMuted,
					}}
					bold
					size="xs"
					allowFontScaling={false}
				>
					{topDisplay}
				</Text>
				<View
					style={[
						styles.itemDay,
						isActive && styles.itemDayActive,
						isToday && styles.itemDayToday,
					]}
				>
					<Text
						allowFontScaling={false}
						center
						style={{
							color:
								// eslint-disable-next-line no-nested-ternary
								isActive
									? memberTheme.colors.surface
									: isToday
										? memberTheme.colors.primary
										: memberTheme.colors.text,
						}}
						size="rg"
					>
						{display}
					</Text>
				</View>
			</View>
		</TouchableWithoutFeedback>
	);
};

export default memo(DayItem, (prevProps, nextProps) => {
	return (
		prevProps.isActive === nextProps.isActive &&
		prevProps.isToday === nextProps.isToday
	);
});

const styles = StyleSheet.create({
	itemDay: {
		borderRadius: 100,
		padding: 5,
		height: config.fonts.metrics.md * 2,
		width: config.fonts.metrics.md * 2,
		marginTop: config.metrics.sm,
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	itemDayActive: {
		backgroundColor: memberTheme.colors.primary,
	},
	itemDayToday: {
		borderColor: memberTheme.colors.primary,
		borderWidth: 1,
	},
});
