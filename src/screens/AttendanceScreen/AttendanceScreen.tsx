import { HR, Row, Spacer, Text } from '@/components/atoms';
import getAttendanceGraph from '@/services/leaderboards/getAttendanceGraph';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import resources from '@/theme/resources';
import { AttendanceGraphType } from '@/types/schemas/leaderboards';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Image,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Line } from 'react-native-svg';
import { BarChart, XAxis, YAxis } from 'react-native-svg-charts';

// TODO: Add target lines once data is available
// const TargetLines = ({ targetData, x, y, bandwidth }) => (
// 	<G>
// 		{targetData.map((value, index) => (
// 			<Line
// 				key={index}
// 				x1={x(index)}
// 				x2={x(index) + bandwidth}
// 				y1={y(value)}
// 				y2={y(value)}
// 				stroke="orange"
// 				strokeWidth={4}
// 			/>
// 		))}
// 	</G>
// );

const tabs = [
	{ label: 'Month', value: 'month' },
	{ label: 'Year', value: 'year' },
];

const AttendanceScreen = () => {
	// const targetData = data.map(item => item.target);
	// const combinedData = [...attendanceData, ...targetData];
	// const yMin = 0;
	// const yMax = Math.max(...attendanceData);

	const [filterValue, setFilterValue] = useState<string>(
		new Date().getFullYear().toString(),
	);

	const currentMonth = new Date().getMonth();

	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

	const { attendanceReportState } = useStore(state => ({
		attendanceReportState: state.attendanceReportState,
	}));

	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isDropdownLoading, setIsDropdownLoading] = useState<boolean>(true);

	const [activeTab, setActiveTab] = useState<string>(
		tabs[0]?.value as string,
	);
	const [yearData, setYearData] = useState<AttendanceGraphType>([]);
	const [monthData, setMonthData] = useState<AttendanceGraphType>([]);

	const [yearLabels, setYearLabels] = useState<string[]>([]);
	const [monthLabels, setMonthLabels] = useState<string[]>([]);

	const [yearFilters, setYearFilters] = useState<
		{ label: string; value: string }[]
	>([]);

	useEffect(() => {
		setIsDropdownLoading(true);
		getAttendanceGraph('year', filterValue)
			.then(res => {
				if (res) {
					const filters = res.data
						.map(item => ({
							label: item.label,
							value: item.label,
						}))
						.reverse();
					const xLabels = res.data.map(item => item.label);
					setYearFilters(filters);
					setYearData(res.data);
					setYearLabels(xLabels);
				}
			})
			.catch(err => Say.err(err as ICatchError))
			.finally(() => {
				setIsDropdownLoading(false);
			});
	}, []);

	useEffect(() => {
		setIsLoading(true);
		getAttendanceGraph('month', filterValue)
			.then(res => {
				if (res) {
					const currentYearData = res.data.slice(0, currentMonth + 1);

					if (filterValue === new Date().getFullYear().toString()) {
						const trimmedLabels = currentYearData.map(item =>
							item.label.substring(0, 3),
						);
						setMonthLabels(trimmedLabels);
						setMonthData(currentYearData);
					} else {
						const trimmedLabels = res.data.map(item =>
							item.label.substring(0, 3),
						);
						setMonthLabels(trimmedLabels);
						setMonthData(res.data);
					}
				}
			})
			.catch(err => Say.err(err as ICatchError))
			.finally(() => setIsLoading(false));
	}, [filterValue]);

	const attendanceData =
		activeTab === 'month'
			? monthData.map(item => item.value)
			: yearData.map(item => item.value);
	const attendanceMax = Math.max(...attendanceData);

	let numberOfTicks;
	if (attendanceMax === 0) {
		numberOfTicks = 1;
	} else if (attendanceMax < 5) {
		numberOfTicks = attendanceMax;
	} else {
		numberOfTicks = 5;
	}

	const tableData = activeTab === 'month' ? monthData : yearData;
	const tableTitle = tabs.find(tab => tab.value === activeTab)?.label;
	const labels = activeTab === 'month' ? monthLabels : yearLabels;

	const getXContentInset = (barCount: number) => {
		const count = Math.max(barCount, 1);

		const minInset = 10;
		const a = 160;
		const b = 1.5;

		const inset = Math.max(minInset, Math.round(a / count ** b));

		return { left: inset, right: inset };
	};

	const renderTabs = () => {
		return (
			<View style={layout.row}>
				{tabs.map(tab => (
					<TouchableOpacity
						style={{
							backgroundColor:
								activeTab === tab.value
									? config.colors.info
									: config.backgrounds.lightgrey,
							...styles.tabButton,
						}}
						key={tab.value}
						onPress={() => setActiveTab(tab.value)}
					>
						<Text
							color={
								activeTab === tab.value ? 'light' : 'darkgray'
							}
							bold
						>
							{tab.label}
						</Text>
					</TouchableOpacity>
				))}
			</View>
		);
	};

	const renderTableItems = ({
		item,
	}: {
		item: { label: string; value: number };
	}) => {
		return (
			<View style={{ marginHorizontal: config.metrics.lg }}>
				<Row>
					<View style={[styles.flex_1_2]}>
						<Text size="sm">{item.label}</Text>
					</View>
					<View style={[layout.itemsCenter, layout.flex_1]}>
						<Text size="sm">{item.value}</Text>
					</View>
					{/* <View style={[layout.itemsCenter, layout.flex_1]}>
						<Text size="sm">{item.target}</Text>
					</View> */}
				</Row>
				<HR margin={false} />
			</View>
		);
	};

	return (
		<ScrollView style={styles.container}>
			{renderTabs()}
			<Spacer />
			{/* TODO: Add legends once we have target data */}
			{/* <View style={[layout.row, layout.itemsCenter]}>
				<View
					style={{
						backgroundColor: config.colors.brand,
						...styles.legend,
					}}
				/>
				<Text size="sm">Attendance</Text>
			</View> */}
			{/* <View style={[layout.row, layout.itemsCenter]}>
				<View
					style={{
						backgroundColor: config.colors.orange,
						...styles.legend,
					}}
				/>
				<Text size="sm">Target</Text>
			</View> */}
			{activeTab === 'month' && !isDropdownLoading && (
				<DropDownPicker
					open={isFilterOpen}
					value={filterValue}
					items={yearFilters}
					setOpen={setIsFilterOpen}
					setValue={value => setFilterValue(value)}
					textStyle={{ fontSize: config.fonts.metrics.sm }}
					style={styles.dropDownStyle}
					dropDownContainerStyle={styles.dropDownContainerStyle}
					listItemLabelStyle={{
						fontSize: config.fonts.metrics.sm,
					}}
					labelStyle={{
						fontSize: config.fonts.metrics.sm,
					}}
					arrowIconStyle={{
						width: config.metrics.rg,
						height: config.metrics.rg,
					}}
					tickIconStyle={{
						width: config.metrics.md,
						height: config.metrics.md,
					}}
					listMode="SCROLLVIEW"
					placeholder=""
				/>
			)}
			<View style={styles.chartContainer}>
				{isLoading ? (
					<View
						style={[
							layout.itemsCenter,
							layout.justifyCenter,
							layout.flex_1,
						]}
					>
						<ActivityIndicator color={config.colors.brand} />
					</View>
				) : (
					<Row>
						<YAxis
							data={attendanceData}
							contentInset={{ top: 20, bottom: 20 }}
							svg={{ fontSize: 10, fill: 'grey' }}
							numberOfTicks={numberOfTicks}
							style={styles.y}
							formatLabel={(value: number) =>
								value === 0 ? '' : value.toString()
							}
							min={0}
						/>
						<View
							style={[
								layout.flex_1,
								{ marginLeft: config.metrics.rg },
							]}
						>
							<BarChart
								style={styles.barChart}
								data={attendanceData}
								svg={{ fill: config.colors.brand }}
								spacingInner={0.5}
								contentInset={{ top: 20, bottom: 20 }}
								yMin={0}
							>
								<Line
									x1="0"
									x2="0"
									y1="0"
									y2="90%"
									stroke="black"
									strokeWidth="1"
								/>
								<Line
									x1="0"
									x2="100%"
									y1="90%"
									y2="90%"
									stroke="black"
									strokeWidth="1"
								/>
							</BarChart>
							<XAxis
								data={attendanceData}
								formatLabel={(_value: unknown, index: number) =>
									labels[index]
								}
								contentInset={getXContentInset(
									attendanceData.length,
								)}
								svg={{ fontSize: 10, fill: 'grey' }}
								style={styles.x}
								spacingInner={0.5}
							/>
						</View>
					</Row>
				)}
			</View>
			<View style={[layout.row, layout.justifyBetween]}>
				{activeTab === 'month' ? (
					<View style={[layout.flex_1, styles.attendanceContainer]}>
						<Row align="center">
							<Image
								source={resources.icon.monthToDate}
								style={styles.attendanceIcon}
							/>
							<Text
								style={styles.attendanceValue}
								bold
								allowFontScaling={false}
							>
								{attendanceReportState.monthToDate}
							</Text>
							<Text
								size="rg"
								style={styles.attendanceText}
								allowFontScaling={false}
							>
								this month
							</Text>
						</Row>
					</View>
				) : (
					<View style={[layout.flex_1, styles.attendanceContainer]}>
						<Row align="center">
							<Image
								source={resources.icon.yearToDate}
								style={styles.attendanceIcon}
							/>
							<Text
								style={styles.attendanceValue}
								bold
								allowFontScaling={false}
							>
								{attendanceReportState.yearToDate}
							</Text>
							<Text
								size="rg"
								style={styles.attendanceText}
								allowFontScaling={false}
							>
								this year
							</Text>
						</Row>
					</View>
				)}
				<View style={[layout.flex_1, styles.attendanceContainer]}>
					<Row align="center">
						<Image
							source={resources.icon.trophy}
							style={styles.attendanceIcon}
						/>
						<Text
							style={styles.attendanceValue}
							bold
							allowFontScaling={false}
						>
							{attendanceReportState.lifetime}
						</Text>
						<Text
							size="rg"
							style={styles.attendanceText}
							allowFontScaling={false}
						>
							all time
						</Text>
					</Row>
				</View>
			</View>
			<Spacer size={config.metrics.xl} />
			<Text
				size="sm"
				bold
			>{`${tableTitle}ly Attendance Summary ${activeTab === 'month' ? filterValue : ''}: `}</Text>
			<Spacer />
			<View>
				<FlatList
					data={tableData}
					renderItem={renderTableItems}
					scrollEnabled={false}
				/>
			</View>
			<Spacer />
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	chartContainer: {
		padding: 10,
		height: 250,
	},
	container: {
		flex: 1,
		paddingHorizontal: config.metrics.lg,
		marginTop: 20,
	},
	tabButton: {
		alignItems: 'center',
		justifyContent: 'center',
		height: 35,
		flex: 1,
	},
	legend: {
		height: 4,
		width: 15,
		marginRight: config.metrics.sm,
	},
	flex_1_2: {
		flex: 1,
	},
	attendanceText: {
		paddingBottom: 2,
		alignSelf: 'flex-end',
		marginLeft: config.metrics.sm,
	},
	attendanceContainer: {
		alignItems: 'center',
		marginBottom: config.metrics.sm,
	},
	attendanceValue: { fontSize: 20 },
	attendanceIcon: {
		width: 25,
		height: 25,
		marginRight: 8,
	},
	labelsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		// marginTop: 10,
	},
	labelText: {
		fontSize: 12,
		color: '#555',
	},
	barChart: {
		height: 200,
		marginVertical: 20,
	},
	x: {
		height: 10,
		marginTop: -30,
	},
	y: {
		height: 200,
		marginTop: 20,
	},
	dropDownStyle: {
		width: 80,
		height: 30,
		borderRadius: 0,
		paddingVertical: 0,
		paddingHorizontal: 8,
		minHeight: 30,
		alignSelf: 'flex-end',
		borderColor: config.borders.colors.lightgrey,
		marginTop: config.metrics.rg,
	},
	dropDownContainerStyle: {
		width: 80,
		borderRadius: 0,
		alignSelf: 'flex-end',
		borderColor: config.borders.colors.lightgrey,
		marginTop: config.metrics.rg,
	},
});

export default AttendanceScreen;
