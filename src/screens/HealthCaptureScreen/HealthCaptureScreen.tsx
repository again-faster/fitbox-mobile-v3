import useAuth from '@/auth/hooks/useAuth';
import { Button, Row, Spacer, Text } from '@/components/atoms';
import { getUserHealthInfo, saveHealthInfo } from '@/services/users';
import getUserGymInfo from '@/services/users/getUserGymInfo';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import {
	ApplicationScreenProps,
	HealthCaptureParams,
	MenuStackNavigatorProps,
} from '@/types/navigation';
import { GymInfoType } from '@/types/schemas/gym';
import { UserHealthInfoType, UserSchemaType } from '@/types/schemas/user';
import { Constant, Say } from '@/utils';
import Icon from 'react-native-vector-icons/FontAwesome5';

import { navigate } from '@/navigators/NavigationRef';
import { CommonActions } from '@react-navigation/native';
import moment from 'moment';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { DataTable } from 'react-native-paper';
import SimpleToast from 'react-native-simple-toast';
import { InputCell, OptionButton, TextCell } from './components';

type TableColumns = {
	slug: string;
	title: string;
	type: string;
	required: boolean;
	value?: string | boolean | null;
	selectItems?: SelectItems[];
	placeholder?: string;
};

type SelectItems = {
	label: string;
	value: string;
};

type QuestionType = {
	qid: string;
	question: string;
	value: boolean | null;
	tableColumns: TableColumns[];
	data: TableColumns[][];
	afterQuestionText: string;
	singleData: boolean;
};

type StateProps = {
	gymInfo: GymInfoType | null;
	loading: boolean;
	submitting: boolean;
	questions: QuestionType[];
	focusedRow: number | null;
	focusedInput: { qIndex: number; colIndex: number; rowIndex: number } | null;
};

type DataObject = {
	[key: string]: string | number | boolean;
};

const HealthCaptureScreen = ({
	navigation,
	route,
}: MenuStackNavigatorProps | ApplicationScreenProps) => {
	const { user, updateUser } = useAuth();

	const [state, setState] = useState<StateProps>({
		gymInfo: null,
		loading: true,
		submitting: true,
		questions: Constant.QUESTIONS_LIST.map(
			question =>
				({
					...question,
					data: [],
					value: null,
				} as QuestionType),
		),
		focusedRow: null,
		focusedInput: null,
	});

	useEffect(() => {
		void (async () => {
			await setGymInfo();
			await setUserInfo();
		})();
	}, []);

	const setGymInfo = async () => {
		try {
			const res = await getUserGymInfo();
			setState(prevState => ({
				...prevState,
				gymInfo: res.gym_info,
				loading: false,
				submitting: false,
			}));
		} catch (e) {
			Say.err('Something went wrong');
			navigation.pop();
		}
	};

	const setUserInfo = async () => {
		try {
			const res = await getUserHealthInfo();
			parseHealthDetails(res);
		} catch (e) {
			SimpleToast.show('Error on fetching health info', SimpleToast.LONG);
		}
	};

	const getQuestionID = (id: string) => {
		let questionID = id;

		switch (id) {
			case 'existingMedConditions':
				questionID = 'pre_existing';
				break;

			case 'medications':
				questionID = 'prescription';
				break;
			default:
				questionID = id;
		}

		return questionID;
	};

	const parseHealthDetails = (healthInfo: UserHealthInfoType) => {
		const questionsState = state.questions;

		if (user?.user_data.is_health_captured) {
			questionsState.forEach((item, index) => {
				const question: QuestionType = questionsState[
					index
				] as QuestionType;
				question.value = false;

				const questionData =
					healthInfo[
						getQuestionID(item.qid) as keyof UserHealthInfoType
					];

				questionData.forEach((data: DataObject, dataIndex: number) => {
					question.value = true;
					if (!question.data[dataIndex]) {
						question.data[dataIndex] = [];
					}

					Object.keys(data).forEach(slug => {
						const columnDetails = item.tableColumns.find(
							col => col.slug === slug,
						);

						(question.data[dataIndex] as TableColumns[]).push({
							type: columnDetails?.type,
							slug: columnDetails?.slug,
							required: columnDetails?.required,
							value: data[slug],
						} as TableColumns);
					});
				});

				setState(prevState => ({
					...prevState,
					focusedRow:
						healthInfo[
							getQuestionID(item.qid) as keyof UserHealthInfoType
						].length,
				}));
			});
		}

		setState(prevState => ({ ...prevState, questions: questionsState }));
	};

	const handleSelectInput = (
		indexData: {
			qIndex: number;
			colIndex: number;
			rowIndex: number;
		} | null,
	) => {
		setState({ ...state, focusedInput: indexData });
	};

	const handleChange = (
		value: string | boolean | null,
		colIndex: number,
		qIndex: number,
		rowIndex: number,
	) => {
		const { questions } = state;
		const { data } = questions[qIndex] as QuestionType;
		((data[rowIndex] as TableColumns[])[colIndex] as TableColumns).value =
			value;
		(questions[qIndex] as QuestionType).data = data;

		setState(prevState => ({ ...prevState, questions }));
	};

	const getDummyData = (col: TableColumns) => {
		switch (col.type) {
			case 'text':
				return '';
			case 'checkbox':
				return false;
			default:
				return null;
		}
	};

	const addDataRow = (questionIndex: number) => {
		const questionsState = state.questions;
		const question = questionsState[questionIndex];

		const data: TableColumns[] = [];

		question?.tableColumns.forEach((col: TableColumns) => {
			data.push({
				title: col.title,
				type: col.type,
				slug: col.slug,
				required: col.required,
				value: getDummyData(col),
			});
		});

		questionsState[questionIndex]?.data.push(data);

		setState(prevState => ({
			...prevState,
			questions: questionsState,
			focusedRow: questionsState[questionIndex]?.data.length as number,
		}));
	};

	const handleOptionButton = (value: boolean, index: number) => {
		const questionState = state.questions;
		(questionState[index] as QuestionType).value = value;

		if (
			value &&
			questionState[index]?.tableColumns.length &&
			questionState[index]?.data?.length === 0
		) {
			addDataRow(index);
		}

		if (!value) {
			(questionState[index] as QuestionType).data = [];
			setState(prevState => ({ ...prevState, questions: questionState }));
		}

		setState(prevState => ({ ...prevState, questions: questionState }));
	};

	const removeDataRow = (qIndex: number, rowIndex: number) => {
		const { questions } = state;
		const { data } = questions[qIndex] as QuestionType;

		data.splice(rowIndex, 1);

		(questions[qIndex] as QuestionType).data = data;

		if (data.length === 0) (questions[qIndex] as QuestionType).value = null;

		setState(prevState => ({
			...prevState,
			focusedRow: (questions[qIndex] as QuestionType).data.length,
		}));
	};

	const updateStorageSession = () => {
		const newUserInfo = user?.user_data as UserSchemaType;

		newUserInfo.last_login = true;
		newUserInfo.is_health_captured = true;

		updateUser(newUserInfo);

		if ((route.params as HealthCaptureParams)?.fromMenu) {
			navigate('Menu');
		} else {
			navigation.dispatch(
				CommonActions.reset({
					index: 0,
					routes: [{ name: 'Startup' }],
				}),
			);
		}
	};

	const goToMainMenu = () => {
		navigate('Menu');
	};

	const handleSelectRow = (focusedRow: number) => {
		setState(prevState => ({ ...prevState, focusedRow }));
	};

	const handleSubmit = async () => {
		setState(prevState => ({ ...prevState, submitting: true }));
		const { questions } = state;

		const payload: {
			[key: string]: { data: DataObject[]; value: boolean | string };
		} = {} as {
			[key: string]: { data: DataObject[]; value: boolean | string };
		};
		let error = false;

		questions.every(question => {
			if (question.value === null) {
				Say.err('Please answer all questions');
				error = true;
				return false;
			}

			const saveData: DataObject[] = [];
			question.data.forEach(thatData => {
				const params: DataObject = {};
				thatData.forEach(theData => {
					params[theData.slug] = theData.value as string | number;
				});
				saveData.push(params);
			});

			payload[question.qid] = {
				value: question.value,
				data: saveData,
			};

			return true;
		});

		if (!error) {
			const res = await saveHealthInfo(payload);

			if (!res.error) {
				updateStorageSession();
			} else {
				Say.err(res.message ? res.message : 'Something went wrong');
				setState(prevState => ({ ...prevState, submitting: false }));
			}
		}
	};

	const renderHeader = () => {
		return (
			<>
				<Text size="md" style={styles.headerStyle}>
					The following questions are designed to provide your coaches
					with information on your health that helps them to ensure
					your safety in the gym. If you do not answer the questions
					truthfully or choose not to provide all information{' '}
					{state.gymInfo?.name}, cannot be held liable for any injury
					or issues that occur and are associated with a pre-existing
					allergy, condition, medication or injury.{' '}
				</Text>
				<Spacer />
			</>
		);
	};

	const renderColumns = (item: QuestionType, qIndex: number) => {
		if (item.value && item.tableColumns) {
			if (item.singleData) {
				return (
					<>
						<Row style={styles.columnSingleDataRow}>
							{item.data.map((_a, index) => {
								const background =
									index + 1 === state.focusedRow
										? config.colors.brand
										: 'transparent';
								const borderColor =
									index + 1 === state.focusedRow
										? config.colors.brand
										: config.backgrounds.darkgray;
								const textColor =
									index + 1 === state.focusedRow
										? config.backgrounds.light
										: config.backgrounds.darkgray;
								return (
									<TouchableOpacity
										key={index}
										style={{
											backgroundColor: background,
											borderColor,
											...styles.dataNumberStyle,
										}}
										onPress={() =>
											handleSelectRow(index + 1)
										}
									>
										<Text
											size="md"
											style={{ color: textColor }}
										>
											{index + 1}
										</Text>
									</TouchableOpacity>
								);
							})}
							<TouchableOpacity
								style={{
									...styles.dataNumberStyle,
									borderColor: config.backgrounds.darkgray,
								}}
								onPress={() => addDataRow(qIndex)}
							>
								<Text size="md" color="darkgray">
									+
								</Text>
							</TouchableOpacity>
						</Row>
						{item.data.map(
							(data: TableColumns[], index: number) => {
								return (
									index + 1 === state.focusedRow && (
										<View
											style={layout.fullWidth}
											key={index}
										>
											{data.map(
												(
													colData: TableColumns,
													colIndex: number,
												) => {
													let focused = false;

													if (state.focusedInput) {
														const {
															colIndex: cIndex,
															qIndex: quesIndex,
															rowIndex: rIndex,
														} = state.focusedInput;

														focused =
															colIndex ===
																cIndex &&
															qIndex ===
																quesIndex &&
															index === rIndex;
													}

													return (
														<Row
															key={colIndex}
															style={[
																styles.rowSingle,
																styles.rowStyle,
															]}
														>
															<TextCell
																noborder
																key={colIndex}
																title={
																	item
																		.tableColumns[
																		colIndex
																	]?.title
																}
																centered={false}
																required={
																	item
																		.tableColumns[
																		colIndex
																	]?.required
																}
															/>
															<InputCell
																noborder
																focused={
																	focused
																}
																colIndex={
																	colIndex
																}
																qIndex={qIndex}
																rowIndex={index}
																value={
																	colData.value
																}
																handleChange={
																	handleChange
																}
																handleSelectInput={
																	handleSelectInput
																}
																type={
																	item
																		.tableColumns[
																		colIndex
																	]
																		?.type as string
																}
																selectItems={
																	item
																		.tableColumns[
																		colIndex
																	]
																		?.selectItems as SelectItems[]
																}
															/>
														</Row>
													);
												},
											)}

											<TouchableOpacity
												style={[
													styles.addMoreBtnStyle,
													styles.removeButton,
												]}
												onPress={() =>
													removeDataRow(qIndex, index)
												}
											>
												<Row>
													<Text
														size="md"
														color="light"
													>
														Remove
													</Text>
												</Row>
											</TouchableOpacity>
										</View>
									)
								);
							},
						)}
					</>
				);
			}
			return (
				<DataTable collapsable>
					<View
						style={{
							marginTop: config.metrics.xl,
							marginBottom: config.metrics.sm,
						}}
					>
						<Row style={styles.rowStyle}>
							{item.tableColumns.map((col, colIndex) => (
								<TextCell
									centered
									key={colIndex}
									title={col.title}
									required={col.required}
									noborder={false}
								/>
							))}
						</Row>
						{item.data.map((thatData, rowIndex) => {
							return (
								<Row key={rowIndex} style={styles.rowStyle}>
									{thatData.map((theData, colIndex) => {
										return (
											<InputCell
												key={colIndex}
												colIndex={colIndex}
												qIndex={qIndex}
												rowIndex={rowIndex}
												value={theData.value}
												handleChange={handleChange}
												type={
													item.tableColumns[colIndex]
														?.type as string
												}
												selectItems={
													item.tableColumns[colIndex]
														?.selectItems as SelectItems[]
												}
												handleSelectInput={
													handleSelectInput
												}
											/>
										);
									})}
									<TouchableOpacity
										style={styles.removeRowBtnStyle}
										onPress={() =>
											removeDataRow(qIndex, rowIndex)
										}
									>
										<Icon
											name="times"
											size={config.metrics.rg}
											color={config.backgrounds.light}
										/>
									</TouchableOpacity>
								</Row>
							);
						})}
					</View>
					<TouchableOpacity
						style={styles.addMoreBtnStyle}
						onPress={() => addDataRow(qIndex)}
					>
						<Row align="center">
							<Icon
								name="plus"
								size={config.metrics.rg}
								color={config.backgrounds.light}
							/>
							<Spacer horizontal size="xs" />
							<Text size="md" color="light">
								Add more
							</Text>
						</Row>
					</TouchableOpacity>
				</DataTable>
			);
		}
		return null;
	};

	const renderItem = ({
		item,
		index,
	}: {
		item: QuestionType;
		index: number;
	}) => {
		return (
			<View key={item.qid} style={styles.itemContainer}>
				<View style={styles.questionContainer}>
					<Text size="lg" style={styles.questionText}>
						{item.question}
					</Text>
					{item.afterQuestionText && (
						<Text size="md" color="dark">
							{item.afterQuestionText}
						</Text>
					)}
					<Spacer size="sm" />
					<Row>
						<OptionButton
							title="No"
							pressed={item.value === false}
							onPress={() => handleOptionButton(false, index)}
						/>
						<Spacer horizontal />
						<OptionButton
							title="Yes"
							pressed={item.value === true}
							onPress={() => handleOptionButton(true, index)}
						/>
					</Row>
				</View>
				{renderColumns(item, index)}
			</View>
		);
	};

	const checkType = () => {
		const { questions, focusedInput } = state;
		const data = questions[focusedInput?.qIndex as number];
		if (data) {
			const focusedData = data?.data[
				focusedInput?.rowIndex as number
			] as TableColumns[];
			const focusedType =
				focusedData[focusedInput?.colIndex as number]?.type;
			return focusedType;
		}
		return '';
	};

	return state.loading ? (
		<View style={styles.loader}>
			<ActivityIndicator color={config.colors.brand} size="large" />
		</View>
	) : (
		<View style={layout.flex_1}>
			<DateTimePicker
				mode="date"
				isVisible={checkType() === 'date'}
				onConfirm={val => {
					handleChange(
						moment(val).format('YYYY-DD-MM'),
						state.focusedInput?.colIndex as number,
						state.focusedInput?.qIndex as number,
						state.focusedInput?.rowIndex as number,
					);
					handleSelectInput(null);
				}}
				onCancel={() => handleSelectInput(null)}
				maximumDate={new Date()}
			/>
			<View style={styles.container}>
				<FlatList
					data={state.questions}
					renderItem={renderItem}
					ListHeaderComponent={renderHeader}
					showsVerticalScrollIndicator={false}
				/>
			</View>
			<View style={styles.submitGobackContainer}>
				<Button
					labelStyle={styles.submitLabelStyle}
					title={
						user?.user_data.is_health_captured ? 'Update' : 'Next'
					}
					onPress={() => void handleSubmit()}
					style={styles.submitButtonStyle}
					loading={state.submitting}
				/>
				{user?.user_data.is_health_captured ||
				(route.params as HealthCaptureParams)?.fromMenu ? (
					<Button
						labelStyle={{
							...styles.submitLabelStyle,
							color: config.backgrounds.darkgray,
						}}
						title="Go back"
						onPress={() => void goToMainMenu()}
						style={styles.goBackButtonStyle}
					/>
				) : null}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: config.metrics.xl,
		paddingTop: config.metrics.xl,
		paddingBottom: config.metrics.rg,
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
	},
	itemContainer: { marginBottom: 50, alignItems: 'center' },
	questionContainer: { alignItems: 'center' },
	headerStyle: {
		textAlign: 'justify',
	},
	questionText: {
		textAlign: 'center',
	},
	dataNumberStyle: {
		borderWidth: 1,
		height: 30,
		width: 30,
		marginHorizontal: 5,
		alignItems: 'center',
		justifyContent: 'center',
	},
	rowStyle: {
		borderBottomWidth: 0,
		paddingHorizontal: 0,
		flex: 1,
	},
	rowSingle: {
		borderWidth: 0,
		marginTop: 15,
	},
	addMoreBtnStyle: {
		backgroundColor: config.colors.brand,
		paddingVertical: 10,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 6,
		marginTop: 5,
	},
	removeButton: {
		width: '50%',
		alignSelf: 'center',
		backgroundColor: config.colors.danger,
	},
	removeRowBtnStyle: {
		top: 1,
		right: 1,
		position: 'absolute',
		backgroundColor: config.colors.danger,
		height: 18,
		width: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},
	submitLabelStyle: {
		fontSize: config.fonts.metrics.md,
		textTransform: 'capitalize',
	},
	submitButtonStyle: {
		minWidth: '40%',
		backgroundColor: config.colors.brand,
	},
	submitGobackContainer: {
		paddingHorizontal: config.metrics.xl,
		paddingVertical: config.metrics.rg,
		justifyContent: 'center',
		borderTopWidth: 1,
		borderColor: config.borders.colors.lightgrey,
	},
	goBackButtonStyle: {
		minWidth: '40%',
		backgroundColor: 'transparent',
		marginTop: 8,
		borderColor: config.borders.colors.darkgray,
		borderWidth: 1,
	},
	columnSingleDataRow: {
		marginTop: 40,
	},
});

export default HealthCaptureScreen;
