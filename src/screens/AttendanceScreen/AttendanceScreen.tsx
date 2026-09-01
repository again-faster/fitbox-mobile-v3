import { Text } from '@/components/atoms';
import { MemberCard, MemberPill } from '@/components/member';
import getAttendanceGraph from '@/services/leaderboards/getAttendanceGraph';
import { config } from '@/theme/_config';
import { memberTheme } from '@/theme/member';
import resources from '@/theme/resources';
import type { DashboardParamList } from '@/types/navigation';
import type { AttendanceGraphType } from '@/types/schemas/leaderboards';
import { Say } from '@/utils';
import type { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import type { StackScreenProps } from '@react-navigation/stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	ScrollView,
	StatusBar,
	StyleSheet,
	TouchableOpacity,
	View,
	useWindowDimensions,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { Line } from 'react-native-svg';
import { BarChart, XAxis, YAxis } from 'react-native-svg-charts';
import { SafeAreaView } from 'react-native-safe-area-context';
import AttendanceHeader from './components/AttendanceHeader';
import MonthlyAttendanceGoal from './MonthlyAttendanceGoal';

const tabs = [
	{ label: 'Month', value: 'month' },
	{ label: 'Year', value: 'year' },
] as const;

type AttendancePeriod = (typeof tabs)[number]['value'];

interface AttendanceGraphResponseStatus {
	data?: unknown;
	message?: string | null;
	error?: boolean | null;
}

export const isAttendanceGraphError = (
	response: AttendanceGraphResponseStatus | null | undefined,
) => response?.error === true;

interface AttendanceGraphErrorProps {
	period: AttendancePeriod;
	onRetry: () => void;
}

export const AttendanceGraphError = ({
	period,
	onRetry,
}: AttendanceGraphErrorProps) => {
	const periodLabel = period === 'month' ? 'monthly' : 'yearly';

	return (
		<View style={styles.chartMessage}>
			<Text bold style={styles.graphErrorTitle}>
				Could not load this graph
			</Text>
			<Text style={styles.graphErrorText}>
				{`We couldn't load your ${periodLabel} attendance chart.`}
			</Text>
			<TouchableOpacity
				style={styles.retryButton}
				onPress={onRetry}
				accessibilityRole="button"
				accessibilityLabel="Retry"
			>
				<Text bold style={styles.retryLabel}>
					Retry
				</Text>
			</TouchableOpacity>
		</View>
	);
};

type AttendanceScreenProps = StackScreenProps<DashboardParamList, 'Attendance'>;

const AttendanceScreen = ({ navigation }: AttendanceScreenProps) => {
	const [filterValue, setFilterValue] = useState<string>(
		new Date().getFullYear().toString(),
	);
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
	const [isMonthLoading, setIsMonthLoading] = useState<boolean>(true);
	const [isYearLoading, setIsYearLoading] = useState<boolean>(true);
	const [monthError, setMonthError] = useState<boolean>(false);
	const [yearError, setYearError] = useState<boolean>(false);
	const [activeTab, setActiveTab] = useState<AttendancePeriod>('month');
	const [yearData, setYearData] = useState<AttendanceGraphType>([]);
	const [monthData, setMonthData] = useState<AttendanceGraphType>([]);
	const [yearLabels, setYearLabels] = useState<string[]>([]);
	const [monthLabels, setMonthLabels] = useState<string[]>([]);
	const yearRequestId = useRef(0);
	const monthRequestId = useRef(0);
	const [yearFilters, setYearFilters] = useState<
		{ label: string; value: string }[]
	>([]);
	const { width } = useWindowDimensions();

	const currentMonth = new Date().getMonth();
	const { attendanceReportState, gymId, memberId } = useStore(state => ({
		attendanceReportState: state.attendanceReportState,
		gymId: state.teamId,
		memberId: state.loggedInUser?.user_data.user_id,
	}));

	const fetchYearGraph = useCallback(() => {
		const requestId = yearRequestId.current + 1;
		yearRequestId.current = requestId;
		setIsYearLoading(true);
		setYearError(false);

		return getAttendanceGraph('year', filterValue)
			.then(res => {
				if (requestId !== yearRequestId.current) {
					return;
				}

				if (isAttendanceGraphError(res)) {
					Say.err(res.message || 'Unable to load attendance data.');
					setYearError(true);
					return;
				}

				if (res) {
					setYearError(false);
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
			.catch(err => {
				if (requestId !== yearRequestId.current) {
					return;
				}

				Say.err(err as ICatchError);
				setYearError(true);
			})
			.finally(() => {
				if (requestId === yearRequestId.current) {
					setIsYearLoading(false);
				}
			});
	}, [filterValue]);

	const fetchMonthGraph = useCallback(() => {
		const requestId = monthRequestId.current + 1;
		monthRequestId.current = requestId;
		setIsMonthLoading(true);
		setMonthError(false);
		setMonthData([]);
		setMonthLabels([]);

		return getAttendanceGraph('month', filterValue)
			.then(res => {
				if (requestId !== monthRequestId.current) {
					return;
				}

				if (isAttendanceGraphError(res)) {
					Say.err(res.message || 'Unable to load attendance data.');
					setMonthError(true);
					return;
				}

				if (res) {
					setMonthError(false);
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
			.catch(err => {
				if (requestId !== monthRequestId.current) {
					return;
				}

				Say.err(err as ICatchError);
				setMonthError(true);
			})
			.finally(() => {
				if (requestId === monthRequestId.current) {
					setIsMonthLoading(false);
				}
			});
	}, [currentMonth, filterValue]);

	useEffect(() => {
		void fetchYearGraph();
	}, []);

	useEffect(() => {
		void fetchMonthGraph();
	}, [filterValue]);

	const attendanceData =
		activeTab === 'month'
			? monthData.map(item => item.value)
			: yearData.map(item => item.value);
	const attendanceMax = Math.max(...attendanceData, 0);

	let numberOfTicks = 5;
	if (attendanceMax === 0) {
		numberOfTicks = 1;
	} else if (attendanceMax < 5) {
		numberOfTicks = attendanceMax;
	} else {
		numberOfTicks = 5;
	}

	const tableData = activeTab === 'month' ? monthData : yearData;
	const tableTitle =
		tabs.find(tab => tab.value === activeTab)?.label ?? 'Month';
	const labels = activeTab === 'month' ? monthLabels : yearLabels;
	const summaryColumnCount = width >= 360 ? 2 : 1;
	const summarySplitIndex = Math.ceil(tableData.length / summaryColumnCount);
	const summaryColumns =
		summaryColumnCount === 2
			? [
					tableData.slice(0, summarySplitIndex),
					tableData.slice(summarySplitIndex),
				]
			: [tableData];

	const getXContentInset = (barCount: number) => {
		const count = Math.max(barCount, 1);
		const inset = Math.max(10, Math.round(160 / count ** 1.5));

		return { left: inset, right: inset };
	};

	const stats = [
		{
			key: 'selected-period',
			value:
				activeTab === 'month'
					? attendanceReportState.monthToDate
					: attendanceReportState.yearToDate,
			label: activeTab === 'month' ? 'this month' : 'this year',
			icon:
				activeTab === 'month'
					? resources.icon.monthToDate
					: resources.icon.yearToDate,
		},
		{
			key: 'lifetime',
			value: attendanceReportState.lifetime,
			label: 'all time',
			icon: resources.icon.trophy,
		},
	];
	const isActiveLoading =
		activeTab === 'month' ? isMonthLoading : isYearLoading;
	const activeGraphError = activeTab === 'month' ? monthError : yearError;
	const retryActiveGraph =
		activeTab === 'month' ? fetchMonthGraph : fetchYearGraph;

	const renderTabs = () => (
		<View style={styles.tabRow}>
			{tabs.map(tab => (
				<MemberPill
					key={tab.value}
					label={tab.label}
					selected={activeTab === tab.value}
					onPress={() => setActiveTab(tab.value)}
					style={styles.periodPill}
				/>
			))}
		</View>
	);

	const renderChart = () => {
		if (isActiveLoading) {
			return (
				<View style={styles.chartMessage}>
					<ActivityIndicator color={memberTheme.colors.primary} />
				</View>
			);
		}

		if (activeGraphError) {
			return (
				<AttendanceGraphError
					period={activeTab}
					onRetry={() => void retryActiveGraph()}
				/>
			);
		}

		if (attendanceData.length === 0) {
			return (
				<View style={styles.chartMessage}>
					<Text style={styles.emptyChartText}>
						No attendance data yet.
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.chartRow}>
				<YAxis
					data={attendanceData}
					contentInset={{ top: 16, bottom: 16 }}
					svg={{
						fontSize: 10,
						fill: memberTheme.colors.textMuted,
					}}
					numberOfTicks={numberOfTicks}
					style={styles.yAxis}
					formatLabel={(value: number) =>
						value === 0 ? '' : value.toString()
					}
					min={0}
				/>
				<View style={styles.chartBody}>
					<BarChart
						style={styles.barChart}
						data={attendanceData}
						svg={{ fill: memberTheme.colors.primary }}
						spacingInner={0.5}
						contentInset={{ top: 16, bottom: 16 }}
						yMin={0}
					>
						<Line
							x1="0"
							x2="0"
							y1="0"
							y2="90%"
							stroke={memberTheme.colors.border}
							strokeWidth="1"
						/>
						<Line
							x1="0"
							x2="100%"
							y1="90%"
							y2="90%"
							stroke={memberTheme.colors.border}
							strokeWidth="1"
						/>
					</BarChart>
					<XAxis
						data={attendanceData}
						formatLabel={(_value: unknown, index: number) =>
							labels[index] ?? ''
						}
						contentInset={getXContentInset(attendanceData.length)}
						svg={{
							fontSize: 10,
							fill: memberTheme.colors.textMuted,
						}}
						style={styles.xAxis}
						spacingInner={0.5}
					/>
				</View>
			</View>
		);
	};

	return (
		<View style={styles.container}>
			<StatusBar
				barStyle="light-content"
				backgroundColor={memberTheme.colors.primary}
			/>
			<SafeAreaView style={styles.headerSafeArea} edges={['top']}>
				<AttendanceHeader onBack={() => navigation.goBack()} />
			</SafeAreaView>
			<ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.contentContainer}
				showsVerticalScrollIndicator={false}
			>
				<MonthlyAttendanceGoal
					attendanceCount={attendanceReportState.monthToDate ?? 0}
					gymId={gymId}
					memberId={memberId}
				/>
				{renderTabs()}
				<MemberCard style={styles.trendCard}>
					<View style={styles.trendHeader}>
						<View style={styles.trendCopy}>
							<Text bold style={styles.sectionTitle}>
								Attendance trend
							</Text>
							<Text style={styles.sectionSubtitle}>
								{activeTab === 'month'
									? `Monthly visits in ${filterValue}`
									: 'Your year-by-year consistency'}
							</Text>
						</View>
						{activeTab === 'month' &&
							!isYearLoading &&
							!yearError &&
							yearFilters.length > 0 && (
								<DropDownPicker
									open={isFilterOpen}
									value={filterValue}
									items={yearFilters}
									setOpen={setIsFilterOpen}
									setValue={value => setFilterValue(value)}
									textStyle={{
										fontSize: config.fonts.metrics.sm,
									}}
									style={styles.dropDownStyle}
									dropDownContainerStyle={
										styles.dropDownContainerStyle
									}
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
					</View>
					<View style={styles.chartContainer}>{renderChart()}</View>
					<View style={styles.statsRow}>
						{stats.map(stat => (
							<View key={stat.key} style={styles.statItem}>
								<View style={styles.statIconCircle}>
									<Image
										source={stat.icon}
										style={styles.statIcon}
									/>
								</View>
								<Text
									bold
									style={styles.statValue}
									allowFontScaling={false}
								>
									{stat.value ?? 0}
								</Text>
								<Text
									style={styles.statLabel}
									allowFontScaling={false}
									numberOfLines={1}
								>
									{stat.label}
								</Text>
							</View>
						))}
					</View>
				</MemberCard>
				<MemberCard style={styles.summaryCard}>
					<View style={styles.summaryHeader}>
						<View style={styles.summaryHeading}>
							<Text bold style={styles.sectionTitle}>
								{`${tableTitle}ly summary ${
									activeTab === 'month' ? filterValue : ''
								}`}
							</Text>
							<Text style={styles.sectionSubtitle}>
								{activeTab === 'month'
									? 'A quick look at every month'
									: 'Your attendance across the years'}
							</Text>
						</View>
						{activeTab === 'month' && (
							<TouchableOpacity
								style={styles.viewYearButton}
								onPress={() => setActiveTab('year')}
								accessibilityRole="button"
								accessibilityLabel="View year summary"
							>
								<Text bold style={styles.viewYearLabel}>
									View year
								</Text>
							</TouchableOpacity>
						)}
					</View>
					{tableData.length === 0 ? (
						<Text style={styles.emptySummaryText}>
							No attendance data yet.
						</Text>
					) : (
						<View style={styles.summaryColumns}>
							{summaryColumns.map((column, columnIndex) => (
								<View
									key={`summary-column-${columnIndex}`}
									style={styles.summaryColumn}
								>
									{column.map((item, itemIndex) => (
										<View
											key={`${item.label}-${itemIndex}`}
											style={[
												styles.summaryRow,
												itemIndex < column.length - 1 &&
													styles.summaryRowDivider,
											]}
										>
											<Text
												style={styles.summaryLabel}
												numberOfLines={1}
											>
												{item.label}
											</Text>
											<Text
												bold
												style={styles.summaryValue}
											>
												{item.value}
											</Text>
										</View>
									))}
								</View>
							))}
						</View>
					)}
				</MemberCard>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: memberTheme.colors.background,
	},
	headerSafeArea: {
		backgroundColor: memberTheme.colors.primary,
	},
	scrollView: {
		flex: 1,
	},
	contentContainer: {
		paddingHorizontal: memberTheme.spacing.lg,
		paddingTop: memberTheme.spacing.xl,
		paddingBottom: 48,
	},
	tabRow: {
		flexDirection: 'row',
		gap: memberTheme.spacing.sm,
		marginBottom: memberTheme.spacing.lg,
	},
	periodPill: {
		flex: 1,
	},
	trendCard: {
		marginBottom: memberTheme.spacing.lg,
		zIndex: 2,
	},
	trendHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		zIndex: 4,
	},
	trendCopy: {
		flex: 1,
		minWidth: 0,
		paddingRight: memberTheme.spacing.sm,
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
	chartContainer: {
		height: 224,
		marginTop: memberTheme.spacing.lg,
	},
	chartMessage: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyChartText: {
		fontSize: 13,
		color: memberTheme.colors.textMuted,
	},
	graphErrorTitle: {
		fontSize: 15,
		lineHeight: 20,
		color: memberTheme.colors.ink,
		textAlign: 'center',
	},
	graphErrorText: {
		fontSize: 12,
		lineHeight: 18,
		color: memberTheme.colors.textMuted,
		textAlign: 'center',
		marginTop: memberTheme.spacing.xs,
	},
	retryButton: {
		minHeight: 38,
		borderWidth: 1,
		borderColor: memberTheme.colors.primary,
		borderRadius: memberTheme.radius.pill,
		paddingHorizontal: memberTheme.spacing.lg,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: memberTheme.spacing.md,
	},
	retryLabel: {
		fontSize: 12,
		color: memberTheme.colors.primary,
	},
	chartRow: {
		flex: 1,
		flexDirection: 'row',
	},
	yAxis: {
		width: 24,
		height: 176,
		marginTop: 8,
	},
	chartBody: {
		flex: 1,
		minWidth: 0,
		marginLeft: memberTheme.spacing.sm,
	},
	barChart: {
		height: 176,
	},
	xAxis: {
		height: 24,
		marginTop: memberTheme.spacing.xs,
	},
	statsRow: {
		flexDirection: 'row',
		borderTopWidth: 1,
		borderTopColor: memberTheme.colors.border,
		paddingTop: memberTheme.spacing.lg,
		marginTop: memberTheme.spacing.sm,
		gap: memberTheme.spacing.sm,
	},
	statItem: {
		flex: 1,
		minWidth: 0,
		alignItems: 'center',
	},
	statIconCircle: {
		width: 34,
		height: 34,
		borderRadius: 17,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		marginBottom: memberTheme.spacing.xs,
	},
	statIcon: {
		width: 18,
		height: 18,
	},
	statValue: {
		fontSize: 20,
		lineHeight: 24,
		color: memberTheme.colors.ink,
	},
	statLabel: {
		fontSize: 11,
		lineHeight: 16,
		color: memberTheme.colors.textMuted,
		textAlign: 'center',
		marginTop: 2,
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
	summaryHeader: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
	},
	summaryHeading: {
		flex: 1,
		minWidth: 0,
		paddingRight: memberTheme.spacing.sm,
	},
	viewYearButton: {
		minHeight: 36,
		borderWidth: 1,
		borderColor: memberTheme.colors.primary,
		borderRadius: memberTheme.radius.pill,
		paddingHorizontal: memberTheme.spacing.md,
		alignItems: 'center',
		justifyContent: 'center',
	},
	viewYearLabel: {
		fontSize: 12,
		color: memberTheme.colors.primary,
	},
	summaryColumns: {
		flexDirection: 'row',
		gap: memberTheme.spacing.lg,
		marginTop: memberTheme.spacing.lg,
	},
	summaryColumn: {
		flex: 1,
		minWidth: 0,
	},
	summaryRow: {
		minHeight: 38,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: memberTheme.spacing.sm,
	},
	summaryRowDivider: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: memberTheme.colors.border,
	},
	summaryLabel: {
		flex: 1,
		fontSize: 13,
		color: memberTheme.colors.text,
	},
	summaryValue: {
		fontSize: 13,
		color: memberTheme.colors.ink,
	},
	emptySummaryText: {
		fontSize: 13,
		color: memberTheme.colors.textMuted,
		marginTop: memberTheme.spacing.lg,
	},
});

export default AttendanceScreen;
