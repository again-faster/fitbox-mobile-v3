import { goBack } from '@/navigators/NavigationRef';
import { getScore } from '@/services/leaderboards';
import addScore, { AddScorePayload } from '@/services/leaderboards/addScore';
import addWodScore from '@/services/leaderboards/addWodScore';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import {
	PrResultSchemaType,
	ScoreResultType,
} from '@/types/schemas/leaderboards';
import { PrResultDataType } from '@/types/schemas/response';
import {
	SessionSectionSchemaType,
	SessionWODMovementDetailsSchemaType,
	WODSectionSchemaType,
} from '@/types/schemas/session';
import { Constant, Func, Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import useStore from '@/zustand/Store';
import { useFocusEffect } from '@react-navigation/native';
import { isArray, isNaN, parseInt } from 'lodash';
import {
	MutableRefObject,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import {
	DimensionValue,
	Keyboard,
	LayoutChangeEvent,
	NativeScrollEvent,
	NativeSyntheticEvent,
	Platform,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	Vibration,
	View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import SimpleToast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/Ionicons';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button, KeyboardSpacer, Row, Spacer, Text } from '../../atoms';
import ScoreComment from './components/ScoreComment';
import ScoreHeader from './components/ScoreHeader';
import ScoreInputField from './components/ScoreInputField';
import { ScoreInputFieldHandlers, SessionSectionState } from './types';

type IEditData = {
	edit_id: string;
	ref_id: number;
	value: string;
	comments: string;
};

type State = {
	isKeyboardVisible: boolean;
	deleting: boolean;
	commentField: string | number | null;
	commentValue: string | null;
	commentLeaderboardVisible: boolean;
	enableLeaderboardComment: boolean;
	hideOnLeaderboard: boolean;
};

interface ScoreComponentProps {
	sessionId?: number;
	section: SessionSectionSchemaType | WODSectionSchemaType;
	onSubmitCallback?: () => void;
	independentScoring?: boolean;
	editMode: boolean;
	editData?: IEditData;
	wod_id?: number | null;
	date?: string;
	fromCalendar?: boolean;
}

const ScoreComponent = ({
	sessionId,
	onSubmitCallback,
	editData,
	editMode = false,
	section: sectionProp,
	independentScoring = false,
	wod_id = null,
	date,
	fromCalendar = false,
}: ScoreComponentProps) => {
	const {
		allowComments,
		lastRxValue,
		setAppState,
		toLeaderboardsCallback,
		scoringBottomSheet,
	} = useStore(state => ({
		allowComments: state.allowComments,
		lastRxValue: state.lastRxValue,
		setAppState: state.setAppState,
		toLeaderboardsCallback: state.toLeaderboardsCallback,
		scoringBottomSheet: state.scoringBottomSheet,
	}));

	// create input ref
	const inputRefs: MutableRefObject<{
		[key: string]: HTMLInputElement | null;
	}> = { current: {} };

	const keyboardVisible = Func.useKeyboardStatus();

	const defaultLeaderboardVisible = allowComments ?? true;
	const enableLeaderboardComment = sectionProp?.is_leaderboard ?? false;
	const [section, setSection] = useState<SessionSectionState>(() => {
		// Old implementation
		// let section: any = editMode
		// 	? section
		// 	: navigation.getState().params.section;
		// 	this.props.navigation.state.params.section;

		const useSection: SessionSectionState = {
			...sectionProp,
			movements: {},
			loads: [],
			value: '',
			comments: '',
			comment_leaderboard_visible: !enableLeaderboardComment
				? false
				: defaultLeaderboardVisible,
			minutes: [],
			seconds: [],
			isRx: lastRxValue ?? true,
			wod_movements: sectionProp.wod_movements,
		};

		// set movements
		sectionProp.wod_movements?.forEach(movement => {
			useSection.movements[movement.id] = {
				id: movement.id,
				movement_id: movement.movement_id,
				loads: [],
				value: '',
				comments: '',
				comment_leaderboard_visible: !enableLeaderboardComment
					? false
					: defaultLeaderboardVisible,
				minutes: [],
				seconds: [],
				score_type: 'Rx',
				reps: '',
				scored: true,
			};
		});

		return useSection;
	});

	const [state, setState] = useState<State>({
		isKeyboardVisible: false,
		deleting: false,
		commentField: null,
		commentValue: null,
		commentLeaderboardVisible: defaultLeaderboardVisible,
		enableLeaderboardComment,
		hideOnLeaderboard: true,
	});
	const [isDeleting, setDeleting] = useState<boolean>(false);
	const [submitting, setSubmitting] = useState<boolean>(false);

	/**
	 * Scroll View Height and Content Height
	 * TODO: Refactor this to a different file
	 */
	const scrollViewRef = useRef<ScrollView>(null);
	const [scrollPosition, setScrollPosition] = useState(10);
	const [isScrollable, setIsScrollable] = useState(false);
	const [contentHeight, setContentHeight] = useState(0);
	const [layoutHeight, setLayoutHeight] = useState(0);

	const scoringFlexValue = scoringBottomSheet ? 0.59 : 1;

	// eslint-disable-next-line no-console
	console.log('@setDeleting', setDeleting);

	const hideRxSwitch =
		(section.scoring_by === 'movement' &&
			[17, 20].includes(Number(section.scoring_type_id))) ||
		independentScoring; // 17, 20 for load/aggregate

	const checkValueFormat = (value: string | number, unit_type?: string) => {
		let useValue = value;

		// if time unit type
		if (
			typeof value === 'string' &&
			unit_type === 'time' &&
			value.indexOf(':') !== -1
		) {
			const timeParts = value.split(':');

			// Ensure hours and minutes are two digits
			if (timeParts.length === 2) {
				const hours = timeParts[0]!.padStart(2, '0');
				const minutes = timeParts[1]!.padStart(2, '0');
				useValue = `${hours}:${minutes}`;
			}
		}

		return useValue;
	};

	const getDummyValue = () => {
		if (section.scoring_type?.unit_type === 'time') {
			return '00:00';
		}
		return '0';
	};

	const checkIfScoreIsPR = (results: PrResultDataType) => {
		if (!results) return false;

		let userPR: PrResultSchemaType;
		let prResults = results;
		if (Array.isArray(prResults) && prResults.length > 0) {
			// remove null values
			prResults = prResults.filter(result => result);

			// check if result has attribute isPR
			userPR = prResults.find(
				result => result?.isPR,
			) as PrResultSchemaType;
		} else {
			userPR = prResults as PrResultSchemaType;
		}

		if (userPR?.isPR) {
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
					void Say.okThen(
						// eslint-disable-next-line quotes
						"You've just scored a personal best!",
						'Congratulations!',
					).then(() => setAppState('showConfetti', false));
				}, 4000);
			} else {
				setTimeout(() => {
					void Say.okThen(
						// eslint-disable-next-line quotes
						"You've just scored your first result!",
						'Congratulations!',
					).then(() => setAppState('showConfetti', false));
				}, 4000);
			}

			return true;
		}

		// if (userPR?.prMessage) {
		// 	console.log(userPR?.prMessage);
		// }

		return false;
	};

	const submitScore = async () => {
		const randomPRAnimation = Func.getRandomAnimation();
		setAppState('randomAnimation', randomPRAnimation);
		const saveMovements: { [x: string]: string | number }[] = [];

		if (section.scoring_by === 'movement') {
			Object.values(section.movements).forEach(mov => {
				const wodMovement = section.wod_movements?.find(
					movement => movement.id === mov.id,
				);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				let newMovement: { [key: string]: any } = { ...mov };

				// When movement reps is not set, use section reps
				// if reps set in wodmovement use that
				if (mov.id && wodMovement?.reps) {
					newMovement.reps = wodMovement.reps;
				}
				if (mov.id && section.reps && !wodMovement?.reps) {
					newMovement.reps = section.reps;
				}

				if (independentScoring) {
					const {
						// eslint-disable-next-line @typescript-eslint/naming-convention
						score_type,
						id,
						loads,
						minutes,
						seconds,
						...movement
					} = newMovement;

					newMovement = {
						movement,
						wod_movement_id: mov.id,
					};
				}

				// NOTE: This was asked to be removed
				// if (newMovement.value === '' && newMovement.scored) {
				// 	newMovement.value = '0';
				// 	saveMovements.push(newMovement);
				// } else

				if (newMovement.value !== '') {
					saveMovements.push(newMovement);
				}

				if (newMovement.comments === '') {
					newMovement.comment_leaderboard_visible = false;
				}
			});
		}

		let payload: AddScorePayload = {};

		if (independentScoring) {
			// independent scoring
			if (editMode) {
				// update score
				if (section.scoring_by === 'movement') {
					payload = {
						section_id: section.id,
						value: saveMovements[0]?.value ?? 0,
						reps: Number(saveMovements[0]?.reps) ?? 0,
						comments: saveMovements[0]?.comments ?? '',
					};
				} else if (section.scoring_by === 'section') {
					payload = {
						section_id: section.id,
						value: checkValueFormat(
							section.value,
							section.scoring_type?.unit_type,
						),
						reps: section.reps,
						comments: section.comments,
					};
				}
			} else {
				// add new score
				payload = {
					wod_id: wod_id as number,
					section_id: section.id,
					value:
						section.scoring_by !== 'movement'
							? checkValueFormat(
									section.value,
									section.scoring_type?.unit_type,
								)
							: getDummyValue(),
					reps: section.reps,
					comments: section.comments,
					movements: saveMovements,
				};

				// only add date if it is provided
				if (date) {
					payload.created_at = date;
				}
			}
		} else {
			payload.session_id = sessionId;

			const sectionPayload = {
				score_type:
					section.isRx && section.scoring_by === 'section'
						? 'Rx'
						: 'Scaled',
				scored: section.scored ? 1 : 0,
				scoring_by: section.scoring_by,
				id: section.id,
				leaderboard_section_id: section.leaderboard_section_id,
				value:
					section.scoring_by !== 'movement'
						? checkValueFormat(
								section.value,
								section.scoring_type?.unit_type,
							)
						: getDummyValue(),
				reps: section.reps,
				comments: section.comments,
				comment_leaderboard_visible: false,
				movements: saveMovements,
				leaderboard_visible: state.hideOnLeaderboard,
			};

			if (section.comments !== '') {
				sectionPayload.comment_leaderboard_visible =
					section?.comment_leaderboard_visible;
			}

			payload.sections = [sectionPayload];
		}

		if (section.scoring_by === 'movement') {
			if (saveMovements.length === 0) {
				Say.err('Please input the missing fields');
				setSubmitting(false);
				return;
			}
		} else if (section.value === '' || section.value === null) {
			Say.err('Please input the missing fields');
			setSubmitting(false);
			return;
		}

		try {
			setSubmitting(true);
			let res = null;

			if (independentScoring) {
				if (editMode) {
					// TODO: update wod score
					// res = await RestService.updateWodScore(
					// 	this.props.editData.edit_id,
					// 	payload,
					// );
				} else {
					res = await addWodScore(payload).catch(() => {
						throw new Error(
							'Something went wrong submitting score',
						);
					});
				}
			} else {
				res = await addScore(payload).catch(() => {
					throw new Error('Something went wrong submitting score');
				});
			}

			setSubmitting(false);

			if (res?.error) throw new Error(res.message);
			// check if has pr
			const hasPr = checkIfScoreIsPR(
				res?.prResults ?? res?.prResult ?? res?.data?.prResult,
			);

			// show toast if no pr
			if (!hasPr) SimpleToast.show('Score Submitted!', SimpleToast.SHORT);

			fetchScores();

			// Check if there is a callback function
			if (onSubmitCallback) {
				onSubmitCallback();
			} else {
				goBack();
			}

			if (enableLeaderboardComment && state.hideOnLeaderboard) {
				toLeaderboardsCallback();
				goBack();
			} else {
				goBack();
			}
		} catch (error) {
			Say.err(error as ICatchError);
		} finally {
			setSubmitting(false);
		}
	};

	const rxChanged = (val: boolean) => {
		setSection(prevState => ({
			...prevState,
			isRx: val,
		}));

		// set global state
		setAppState('lastRxValue', val);
	};

	const addToRefs = (
		el: TextInput | HTMLInputElement | null,
		name: number | string | null = null,
	) => {
		if (name !== null && !inputRefs.current[name]) {
			// Type assertion
			inputRefs.current[name] = el as HTMLInputElement;
		}
	};

	const focusToRef = (field: string | number) => {
		inputRefs.current[field]?.focus();
	};

	const parseExistingScore = (record: ScoreResultType) => {
		const newSection = { ...section };
		const movementId = record.wod_movement_id ?? null;
		// check if the sectionids match otherwise skip
		if (record.wod_section_id !== section.id) {
			return;
		}

		if (movementId && newSection.movements[movementId]) {
			if (record.reps) {
				newSection.movements[movementId]!.reps = String(record.reps);
			}

			newSection.movements[movementId]!.scored = true;
			newSection.movements[movementId]!.value = record.value;
			newSection.movements[movementId]!.comments = record.comments;
			newSection.movements[movementId]!.comment_leaderboard_visible =
				record?.comment_leaderboard_visible;
		} else {
			newSection.scored = true;
			newSection.value = record.value;
			newSection.comments = record.comments;
			newSection.comment_leaderboard_visible =
				record?.comment_leaderboard_visible;

			if (section.scoring_type!.method !== 'sum') {
				newSection.reps = String(record.reps);
			}
		}

		setState(s => ({
			...s,
			hideOnLeaderboard:
				record.leaderboard_visible !== undefined
					? !!record.leaderboard_visible
					: s.hideOnLeaderboard,
		}));

		section.isRx = record.score_type === 'Rx';
		setSection(newSection);
	};

	const fetchScores = () => {
		if (independentScoring) {
			// TODO: Parse independent score here
			// this.parseIndependentScore(section);
		} else {
			if (!sessionId) {
				return;
			}

			getScore(sessionId)
				.then(res => {
					if (!res.error) {
						res.data.forEach(record => {
							parseExistingScore(record as ScoreResultType);
						});
					}
				})
				.catch(() => {
					SimpleToast.show(
						'Something went wrong fetching scores',
						SimpleToast.SHORT,
					);
				});
		}
	};

	const loadEntered = (
		val: string,
		movementId: number | null,
		roundIndex: number | null = null,
	) => {
		const newSection = { ...section };
		if (movementId) {
			// entered value belongs to a movement within section
			if (roundIndex !== null) {
				// entered value belongs to one of the rounds of a movement of a section
				newSection.movements[movementId]!.loads[roundIndex] = val;

				// Calculate total value
				const totalValue = newSection.movements[
					movementId
				]!.loads.reduce((sum, load) => {
					const value = isNaN(Number(load)) ? 0 : Number(load);
					return sum + value;
				}, 0);

				newSection.movements[movementId]!.value = String(totalValue);
			} else {
				newSection.movements[movementId]!.value = val;
			}
		} else if (roundIndex !== null) {
			// entered value belongs to one of the rounds of a movement of a section
			newSection.loads[roundIndex] = val;

			// Calculate total value
			const totalValue = newSection.loads.reduce((sum, load) => {
				const value = isNaN(Number(load)) ? 0 : Number(load);
				return sum + value;
			}, 0);

			newSection.value = String(totalValue);
		} else {
			newSection.value = val;
		}

		setSection(newSection);
	};

	const minEntered = (
		val: string,
		movementId: number | null = null,
		roundIndex: number | null = null,
	) => {
		let newSection = { ...section };
		let timeVal = null;
		if (movementId) {
			timeVal =
				newSection.movements[movementId]?.value === ''
					? '0:0'
					: newSection.movements[movementId]?.value;
		} else {
			timeVal = newSection.value === '' ? '0:0' : newSection.value;
		}

		const time = timeVal?.split(':');
		if (!time) {
			return;
		}

		if (movementId) {
			if (roundIndex != null) {
				newSection.movements[movementId]!.minutes[roundIndex] = val;

				let totalMin: number = 0;
				let totalSec = 0;

				newSection.movements[movementId]?.minutes.forEach(
					(min: string) => {
						totalMin += isNaN(parseInt(min)) ? 0 : parseInt(min);
					},
				);

				newSection.movements[movementId]?.seconds.forEach(
					(sec: string) => {
						totalSec += isNaN(parseInt(sec)) ? 0 : parseInt(sec);
					},
				);

				newSection.movements[movementId]!.value =
					`${totalMin}:${totalSec}`;
			} else {
				newSection.movements[movementId]!.value = `${val}:${time[1]}`;
			}
		} else if (roundIndex != null) {
			newSection.minutes[roundIndex] = String(val);

			let totalMin = 0;
			let totalSec = 0;
			newSection.minutes.forEach(min => {
				totalMin += isNaN(parseInt(min)) ? 0 : parseInt(min);
			});
			newSection.seconds.forEach(sec => {
				totalSec += isNaN(parseInt(sec)) ? 0 : parseInt(sec);
			});

			newSection = {
				...newSection,
				value: `${totalMin}:${totalSec}`,
			};
		} else {
			newSection = {
				...newSection,
				value: `${val}:${time[1]}`,
			};
		}

		const sTime = newSection.value.split(':');

		// if it has multiple fields
		if (roundIndex) {
			let finalSec = parseInt(sTime[1] ?? '0');
			const finalMin =
				parseInt(sTime[0] ?? '0') + Math.floor(finalSec / 60);
			finalSec %= 60;

			sTime[0] = finalMin < 10 ? `0${finalMin}` : finalMin.toString();
			sTime[1] = finalSec < 10 ? `0${finalSec}` : finalSec.toString();
		}

		newSection = {
			...newSection,
			value: `${sTime[0]}:${
				parseInt(sTime[1] ?? '0') > 0 ? sTime[1] : ''
			}`,
		};

		setSection(newSection);
	};

	const secEntered = (
		val: string,
		movementId: number | null = null,
		roundIndex: number | null = null,
	) => {
		let newSection = { ...section };
		let timeVal = null;

		if (movementId !== null) {
			timeVal =
				newSection.movements[movementId]?.value === ''
					? '0:0'
					: newSection.movements[movementId]?.value;
		} else {
			timeVal = newSection.value === '' ? '0:0' : newSection.value;
		}

		const time = timeVal?.split(':');
		if (!time) {
			return;
		}

		if (movementId !== null) {
			if (roundIndex !== null) {
				newSection.movements[movementId]!.seconds[roundIndex] = val;

				let totalMin = 0;
				let totalSec = 0;

				newSection.movements[movementId]!.minutes.forEach(min => {
					totalMin += isNaN(parseInt(min)) ? 0 : parseInt(min);
				});

				newSection.movements[movementId]!.seconds.forEach(sec => {
					totalSec += isNaN(parseInt(sec)) ? 0 : parseInt(sec);
				});

				newSection.movements[movementId]!.value =
					`${totalMin}:${totalSec}`;
			} else {
				newSection.movements[movementId]!.value = `${time[0]}:${val}`;
			}
		} else if (roundIndex !== null) {
			newSection.seconds[roundIndex] = val;

			let totalMin = 0;
			let totalSec = 0;

			newSection.minutes.forEach(min => {
				totalMin += isNaN(parseInt(min)) ? 0 : parseInt(min);
			});

			newSection.seconds.forEach(sec => {
				totalSec += isNaN(parseInt(sec)) ? 0 : parseInt(sec);
			});

			newSection = {
				...newSection,
				value: `${totalMin}:${totalSec}`,
			};
		} else {
			newSection = {
				...newSection,
				value: `${time[0]}:${val}`,
			};
		}

		// get the final time
		const sTime = newSection.value.split(':');

		if (roundIndex !== null) {
			let finalSec = parseInt(sTime[1] ?? '0');
			const finalMin =
				parseInt(sTime[0] ?? '0') + Math.floor(finalSec / 60);
			finalSec %= 60;

			sTime[0] = finalMin < 10 ? `0${finalMin}` : finalMin.toString();
			sTime[1] = finalSec < 10 ? `0${finalSec}` : finalSec.toString();
		}

		newSection = {
			...newSection,
			value: `${sTime[0]}:${
				parseInt(sTime[1] ?? '0') > 0 ? sTime[1] : ''
			}`,
		};

		setSection(newSection);
	};

	const roundsOrDistanceEntered = (
		val: string,
		movementId: number | null = null,
	) => {
		const newSection = { ...section };
		if (movementId) {
			newSection.movements[movementId]!.value = val;
		} else {
			newSection.value = val;
		}

		setSection(newSection);
	};

	const repsEntered = (reps: string, movementId: number | null = null) => {
		const newSection = { ...section };
		if (movementId) {
			newSection.movements[movementId]!.reps = reps;
		} else {
			newSection.reps = reps;
		}

		setSection(newSection);
	};

	const checkboxClicked = (movementId: number | null = null) => {
		const newSection = { ...section };
		if (movementId) {
			newSection.movements[movementId]!.value =
				newSection.movements[movementId]!.value === 'Yes'
					? 'No'
					: 'Yes';
		} else {
			newSection.value = newSection.value === 'Yes' ? 'No' : 'Yes';
		}
		setSection(newSection);
	};

	const getScoreSection = (
		unitType: string | undefined,
		method: string | undefined,
		movement:
			| ({
					movement_id: number;
			  } & SessionWODMovementDetailsSchemaType)
			| null = null,
	) => {
		const displayValue = movement
			? section.movements[movement.movement_id]?.value
			: section.value;

		const displayComment = movement
			? section.movements[movement.movement_id]?.comments
			: section.comments;

		const leaderboardVisibile = movement
			? section.movements[movement.movement_id]
					?.comment_leaderboard_visible
			: section.comment_leaderboard_visible;

		const onClickAddComment = () => {
			setState(prevState => ({
				...prevState,
				commentField: movement ? movement.movement_id : 'section',
				commentValue: displayComment ?? null,
				commentLeaderboardVisible: !!leaderboardVisibile,
			}));
		};

		const fieldHandlers: ScoreInputFieldHandlers = {
			loadEntered,
			addToRefs,
			focusToRef,
			minEntered,
			secEntered,
			roundsOrDistanceEntered,
			repsEntered,
			checkboxClicked,
		};

		return (
			<View
				key={movement ? movement.movement_id : unitType}
				style={styles.scoreContainer}
			>
				{movement ? <Text bold>{movement.name}</Text> : null}

				<ScoreInputField
					section={section}
					unitType={unitType}
					method={method}
					movementId={movement ? movement.movement_id : null}
					handler={fieldHandlers}
				/>

				{method === 'sum' && (
					<Text
						style={{ marginVertical: config.metrics.rg }}
						center
						size="md"
						bold
						color="darkgray"
					>
						{`Total : ${displayValue}`}
					</Text>
				)}

				<Spacer size="rg" />

				<TouchableOpacity
					onPress={onClickAddComment}
					style={styles.commentDisplay}
				>
					<Text
						color={displayComment ? 'darkgray' : 'mute'}
						center
						size="md"
					>
						{displayComment ? `${displayComment} ` : 'Add Comments'}
						{displayComment ? (
							<MIcon
								name="pencil"
								size={15}
								style={styles.commentInputIcon}
								color={displayComment ? 'darkgray' : 'mute'}
							/>
						) : null}
					</Text>
				</TouchableOpacity>
			</View>
		);
	};

	useFocusEffect(
		useCallback(() => {
			void fetchScores();
		}, []),
	);

	// Update handleLayout to set layoutHeight
	const handleLayout = (event: LayoutChangeEvent) => {
		const { height } = event.nativeEvent.layout;
		setLayoutHeight(height);
	};

	// Add handler for content size change
	const handleContentSizeChange = (_width: number, height: number) => {
		setContentHeight(height);
	};

	// Use useEffect to determine if ScrollView is scrollable
	useEffect(() => {
		setIsScrollable(contentHeight > layoutHeight);
	}, [contentHeight, layoutHeight]);

	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const { contentOffset, contentSize, layoutMeasurement } =
			event.nativeEvent;
		const maxScroll = contentSize.height - layoutMeasurement.height;
		const scrollPercent = (contentOffset.y / maxScroll) * 100;
		setScrollPosition(scrollPercent + 10);
	};

	let submitButtonHeight: { height?: DimensionValue };
	let bottomMargin: { bottom?: DimensionValue } = {};
	if (fromCalendar) {
		if (keyboardVisible) {
			submitButtonHeight = {
				height: Platform.OS === 'ios' ? '100%' : '100%',
			};
			bottomMargin = { bottom: Platform.OS === 'ios' ? 20 : 0 };
		} else {
			submitButtonHeight = {
				height: Platform.OS === 'ios' ? '100%' : '100%',
			};
		}
	} else if (keyboardVisible) {
		submitButtonHeight = { height: Platform.OS === 'ios' ? '55%' : '100%' };
		bottomMargin = {};
	} else {
		submitButtonHeight = { height: Platform.OS === 'ios' ? '55%' : '100%' };
		bottomMargin = { bottom: 20 };
	}

	const renderInputFields = useMemo(
		() => (
			<ScrollView
				ref={scrollViewRef}
				contentInset={{
					bottom: state.isKeyboardVisible ? 100 : 0,
				}}
				style={{
					padding: config.metrics.rg,
				}}
				showsVerticalScrollIndicator={false}
				onLayout={handleLayout}
				onContentSizeChange={handleContentSizeChange}
				onScroll={handleScroll}
				scrollEventThrottle={16}
			>
				{section.scoring_by === 'movement' &&
					isArray(section?.wod_movements) &&
					section?.wod_movements?.length > 0 &&
					section.wod_movements.map(movement => {
						// remove not included movements if 'editMode' is true
						if (
							editMode &&
							editData?.ref_id !== movement.movement_id
						) {
							return false;
						}

						return getScoreSection(
							section.scoring_type?.unit_type,
							section.scoring_type?.method,
							{
								...movement.movement,
								movement_id: movement.id,
							},
						);
					})}

				{section.scoring_by === 'section' &&
					getScoreSection(
						section.scoring_type?.unit_type,
						section.scoring_type?.method,
						null,
					)}
			</ScrollView>
		),
		[section, state],
	);

	return (
		<>
			<View style={styles.scoreCommentHeight}>
				<ScoreHeader
					title={section.name}
					hideRxSwitch={hideRxSwitch}
					isRx={section.isRx}
					onRxChange={rxChanged}
				/>

				<View
					style={[{ flex: scoringFlexValue }, layout.overflowHidden]}
				>
					{renderInputFields}

					{isScrollable ? (
						<View style={styles.scrollIndicatorContainer}>
							<Animated.View
								style={[
									styles.scrollIndicator,
									{ height: `${scrollPosition}%` },
								]}
							/>
						</View>
					) : null}
				</View>
			</View>
			<View
				style={{
					...styles.buttonContainer,
					...bottomMargin,
				}}
			>
				{!independentScoring ? (
					<TouchableOpacity
						style={styles.disableReplyButtonStyle}
						onPress={() =>
							setState(s => ({
								...s,
								hideOnLeaderboard: !s.hideOnLeaderboard,
							}))
						}
					>
						<Row style={{ paddingHorizontal: config.metrics.rg }}>
							<View
								style={[
									styles.checkboxInput,
									state.hideOnLeaderboard &&
										styles.checkboxInputChecked,
								]}
							>
								{state.hideOnLeaderboard ? (
									<Icon
										name="checkmark"
										size={config.fonts.metrics.sm}
										color={config.fonts.colors.light}
									/>
								) : null}
							</View>
							<Text>Show on leaderboard</Text>
						</Row>
					</TouchableOpacity>
				) : null}

				{section.scoring_by === 'movement' &&
				section.wod_movements?.length === 0 ? null : (
					<View
						style={{
							padding: config.metrics.rg,
							...submitButtonHeight,
						}}
					>
						<Button
							onPress={() => void submitScore()}
							loading={submitting}
							variant="info"
							title={submitting ? 'please wait..' : 'submit'}
							uppercase
						/>

						{editMode && independentScoring && (
							<Button
								loading={isDeleting}
								// TODO: Do this
								// onPress={() => this.handleDeletePress()}
								style={styles.removeButton}
								variant="dark"
								title="remove"
								uppercase
							/>
						)}
					</View>
				)}
			</View>

			<ScoreComment
				commentField={state.commentField}
				commentValue={state.commentValue}
				commentLeaderboardVisible={state.commentLeaderboardVisible}
				enableLeaderboardComment={state.enableLeaderboardComment}
				onCommentChange={val => {
					setState(s => ({ ...s, commentValue: val }));
				}}
				onLeaderboardClick={() => {
					setState(s => ({
						...s,
						commentLeaderboardVisible: !s.commentLeaderboardVisible,
					}));
				}}
				onClose={() => {
					Keyboard.dismiss();
				}}
				onSave={() => {
					const comment = state.commentValue as string;
					if (
						state.commentField !== 'section' &&
						typeof state.commentField === 'number'
					) {
						section.movements[state.commentField]!.comments =
							comment;
					} else {
						section.comments = comment;
					}

					setState(s => ({
						...s,
						commentField: null,
						commentValue: '',
					}));

					// submit score
					// void submitScore();
				}}
			/>

			{!Constant.IS_ANDROID && <KeyboardSpacer />}
		</>
	);
};

export default ScoreComponent;

const styles = StyleSheet.create({
	scoreContainer: {
		width: '100%',
		marginBottom: config.metrics.xl * 2,
	},
	commentDisplay: {
		alignSelf: 'center',
		width: Constant.DEVICEWIDTH * 0.8,
	},
	commentInputIcon: {
		marginLeft: 15,
	},
	removeButton: {
		marginTop: 8,
	},
	disableReplyButtonStyle: {
		paddingVertical: config.metrics.rg,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderColor: '#DDD',
	},
	checkboxInput: {
		borderRadius: 6,
		borderWidth: 1,
		borderColor: config.fonts.colors.mute,
		width: 20,
		height: 20,
		padding: 0,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: config.metrics.sm,
	},
	checkboxInputChecked: {
		backgroundColor: config.fonts.colors.info,
		borderColor: config.fonts.colors.info,
	},
	scrollIndicatorContainer: {
		position: 'absolute',
		right: 0,
		top: 0,
		bottom: 0,
		width: 10,
		backgroundColor: '#f0f0f0',
	},
	scrollIndicator: {
		width: '100%',
		backgroundColor: config.fonts.colors.info,
	},
	scoreCommentHeight: {
		height: '50%',
	},
	buttonContainer: {
		height: 100,
	},
});
