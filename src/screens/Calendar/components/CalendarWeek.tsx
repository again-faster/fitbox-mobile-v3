import { Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { Constant } from '@/utils';
import useStore from '@/zustand/Store';
import moment from 'moment';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import SwiperFlatList from 'react-native-swiper-flatlist';

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

	const [currentIndex, setCurrentIndex] = useState(0);

	const swiper = useRef<SwiperFlatList>(null);

	const weeks = useMemo(() => {
		const start = moment(currentDate).startOf('isoWeek');
		return [-1, 0, 1].map(adj => {
			return Array.from({ length: 7 }).map((_, index) => {
				const date = moment(start).add(adj, 'week').add(index, 'day');
				return {
					weekday: date.format('ddd'),
					date: date.format(Constant.DEFAULT_DATE_FORMAT),
					display: date.format('DD'),
				};
			});
		});
	}, [currentDate]);

	// listen if swiped to left or right on date is prev and forward
	useEffect(() => {
		// scroll to index of current date
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

	const handleChangeIndex = (index: number) => {
		if (index === currentIndex) return;
		setCurrentIndex(index);

		let useDate;
		// eslint-disable-next-line default-case
		switch (index) {
			case 0:
				useDate = moment(currentDate)
					.startOf('isoWeek')
					.subtract(1, 'day')
					.format(Constant.DEFAULT_DATE_FORMAT);
				break;
			case 2:
				useDate = moment(currentDate)
					.endOf('isoWeek')
					.add(1, 'day')
					.format(Constant.DEFAULT_DATE_FORMAT);
		}

		if (useDate) {
			onMomentumScrollBegin();
			setCurrentDate(useDate);
		}
	};

	return (
		<View>
			<SwiperFlatList
				ref={swiper}
				// TODO: Temporarily disabling gesture
				disableGesture
				autoplayLoop={false}
				showPagination={false}
				onMomentumScrollBegin={onMomentumScrollBegin}
				onMomentumScrollEnd={onMomentumScrollEnd}
				decelerationRate="fast"
				onChangeIndex={({ index }) => handleChangeIndex(index)}
			>
				{weeks.map((dates, index) => (
					<View style={styles.itemRow} key={index}>
						{dates.map((item, dateIndex) => {
							const isActive = currentDate === item.date;
							const isToday =
								item.date ===
								moment().format(Constant.DEFAULT_DATE_FORMAT);
							return (
								<TouchableWithoutFeedback
									key={dateIndex}
									onPress={() => setCurrentDate(item.date)}
								>
									<View
										style={[
											layout.flex_1,
											layout.justifyCenter,
											layout.itemsCenter,
										]}
									>
										<Text color="gray100" bold size="xs">
											{item.weekday}
										</Text>
										<View
											style={[
												styles.itemDay,
												isActive &&
													styles.itemDayActive,
											]}
										>
											<Text
												center
												color={
													// eslint-disable-next-line no-nested-ternary
													isActive
														? 'light'
														: isToday
														? 'brand'
														: 'gray800'
												}
												size="rg"
											>
												{item.display}
											</Text>
										</View>
									</View>
								</TouchableWithoutFeedback>
							);
						})}
					</View>
				))}
			</SwiperFlatList>
		</View>
	);
};

export default CalendarWeek;

const styles = StyleSheet.create({
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
