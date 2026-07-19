import { Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { Constant } from '@/utils';
import useStore from '@/zustand/Store';
import { useIsFocused } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import moment from 'moment';
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
} from 'react';
import { StyleSheet, View } from 'react-native';
import DayItem, { IWeek } from './components/DayItem';

export type CalendarWeekRef = {
	scrollToCurrentDate: () => void;
};

interface CalendarWeekProps {
	currentDate: string;
	setCurrentDate: (currentDate: string) => void;
	onMomentumScrollBegin?: () => void;
	onMomentumScrollEnd?: () => void;
}

const CalendarWeek = forwardRef<CalendarWeekRef, CalendarWeekProps>(
	(
		{
			currentDate,
			setCurrentDate,
			onMomentumScrollBegin = () => {},
			onMomentumScrollEnd = () => {},
		}: CalendarWeekProps,
		ref,
	) => {
		const { setActiveMonth } = useStore(state => ({
			setActiveMonth: state.setActiveMonth,
		}));

		const swiper = useRef<FlashList<IWeek[]>>(null);

		const weeks: IWeek[][] = useMemo(() => {
			const start = moment()
				.subtract(1, 'year')
				.startOf('year')
				.startOf('isoWeek');
			const end = moment(currentDate)
				.endOf('year')
				.add(1, 'year')
				.endOf('isoWeek');
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

		const scrollToCurrentDate = () => {
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
		};

		useEffect(() => {
			// scrollToCurrentDate();
		}, [currentDate]);

		useImperativeHandle(ref, () => ({
			scrollToCurrentDate,
		}));
		const isFocused = useIsFocused();
		useEffect(() => {
			if (isFocused) {
				setTimeout(() => {
					scrollToCurrentDate();
				}, 1800);
			}
		}, [isFocused]);

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
			<View style={[layout.shadowLight, styles.weekContainer]}>
				<View style={styles.weekList}>
					<FlashList
						ref={swiper}
						horizontal
						showsHorizontalScrollIndicator={false}
						onMomentumScrollBegin={onMomentumScrollBegin}
						onMomentumScrollEnd={onMomentumScrollEnd}
						decelerationRate="fast"
						data={weeks}
						keyExtractor={(_, index) => index.toString()}
						snapToAlignment="center"
						snapToInterval={Constant.DEVICEWIDTH}
						renderItem={renderItem}
						estimatedItemSize={Constant.DEVICEWIDTH}
						overrideItemLayout={l => {
							// eslint-disable-next-line no-param-reassign
							l.size = Constant.DEVICEWIDTH;
						}}
					/>
				</View>

				<View style={styles.currentDay}>
					<Text bold style={styles.currentDayText}>
						{moment(currentDate).format('dddd, MMM DD')}
					</Text>
				</View>
			</View>
		);
	},
);

export default CalendarWeek;

const styles = StyleSheet.create({
	weekContainer: {
		backgroundColor: memberTheme.colors.surface,
		borderBottomColor: memberTheme.colors.border,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	weekList: {
		height: 78,
		minHeight: 78,
		backgroundColor: memberTheme.colors.surface,
	},
	item: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	currentDay: {
		justifyContent: 'flex-end',
		minHeight: 52,
		backgroundColor: memberTheme.colors.surface,
		padding: config.metrics.md,
	},
	currentDayText: {
		color: memberTheme.colors.text,
		fontSize: 17,
	},
	itemRow: {
		width: Constant.DEVICEWIDTH,
		height: 78,
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingHorizontal: 4,
		paddingVertical: 8,
		gap: 4,
		backgroundColor: memberTheme.colors.surface,
	},
});
