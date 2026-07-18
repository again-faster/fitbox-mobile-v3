import { HR, Row, Spacer, Text } from '@/components/atoms';
import { MemberCard, MemberPill } from '@/components/member';
import getAttendanceGraph from '@/services/leaderboards/getAttendanceGraph';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
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
	View,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Line } from 'react-native-svg';
import { BarChart, XAxis, YAxis } from 'react-native-svg-charts';
import MonthlyAttendanceGoal from './MonthlyAttendanceGoal';

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

	const { attendanceReportState, gymId, memberId } = useStore(state => ({
		attendanceReportState: state.attendanceReportState,
		gymId: state.teamId,
		memberId: state.loggedInUser?.user_data.user_id,
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
			<View style={styles.tabRow}>
				{tabs.map(tab => (
					<MemberPill
						key={tab.value}
						label={tab.label}
						selected={activeTab === tab.value}
						onPress={() => setActiveTab(tab.value)}
					/>
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
		<ScrollView
			style={styles.container}
			contentContainerStyle={styles.contentContainer}
			showsVerticalScrollIndicator={false}
		>
			<Text bold style={styles.pageTitle}>
				Build your training rhythm.
			</Text>
			<Text style={styles.pageSubtitle}>
				Every visit adds up. Set a goal and see your consistency grow.
			</Text>
			<MonthlyAttendanceGoal
				attendanceCount={attendanceReportState.monthToDate ?? 0}
				gymId={gymId}
				memberId={memberId}
			/>
			{renderTabs()}
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
			<MemberCard style={styles.trendCard}>
				<View style={styles.trendHeader}>
					<View>
						<Text bold style={styles.sectionTitle}>
							Attendance trend
						</Text>
						<Text style={styles.sectionSubtitle}>
							{activeTab === 'month'
								? `Monthly visits in ${filterValue}`
								: 'Your year-by-year consistency'}
						</Text>
					</View>
					{activeTab === 'month' && !isDropdownLoading && (
						<DropDownPicker
							open={isFilterOpen}
							value={filterValue}
							items={yearFilters}
							setOpen={setIsFilterOpen}
							setValue={value => setFilterValue(value)}
							textStyle={{ fontSize: config.fonts.metrics.sm }}
							style={styles.dropDownStyle}
							dropDownContainerStyle={
								styles.dropDownContainerStyle
							}
							listItemLabelStyle={{
								fontSize: config.fonts.metrics.sm,
							}}
							labelStyle={{ fontSize: config.fonts.metrics.sm }}
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
				</View>
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
									formatLabel={(
										_value: unknown,
										index: number,
									) => labels[index]}
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
			</MemberCard>
			<View style={[layout.row, layout.justifyBetween]}>
				{activeTab === 'month' ? (
					<MemberCard
						elevated={false}
						style={[layout.flex_1, styles.attendanceContainer]}
					>
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
					</MemberCard>
				) : (
					<MemberCard
						elevated={false}
						style={[layout.flex_1, styles.attendanceContainer]}
					>
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
					</MemberCard>
				)}
				<MemberCard
					elevated={false}
					style={[layout.flex_1, styles.attendanceContainer]}
				>
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
				</MemberCard>
			</View>
			<MemberCard style={styles.summaryCard}>
				<Text bold style={styles.sectionTitle}>
					{`${tableTitle}ly summary ${activeTab === 'month' ? filterValue : ''}`}
				</Text>
				<Spacer />
				<FlatList
					data={tableData}
					renderItem={renderTableItems}
					scrollEnabled={false}
				/>
			</MemberCard>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	chartContainer: {
		paddingTop: memberTheme.spacing.sm,
		height: 250,
	},
	container: {
		flex: 1,
		backgroundColor: memberTheme.colors.background,
	},
	contentContainer: {
		paddingHorizontal: memberTheme.spacing.lg,
		paddingTop: memberTheme.spacing.xl,
		paddingBottom: 48,
	},
	pageTitle: {
		fontSize: 30,
		lineHeight: 36,
		color: memberTheme.colors.ink,
		maxWidth: 320,
	},
	pageSubtitle: {
		fontSize: 14,
		lineHeight: 21,
		color: memberTheme.colors.textMuted,
		marginTop: memberTheme.spacing.sm,
		marginBottom: memberTheme.spacing.xl,
		maxWidth: 330,
	},
	tabRow: {
		flexDirection: 'row',
		gap: memberTheme.spacing.sm,
		marginBottom: memberTheme.spacing.lg,
	},
	trendCard: {
		marginBottom: memberTheme.spacing.md,
		zIndex: 2,
	},
	trendHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		zIndex: 4,
	},
	sectionTitle: {
		fontSize: 18,
		lineHeight: 24,
		color: memberTheme.colors.ink,
	},
	sectionSubtitle: {
		fontSize: 12,
		lineHeight: 18,
		color: memberTheme.colors.textMuted,
		marginTop: memberTheme.spacing.xs,
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
		fontSize: 11,
		color: memberTheme.colors.textMuted,
		marginTop: memberTheme.spacing.xs,
	},
	attendanceContainer: {
		marginHorizontal: memberTheme.spacing.xs,
		marginBottom: memberTheme.spacing.md,
		padding: memberTheme.spacing.md,
	},
	attendanceValue: {
		fontSize: 24,
		lineHeight: 28,
		color: memberTheme.colors.ink,
	},
	attendanceIcon: {
		width: 22,
		height: 22,
		marginRight: memberTheme.spacing.sm,
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
		width: 82,
		height: 38,
		borderRadius: memberTheme.radius.pill,
		paddingVertical: 0,
		paddingHorizontal: memberTheme.spacing.md,
		minHeight: 38,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	dropDownContainerStyle: {
		width: 82,
		borderRadius: memberTheme.radius.md,
		alignSelf: 'flex-end',
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surface,
	},
	summaryCard: {
		marginTop: memberTheme.spacing.sm,
	},
});

export default AttendanceScreen;
