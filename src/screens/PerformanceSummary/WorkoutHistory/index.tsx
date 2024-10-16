import { Row, Spacer, Text } from '@/components/atoms';
import { ScoreComponent } from '@/components/molecules';
import useKeyboardVisibility from '@/hooks/useKeyboardVisibility';
import { getPastPerformance } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { PerformanceSummaryParamList } from '@/types/navigation';
import {
	GetPastPerformanceResultSchemaType,
	PastPerformanceResultSchemaType,
} from '@/types/schemas/leaderboards';
import { Constant } from '@/utils';
import Say, { ICatchError } from '@/utils/Say';
import { WINDOW_HEIGHT } from '@gorhom/bottom-sheet';
import BottomSheet from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheet/BottomSheet';
import { StackScreenProps } from '@react-navigation/stack';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import WorkoutHistoryBS from './components/WorkoutHistoryBS';

const bottomSheetSpacing = WINDOW_HEIGHT * 0.3;
const iosVersion = parseInt(Platform.Version as string, 10);

interface MovementResult extends PastPerformanceResultSchemaType {
	id: number;
	movement_name: string;
}

type WorkoutHistoryProps = StackScreenProps<
	PerformanceSummaryParamList,
	'WorkoutHistory'
>;

const WorkoutHistory = ({ route, navigation }: WorkoutHistoryProps) => {
	const { isKeyboardVisible, keyboard } = useKeyboardVisibility();

	const { data, addResult } = route.params;

	const [sheetIndex, setSheetIndex] = useState<number>(addResult ? 0 : 1);
	const [isLoading, setIsLoading] = useState(true);
	const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
	const [results, setResults] = useState<GetPastPerformanceResultSchemaType>({
		section_scores: [],
		user_movement: [],
	});
	const [dateInput, setDateInput] = useState<string>(
		moment().format(Constant.DEFAULT_DATE_FORMAT),
	);

	const sheetRef = useRef<BottomSheet>(null);

	const setDatePickerVal = (date: moment.MomentInput) => {
		setDateInput(moment(date).format('YYYY-MM-DD'));
		setShowDatePicker(false);
	};

	const fetchDetails = () => {
		setIsLoading(true);

		void getPastPerformance(data.section_id)
			.then(res => {
				if (!res.error) {
					const section = data.section_wod;
					if (section.scoring_by === 'movement') {
						let movementResults: MovementResult[] = [];
						const movements = section?.wod_movements ?? [];
						movementResults = movements.map(
							({ movement, ...rest }): MovementResult => ({
								...rest,
								id: movement.id,
								movement_name: movement.name,
								isResult: false,
								completed: false,
								wod_score_id: false,
								time: rest.time ? rest.time.toString() : null,
								reps: String(rest.reps),
							}),
						);

						// WORKAROUND: As per backend, we need to merge res.data.results with results
						// TODO: Remove this when backend is fixed
						movementResults.forEach((user_movement, index) => {
							const found = res.data.user_movement?.find(
								({ movement_id }) =>
									movement_id === user_movement.id,
							);
							if (found) {
								movementResults[index] = {
									...user_movement,
									...found,
									isResult: true,
								} as MovementResult;
							}
						});

						// custom results for movement
						setResults({
							section_scores: [],
							user_movement:
								movementResults as unknown as PastPerformanceResultSchemaType[],
						});
					} else {
						setResults(
							res.data as GetPastPerformanceResultSchemaType,
						);
					}
				} else {
					throw new Error('Something went wrong!');
				}
			})
			.catch(e => {
				Say.err(e as ICatchError);
				navigation.goBack();
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	useEffect(() => {
		fetchDetails();
	}, []);

	const submitCallback = () => {
		fetchDetails();
		keyboard.dismiss();
	};

	return (
		<View style={layout.flex_1}>
			<DateTimePicker
				mode="date"
				isVisible={showDatePicker}
				onConfirm={setDatePickerVal}
				onCancel={() => setShowDatePicker(false)}
				maximumDate={moment().toDate()}
				date={moment(dateInput).toDate()}
				// eslint-disable-next-line react-native/no-inline-styles
				pickerContainerStyleIOS={{
					paddingLeft: iosVersion >= 14 ? 18 : 0, // IOS 14 workaround
				}}
			/>

			<Row
				spacing="space-between"
				align="center"
				style={styles.headerContainer}
			>
				<View style={layout.flex_1}>
					<Text size="md" bold>
						{data.name}
					</Text>
				</View>

				<View style={layout.flex_1}>
					<Row
						onPress={() => setShowDatePicker(true)}
						align="center"
						spacing="flex-end"
					>
						<Spacer size="sm" horizontal />
						<Text size="md" color="info">
							{!moment(dateInput).isSame(moment(), 'day')
								? moment(dateInput).format('MMMM DD, YYYY')
								: 'Today'}
						</Text>
						<Spacer size="sm" horizontal />
						<Icon
							name="calendar"
							size={config.fonts.metrics.md}
							color={config.fonts.colors.info}
						/>
					</Row>
				</View>
			</Row>

			<ScoreComponent
				onSubmitCallback={submitCallback}
				section={data.section_wod}
				independentScoring
				editMode={false}
				wod_id={data.id}
				date={dateInput}
			/>

			{!isKeyboardVisible && (
				<WorkoutHistoryBS
					sheetRef={sheetRef}
					sheetIndex={sheetIndex}
					results={results}
					setSheetIndex={setSheetIndex}
					bottomOffset={bottomSheetSpacing}
					title={data.name || ''}
					scoringBy={data.section_wod.scoring_by || ''}
					isLoading={isLoading}
				/>
			)}
		</View>
	);
};

export default WorkoutHistory;

const styles = StyleSheet.create({
	headerContainer: {
		paddingHorizontal: config.metrics.md,
		paddingVertical: config.metrics.md,
		borderBottomWidth: 0.5,
		borderColor: '#eee',
	},
});
