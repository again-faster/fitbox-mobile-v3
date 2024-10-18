/**
 * TODO: This component is too big and needs to be refactored
 */

import {
	Button,
	Card,
	Row,
	ScrollView,
	Spacer,
	Text,
} from '@/components/atoms';
import useKeyboardVisibility from '@/hooks/useKeyboardVisibility';
import { goBack } from '@/navigators/NavigationRef';
import {
	addScoreMovement,
	deleteScore,
	getScoringTypes,
	updateScore,
} from '@/services/leaderboards';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { IScoringType, PrResultSchemaType } from '@/types/schemas/leaderboards';
import { PrResultDataType } from '@/types/schemas/response';
import { Constant, Say } from '@/utils';
import useStore from '@/zustand/Store';
import { parseInt } from 'lodash';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';
import {
	Keyboard,
	Modal,
	Platform,
	StyleProp,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Vibration,
	View,
	ViewStyle,
} from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';
import SimpleToast from 'react-native-simple-toast';
import FeatherIcon from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/FontAwesome5';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import RowItem from '../RowItem/RowItem';
import ScoreComment from '../ScoreComponent/components/ScoreComment';

const iosVersion = parseInt(Platform.Version as string, 10);

type IDataValue = boolean | number | string;

type IFields = { [key: string]: IDataValue };

type IFieldData = {
	key: string;
	name: string;
	with_unit?: string;
	type: 'number' | 'checkbox' | 'text' | 'none';
	recordable: boolean;
	max_num?: number;
};

interface ScoreMovementComponentProps {
	editMode?: boolean;
	editData?: IFields;
	movementId: number;
	movementName: string;
	containerStyle?: StyleProp<ViewStyle>;
	onSuccess?: () => void;
}

const ScoreMovementComponent = ({
	editMode = false,
	editData = {},
	movementId,
	movementName,
	containerStyle,
	onSuccess,
}: ScoreMovementComponentProps) => {
	const { isKeyboardVisible } = useKeyboardVisibility();
	const { setAppState } = useStore(state => ({
		setAppState: state.setAppState,
	}));

	const inputRefs = useRef<{ [key: string]: TextInput | null }>({});

	const [isLoading, setIsLoading] = useState(true);
	const [searchModal, setSearchModal] = useState(false);
	const [datePicker, setDatePicker] = useState(false);
	const [commentField, setCommentField] = useState<string | null>(null);
	const [notes, setNotes] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [scoringTypes, setScoringTypes] = useState<IScoringType[]>([]);
	const [selectedScoringType, setSelectedScoringType] = useState<number>(0);
	const [dateInput, setDateInput] = useState(moment().format('YYYY-MM-DD'));
	const [fields, setFields] = useState<IFields>({});

	const toggleSearchModal = () => setSearchModal(visible => !visible);

	const toggleDatePicker = () => setDatePicker(visible => !visible);

	const getScoringTypeInfo = (id: number): IScoringType | undefined =>
		scoringTypes.find(type => type?.id === id);

	const setDatePickerVal = (date: moment.MomentInput) => {
		setDateInput(moment(date).format('YYYY-MM-DD'));
		setDatePicker(visible => !visible);
	};

	const getFields = (type: number) => {
		const sTypeInfo = getScoringTypeInfo(type);
		if (!sTypeInfo) return [];

		// Scoring Type ID reference: https://againfaster-my.sharepoint.com/:x:/g/personal/karl_fitboxcorp_com/EY71H-6Gig1BvsZ2NjcydJgB6WNzpTPUdiSY0_zpMsKuAg?e=TFCCEl

		// Structure:
		// [key]                        - column_name (fb_movement_users)
		// [name]                       - Text displayed
		// [recordable]                    - recordable/passed to payload
		// [type]                       - number | checkbox | text | none (no input)
		// [with_unit] (optional)       - add unit to label and additional unit column
		// [max_num] (optional)         - max length of input

		const { unit_type: uType, id, method } = sTypeInfo;

		const returnFields: IFieldData[] = [];

		switch (uType) {
			case 'distance':
				returnFields.push({
					key: 'distance',
					name: 'Distance',
					with_unit: 'm',
					type: 'number',
					recordable: true,
				});
				break;
			case 'reps':
				// ID:8 AMRAP - As Many Rounds As Possible (Static) - Change to Rounds
				if (id === 34) {
					returnFields.push({
						key: 'calories',
						name: 'Calories',
						type: 'number',
						recordable: true,
					});
				} else {
					returnFields.push({
						key: 'reps',
						name: id === 8 ? 'Rounds' : 'Reps',
						type: 'number',
						recordable: true,
					});
				}
				break;
			case 'yesno':
				returnFields.push({
					key: 'completed',
					name: 'Completed',
					type: 'checkbox',
					recordable: true,
				});
				break;
			case 'time':
				if (method !== 'sum') {
					returnFields.push(
						{
							key: 'mins',
							name: 'Mins',
							type: 'number',
							max_num: 3,
							recordable: true,
						},
						{
							key: 'seconds',
							name: 'Seconds',
							type: 'number',
							max_num: 3,
							recordable: true,
						},
					);
				}
				break;
			case 'load':
				returnFields.push(
					{
						key: 'rounds',
						name: 'Rounds',
						type: 'number',
						recordable: true,
					},
					{ key: '', name: 'x', type: 'none', recordable: false },
					{
						key: 'reps',
						name: 'Reps',
						type: 'number',
						recordable: true,
					},
					{ key: '', name: '', type: 'none', recordable: false },
					{
						key: 'weight',
						name: 'Weight',
						with_unit: 'kg',
						type: 'number',
						recordable: true,
					},
				);
				break;
			case 'cal':
				returnFields.push({
					key: 'calories',
					name: 'Calories',
					type: 'number',
					recordable: true,
				});
				break;

			default:
				break;
		}

		return returnFields;
	};

	const setScoringTypeFields = (typeId?: number) => {
		const finalFields: IFields = {};

		if (typeId) {
			getFields(typeId)
				.filter(f => f.recordable)
				.forEach(f => {
					if (f.type === 'checkbox') {
						finalFields[f.key] = editMode
							? !!editData[f.key]
							: false;
					} else {
						finalFields[f.key] = editMode
							? `${editData[f.key]}`
							: '';
					}

					if (f.with_unit) {
						finalFields[`${f.key}_unit`] = (
							editMode ? editData[`${f.key}_unit`] : f.with_unit
						) as string;
					}
				});

			setSelectedScoringType(typeId);
			setFields(finalFields);
			setSearchModal(false);
		}
	};

	const fetchScoringTypes = () =>
		getScoringTypes()
			.then(res => {
				if (res.error) Say.err(res.message);
				else {
					setScoringTypes(res.data);
				}

				if (editMode) {
					setSelectedScoringType(editData.scoring_type_id as number);
					setNotes(editData.notes as string);
					setScoringTypeFields(editData.scoring_type_id as number);
				}
			})
			.catch(() => {
				// console.log('fetchScoringTypes error', e);

				SimpleToast.show(
					'Something went wrong fetching scoring types',
					SimpleToast.LONG,
				);
			})
			.finally(() => {
				setIsLoading(false);
			});

	useEffect(() => {
		void fetchScoringTypes();
	}, []);

	const clearFields = () => {
		const inputFields = getFields(selectedScoringType);

		inputFields.forEach(field => {
			if (field.recordable && field.type !== 'checkbox') {
				inputRefs.current[field.key]?.clear();
			}
		});

		setNotes('');
	};

	const onDelete = () => {
		setIsLoading(true);

		deleteScore(editData.id as number)
			.then(res => {
				if (res.error) {
					Say.warn(res.message);
				} else {
					Say.ok(res.message);
					goBack();
				}
			})
			.catch(() => {
				Say.warn('Something went wrong');
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	// TODO: Move to utils to be used in other components
	// Other implementations: ScoreComponent
	const checkIfScoreIsPR = (results: PrResultDataType) => {
		if (!results) return false;

		let userPR: PrResultSchemaType;
		let prResults = results;
		if (Array.isArray(prResults) && prResults.length > 0) {
			// remove null values
			prResults = prResults.filter(result => result);

			// check if result has attribute isPR
			userPR = prResults.find(
				result => result.isPR,
			) as PrResultSchemaType;
		} else {
			userPR = prResults as PrResultSchemaType;
		}

		if (userPR.isPR) {
			// remove keyboard
			Keyboard.dismiss();

			// Show confetti
			setAppState('showConfetti', true);

			if (Number(userPR.resultCount) > 1) {
				// Show confetti and toast

				// Perform vibrate
				Vibration?.vibrate();

				// add delay to show toast for better UX
				setTimeout(() => {
					SimpleToast.showWithGravity(
						'Congratulations on your new PR!',
						SimpleToast.LONG,
						SimpleToast.CENTER,
					);
				}, 4000);
			} else {
				setTimeout(() => {
					SimpleToast.showWithGravity(
						'Congratulations on your first PR!',
						SimpleToast.LONG,
						SimpleToast.CENTER,
					);
				}, 4000);
			}

			return true;
		}

		// if (userPR?.prMessage) {
		// 	console.log(userPR?.prMessage);
		// }

		return false;
	};

	const onSubmit = () => {
		const hasEmptyFields = Object.values(fields).some(
			value => value === '',
		);

		if (hasEmptyFields) {
			Say.err('Please input the missing fields');
			return;
		}

		if (fields.mins) {
			// IF unit type == time
			if (parseInt(fields.seconds as string, 10) > 60) {
				Say.err('Invalid time format');
				return;
			}

			fields.time_unit = 'mins';
			fields.time = `${`0${fields.mins}`.slice(
				-2,
			)}.${`0${fields.seconds}`.slice(-2)}`;

			delete fields.mins;
			delete fields.seconds;
		}

		setIsLoading(true);

		const payload = {
			movement_id: movementId,
			scoring_type_id: selectedScoringType,
			date_input: dateInput,
			notes,
			...fields,
		};

		// Close keyboard
		Keyboard.dismiss();

		if (editMode) {
			updateScore(editData.id as number, payload)
				.then(res => {
					if (res.error) Say.warn(res.message);

					clearFields();

					onSuccess?.();
				})
				.catch(() => {
					Say.warn('Something went wrong updating movement score');
				})
				.finally(() => {
					setIsLoading(false);
				});
		} else {
			addScoreMovement(payload)
				.then(res => {
					if (res.error) Say.warn(res.message);
					// Check if score is PR
					const hasPr = checkIfScoreIsPR(res.prResult);
					if (!hasPr) SimpleToast.show(res.message, SimpleToast.LONG);

					clearFields();

					onSuccess?.();
				})
				.catch(() => {
					Say.warn('Something went wrong adding movement score');
				})
				.finally(() => {
					setIsLoading(false);
				});
		}

		// TODO: Investigate this redirect
		// navigate('PastPerformance');
	};

	const onFieldChange = (key: string, value: IDataValue) => {
		setFields(f => ({ ...f, [key]: value }));
	};

	const renderFields = (typeInfo: IScoringType) => {
		if (editMode) {
			Object.entries(fields).forEach(([k]) => {
				if (k === 'mins' || k === 'seconds') {
					const time = (fields.time as string).split('.');

					fields.mins = time[0] || '0';
					fields.seconds = time[1] || '0';

					delete fields.time;
				}
			});
		}

		const unitFields = getFields(
			(editMode ? editData.scoring_type_id : typeInfo?.id) as number,
		);

		return (
			<Row spacing="space-between" style={styles.field}>
				{unitFields.map((field, i) => (
					<View key={i} style={[layout.flex_1, layout.itemsCenter]}>
						<Text
							size="md"
							color="darkgray"
							style={{ marginBottom: config.metrics.md }}
						>
							{field.name}
						</Text>
						{field.type === 'checkbox' ? (
							<TouchableOpacity
								style={styles.inputCheckboxStyle}
								onPress={() =>
									onFieldChange(field.key, !fields[field.key])
								}
							>
								{fields[field.key] === true && (
									<Icon
										name="check"
										size={25}
										color={config.fonts.colors.info}
									/>
								)}
							</TouchableOpacity>
						) : (
							field.type !== 'none' && (
								<TextInput
									ref={r => {
										inputRefs.current[field.key] = r;
									}}
									style={styles.inputStyle}
									keyboardType={
										field.type === 'number'
											? 'numeric'
											: 'default'
									}
									onChangeText={value =>
										onFieldChange(field.key, value)
									}
									maxLength={
										field.max_num ? field.max_num : 5
									}
									placeholder={
										field.with_unit && field.with_unit
									}
									{...(fields[field.key] && {
										defaultValue: `${fields[field.key]}`,
									})}
									allowFontScaling={false}
								/>
							)
						)}
					</View>
				))}
			</Row>
		);
	};

	const renderFieldsContainer = () => {
		if (!selectedScoringType && !editMode) {
			return (
				<Text size="md" color="mute" center>
					Please select a type first..
				</Text>
			);
		}

		if (getFields(selectedScoringType).length) {
			return (
				<ScrollView
					keyboardShouldPersistTaps="handled"
					style={styles.fieldsContaner}
				>
					{scoringTypeInfo ? renderFields(scoringTypeInfo) : null}

					<TouchableOpacity
						onPress={() => setCommentField('movement')}
						style={styles.commentDisplay}
					>
						<Text color={notes ? 'darkgray' : 'mute'} center>
							{notes ? `${notes} ` : 'Add Comments'}
							{notes ? (
								<MIcon
									name="pencil"
									size={15}
									style={styles.commentInputIcon}
									color={notes ? 'darkgray' : 'mute'}
								/>
							) : null}
						</Text>
					</TouchableOpacity>

					<ScoreComment
						commentField={commentField}
						commentValue={notes}
						onCommentChange={val => setNotes(val)}
						onClose={() => setCommentField(null)}
						onSave={() => setCommentField(null)}
					/>

					<Spacer size="lg" />

					{editMode && (
						<TouchableOpacity
							style={{ marginBottom: config.metrics.md }}
							onPress={onDelete}
						>
							<Text size="rg" color="darkgray">
								Remove this Performance Log
							</Text>
						</TouchableOpacity>
					)}
				</ScrollView>
			);
		}

		return (
			<Text
				size="lg"
				color="mute"
				center
				style={{ marginTop: config.metrics.xl }}
			>
				Coming soon
			</Text>
		);
	};

	const renderScoringTypes = () => {
		const results = scoringTypes.filter(type =>
			type?.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);

		return !results.length ? ( // If no query/results found
			<Text size="md" color="mute">
				No results found
			</Text>
		) : (
			results.map((type, index) => (
				<RowItem
					key={index}
					title={type?.name || ''}
					rightIcon="plus"
					onPress={() => setScoringTypeFields(type?.id)}
				/>
			))
		);
	};

	const scoringTypeInfo = getScoringTypeInfo(selectedScoringType);
	return (
		<View style={[layout.flex_1, containerStyle]}>
			<DateTimePicker
				mode="date"
				isVisible={datePicker}
				onConfirm={setDatePickerVal}
				onCancel={toggleDatePicker}
				maximumDate={moment().toDate()}
				date={moment(dateInput).toDate()}
				// eslint-disable-next-line react-native/no-inline-styles
				pickerContainerStyleIOS={{
					paddingLeft: iosVersion >= 14 ? 18 : 0, // IOS 14 workaround
				}}
			/>

			{/*
				TODO: Create a component for this and use this on:
				- https://github.com/again-faster/fitbox-mobile-v2/blob/dev/src/screens/PerformanceSummary/MovementHistory/index.tsx#L82
				- https://github.com/again-faster/fitbox-mobile-v2/blob/1ef385f513a4de0e5ac3ea70fd36c258511fcf5d/src/screens/PerformanceSummary/WorkoutHistory/index.tsx#L147
			*/}
			{!editMode && (
				<Row
					spacing="space-between"
					align="center"
					style={styles.headerContainer}
				>
					<View style={layout.flex_1}>
						<Text size="md" bold>
							{movementName}
						</Text>
					</View>

					<View style={layout.flex_1}>
						<Row
							onPress={toggleDatePicker}
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
			)}

			{!isKeyboardVisible && (
				<View style={styles.searchHeaderStyle}>
					<TouchableOpacity
						style={styles.searchContainerStyle}
						onPress={() => (!editMode ? toggleSearchModal() : {})}
					>
						<Text style={layout.flex_1} color="darkgray">
							{selectedScoringType != null
								? scoringTypeInfo?.name
								: 'Select Type..'}
						</Text>
						<Icon
							name="search"
							color={config.fonts.colors.darkgray}
							size={18}
							style={{ marginLeft: config.metrics.sm }}
						/>
					</TouchableOpacity>
				</View>
			)}

			{renderFieldsContainer()}

			{selectedScoringType ? (
				<Button
					loading={isLoading}
					title={editMode ? 'Save' : 'Add Result'}
					variant="info"
					onPress={onSubmit}
					style={styles.submitButton}
				/>
			) : null}

			<Modal animationType="fade" transparent visible={searchModal}>
				<View style={styles.modalContainer}>
					<TouchableWithoutFeedback onPress={toggleSearchModal}>
						<View style={[layout.flex_1, layout.fullWidth]} />
					</TouchableWithoutFeedback>

					<Card style={styles.modalStyle}>
						<View style={[styles.searchContainerStyle]}>
							<FeatherIcon
								name="arrow-left"
								color={config.fonts.colors.darkgray}
								size={18}
								onPress={toggleSearchModal}
							/>
							<TextInput
								style={styles.searchInput}
								placeholder="Start typing.."
								onChangeText={sq => setSearchQuery(sq)}
								value={searchQuery}
								allowFontScaling={false}
							/>
							{searchQuery !== '' && (
								<Icon
									name="times"
									color={config.fonts.colors.darkgray}
									size={18}
									style={{ marginRight: config.metrics.md }}
									onPress={() => setSearchQuery('')}
								/>
							)}
							<Icon
								name="search"
								color={config.fonts.colors.darkgray}
								size={18}
							/>
						</View>
						<ScrollView
							style={{ marginVertical: config.metrics.sm }}
						>
							<View style={styles.scoringTypesContainer}>
								{renderScoringTypes()}
							</View>
						</ScrollView>
					</Card>
				</View>
			</Modal>
		</View>
	);
};

export default ScoreMovementComponent;

const styles = StyleSheet.create({
	headerContainer: {
		paddingHorizontal: config.metrics.md,
		paddingVertical: config.metrics.md,
		borderBottomWidth: 0.5,
		borderColor: '#eee',
	},
	field: {
		marginVertical: 25,
	},
	fieldsContaner: {
		flex: 1,
		padding: 23,
	},
	searchHeaderStyle: {
		alignItems: 'center',
		padding: 20,
		borderColor: '#eee',
	},
	searchContainerStyle: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 15,
		borderRadius: 4,
		height: 40,
		...layout.shadowMedium,
	},
	inputCheckboxStyle: {
		borderRadius: 6,
		borderWidth: 1,
		borderColor: config.fonts.colors.info,
		width: 40,
		height: 40,
		padding: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	inputStyle: {
		textAlign: 'center',
		paddingHorizontal: 10,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: config.fonts.colors.info,
		flex: 1,
		maxWidth: Constant.DEVICEWIDTH / 4,
		width: '100%',
		fontSize: config.fonts.metrics.h4,
		paddingVertical: 20,
		marginTop: 5,
		...layout.fontMontserratRegular,
	},
	modalContainer: {
		flex: 1,
		padding: 18,
		backgroundColor: 'rgba(0,0,0,.3)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalStyle: {
		width: '100%',
		padding: 0,
		position: 'absolute',
		top: '13%',
		maxHeight: Constant.DEVICEHEIGHT / 1.5,
		...layout.shadowHeavy,
	},
	searchInput: {
		backgroundColor: 'white',
		flex: 1,
		borderColor: '#F2F2F2',
		padding: 0,
		marginHorizontal: 15,
	},
	scoringTypesContainer: {
		padding: 20,
	},
	commentDisplay: {
		alignSelf: 'center',
		maxWidth: '70%',
		justifyContent: 'center',
		position: 'relative',
	},
	commentInputIcon: {
		marginLeft: 15,
	},
	submitButton: {
		borderRadius: 0,
		margin: config.metrics.lg,
	},
});
