import { config } from '@/theme/_config';
import { Constant } from '@/utils';
import useStore from '@/zustand/Store';
import { FlashList } from '@shopify/flash-list';
import moment from 'moment';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import DayItem, { IWeek } from './components/DayItem';

interface CalendarWeekProps {
	currentDate: string;
	setCurrentDate: (currentDate: string) => void;
	onMomentumScrollBegin: () => void;
	onMomentumScrollEnd: () => void;
}
const CalendarWeek = ({
	currentDate,
	setCurrentDate,
	onMomentumScrollBegin,
	onMomentumScrollEnd,
}: CalendarWeekProps) => {
	const { setActiveMonth } = useStore(state => ({
		setActiveMonth: state.setActiveMonth,
	}));

	const swiper = useRef<FlashList<IWeek[]>>(null);

	const weeks: IWeek[][] = useMemo(() => {
		const start = moment(currentDate).startOf('year').startOf('isoWeek');
		const end = moment(currentDate).endOf('year').endOf('isoWeek');
		const weeksArray = [];

		const current = start.clone();
		while (current.isBefore(end)) {
			const week = Array.from({ length: 7 }).map((_, index) => {
				const date = current.clone().add(index, 'day');
				return {
					weekday: date.format('ddd'),
					date: date.format(Constant.DEFAULT_DATE_FORMAT),
					display: date.format('DD'),
				};
			});
			weeksArray.push(week);
			current.add(1, 'week');
		}

		return weeksArray;
	}, [currentDate]);

	useEffect(() => {
		const index = weeks.findIndex(w =>
			w.some(day => day.date === currentDate),
		);

		if (index !== -1) {
			swiper.current?.scrollToIndex({
				index,
				animated: false,
			});
		}

		setActiveMonth(moment(currentDate).format('MMMM'));
	}, [currentDate]);

	const renderItem = useCallback(
		// eslint-disable-next-line react/no-unused-prop-types
		({ item: dates, index }: { item: IWeek[]; index: number }) => (
			<View style={styles.itemRow} key={index}>
				{dates.map(item => {
					const isActive = currentDate === item.date;
					const isToday =
						item.date ===
						moment().format(Constant.DEFAULT_DATE_FORMAT);
					return (
						<DayItem
							key={item.date}
							item={item}
							isActive={isActive}
							isToday={isToday}
							onPress={() => setCurrentDate(item.date)}
						/>
					);
				})}
			</View>
		),
		[currentDate, setCurrentDate],
	);

	return (
		<View style={styles.container}>
			<FlashList
				ref={swiper}
				horizontal
				onMomentumScrollBegin={onMomentumScrollBegin}
				onMomentumScrollEnd={onMomentumScrollEnd}
				decelerationRate="fast"
				data={weeks}
				keyExtractor={(_, index) => index.toString()}
				snapToAlignment="center"
				snapToInterval={Constant.DEVICEWIDTH}
				renderItem={renderItem}
				estimatedItemSize={Constant.DEVICEWIDTH}
				overrideItemLayout={layout => {
					// eslint-disable-next-line no-param-reassign
					layout.size = Constant.DEVICEWIDTH; // Set a fixed height for each item
				}}
			/>
		</View>
	);
};

export default CalendarWeek;

const styles = StyleSheet.create({
	container: {
		flex: 0.11,
	},
	item: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	itemDay: {
		borderRadius: 100,
		padding: 5,
		height: config.fonts.metrics.md * 2,
		width: config.fonts.metrics.md * 2,
		marginTop: config.metrics.sm,
		justifyContent: 'center',
		display: 'flex',
		alignItems: 'center',
	},
	itemDayActive: {
		backgroundColor: config.fonts.colors.brand,
	},
	itemRow: {
		width: Constant.DEVICEWIDTH,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 4,
		paddingVertical: 10,
		gap: 4,
	},
});
