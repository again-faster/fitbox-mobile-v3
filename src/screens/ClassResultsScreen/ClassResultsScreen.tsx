import { Button, Card, HR, Row, Spacer, Text } from '@/components/atoms';
import { BottomPanel, Modal } from '@/components/molecules';
import { getGymClasses, getGymVenues } from '@/services/gym';
import { applauseScore } from '@/services/leaderboards';
import getClassLeaderboards from '@/services/leaderboards/getClassLeaderboards';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { ClassResultsParams } from '@/types/navigation';
import { LeaderboardsDataType } from '@/types/schemas/leaderboards';
import { Constant, Say } from '@/utils';
import useStore from '@/zustand/Store';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { isArray } from 'lodash';
import moment from 'moment';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	Platform,
	RefreshControl,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';
import { Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ResultRow } from './components';

type State = {
	allow_comments: boolean;
	loading: boolean;
	loadingResults: boolean;
	classesModal: boolean;
	selectedClass: number | null;
	filterPanelVisible: boolean;
	genderPanelVisible: boolean;
	datePanelVisible: boolean;
	venuePanelVisible: boolean;
	showHeader: boolean;
	resultDate: string | boolean;
	gender: string;
	ageFrom: string;
	ageTo: string;
	venueFilters: number[];
	venues: Venues[];
	activeSectionIndex: number | null;
	activeResultIdEmotePopup: unknown;
};

type Classes = {
	id: number | null;
	name: string;
};
type Venues = {
	id: number | null;
	location: string;
	name: string;
};

type Sections = {
	[key: string | number]: {
		activeCard: boolean;
		title: string;
		results: LeaderboardsDataType[];
		movementName?: string;
		reps?: string;
		isMovement?: boolean;
	};
};

const defaultTimeFormat = Constant.DEFAULT_DATE_FORMAT;
const genderOptions = [
	{ id: '', name: 'All' },
	{ id: 'Male', name: 'Male' },
	{ id: 'Female', name: 'Female' },
];

const iosVersion = parseInt(Platform.Version as string, 10);
const ClassResultsScreen = ({
	selectClass,
	dateFromParams,
}: ClassResultsParams) => {
	const { allowCommentsState, sessionSections } = useStore(state => ({
		allowCommentsState: state.allowComments,
		sessionSections: state.sections,
	}));

	const [state, setState] = useState<State>({
		allow_comments:
			typeof allowCommentsState === 'number' ? allowCommentsState : true,
		loading: true,
		loadingResults: true,
		classesModal: false,
		selectedClass: null,
		filterPanelVisible: false,
		genderPanelVisible: false,
		datePanelVisible: false,
		venuePanelVisible: false,
		showHeader: true,
		resultDate: moment().format(defaultTimeFormat),
		gender: '',
		ageFrom: '',
		ageTo: '',
		venueFilters: [],
		venues: [],
		activeSectionIndex: null,
		activeResultIdEmotePopup: null,
	});
	const [classes, setClasses] = useState<Classes[]>([]);
	const [sections, setSections] = useState<Sections>({});
	const [resultDateParsed, setResultDateParsed] = useState<string>();
	const stateRef = useRef<State>();
	stateRef.current = state;
	const [hasFilter, setHasFilter] = useState<boolean>();
	const isOnFocus = useIsFocused();
	const navigation = useNavigation();

	useEffect(() => {
		fetchClasses();
		void (async () => {
			await fetchVenues();
		})();
	}, []);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => null,
		});
	}, []);

	useEffect(() => {
		fetchLeaderBoard();
	}, [state.selectedClass, isOnFocus, state.resultDate]);

	useEffect(() => {
		const { resultDate } = state;
		if (resultDate !== moment().format(defaultTimeFormat)) {
			setResultDateParsed(
				moment(resultDate as string).format('MMM DD, YYYY'),
			);
		} else {
			setResultDateParsed('Today');
		}
	}, [state.resultDate]);

	useEffect(() => {
		const { gender, resultDate, venueFilters, ageFrom, ageTo } = state;
		if (
			gender !== '' ||
			resultDate !== moment().format(defaultTimeFormat) ||
			venueFilters.length > 0 ||
			ageFrom !== '' ||
			ageTo !== ''
		) {
			setHasFilter(true);
		} else {
			setHasFilter(false);
		}
	}, [
		state.gender,
		state.resultDate,
		state.venueFilters,
		state.ageFrom,
		state.ageTo,
	]);

	const fetchClasses = () => {
		getGymClasses()
			.then(res => {
				setClasses(res.data);
				if (res.data.length) {
					const classIndex = res.data.findIndex(
						c => c.id === selectClass,
					);

					if (classIndex > -1) {
						const selectDate = dateFromParams as string;
						setState(prevState => ({
							...prevState,
							showHeader: false,
						}));
						setClass(classIndex, selectDate);
					} else {
						setClass(0);
					}
				} else {
					void Say.okThen(
						'There are no classes available at the moment.',
						'Error',
					).then(() => navigation.goBack());
				}
			})
			.catch(() => Say.err('Something went wrong, Here!'));
	};

	const fetchVenues = async () => {
		try {
			const venues = await getGymVenues();
			if (isArray(venues) && venues.length > 0) {
				venues.unshift({
					id: null,
					name: 'No location',
					location: 'Show classes without a location',
				});

				setState(prevState => ({ ...prevState, venues }));
			}
		} catch {
			Say.err('Something went wrong!');
		}
	};

	const setClass = (classIndex: number, date: boolean | string = false) => {
		setState(prevState => ({
			...prevState,
			selectedClass: classIndex,
			classesModal: false,
			...(date && { resultDate: date }),
		}));
		fetchLeaderBoard();
	};

	const fetchLeaderBoard = () => {
		const { selectedClass, resultDate } = state;
		setState(prevState => ({ ...prevState, loadingResults: true }));
		if (classes[selectedClass as number]) {
			getClassLeaderboards(
				classes[selectedClass as number]?.id as number,
				resultDate as string,
			)
				.then(res => {
					setSections(parseResults(res.data));
					setState(prevState => ({
						...prevState,
						loading: false,
						loadingResults: false,
					}));
				})
				.catch(() => {
					Say.err('Something went wrong, Leaderboards');
				});
		}
	};

	const parseResults = (results: LeaderboardsDataType[]) => {
		const parsedSections: Sections = {};
		results.forEach(data => {
			const section = sessionSections.find(
				item => item.id === data.wod_section_id,
			);

			const movement =
				section?.wod_movements &&
				section?.wod_movements.find(
					item => item.id === data.wod_movement_id,
				);
			const groupKey = movement ? data.wod_movement_id : data.sequence;
			if (!parsedSections[groupKey as string | number]) {
				parsedSections[groupKey as string | number] = {
					title: data.section.name,
					activeCard: true,
					results: [],
					movementName: movement?.movement.name,
					reps: movement?.reps as string,
					isMovement: !!movement,
				};
			}

			parsedSections[groupKey as string | number]?.results.push(data);
		});
		return parsedSections;
	};

	const setGender = (gender: string) =>
		setState(prevState => ({
			...prevState,
			gender,
			genderPanelVisible: false,
		}));

	const setResultDate = (resultDate: string) => {
		setState(prevState => ({
			...prevState,
			resultDate,
			datePanelVisible: false,
		}));
	};

	const handleEmoteClick = (resultIndex: number, sIndex: number) =>
		setState(prevState => ({
			...prevState,
			activeResultIdEmotePopup:
				prevState.activeResultIdEmotePopup !== null
					? null
					: resultIndex,
			activeSectionIndex:
				prevState.activeSectionIndex !== null ? null : sIndex,
		}));

	const handleApplause = async (
		score_id: number,
		type: string = 'clap',
		previousType: string | null = null,
	) => {
		if (previousType !== null) {
			const prevRes = await applauseScore(score_id, false, previousType);
			if (prevRes.error) Say.err(prevRes.message);
		}

		if (previousType !== type) {
			const res = await applauseScore(score_id, true, type);
			if (res.error) Say.err(res.message);
		}

		fetchLeaderBoard();
	};

	const handleResetFilter = () =>
		setState(prevState => ({
			...prevState,
			gender: '',
			resultDate: moment().format(defaultTimeFormat),
			ageFrom: '',
			ageTo: '',
			venueFilters: [],
		}));

	const toggleClassesModal = () =>
		setState(prevState => ({
			...prevState,
			classesModal: !state.classesModal,
		}));

	const toggleSectionCard = (index: string) => {
		const updatedSections = {
			...sections,
			[index]: {
				...sections[index],
				activeCard: !sections[index]?.activeCard,
			},
		};

		setSections(updatedSections as Sections);
	};

	const toggleVenueFilter = (id: number) => {
		let { venueFilters } = state;

		if (venueFilters.includes(id)) {
			venueFilters = venueFilters.filter(v => v !== id);
		} else {
			venueFilters.push(id);
		}

		setState(prevState => ({ ...prevState, venueFilters }));
	};

	const renderActiveVenueFilters = (
		venues: Venues[],
		venueFilters: number[],
	) => {
		if (venueFilters.length === 0) {
			return 'All';
		}
		return venueFilters
			.map(id => {
				const venue = venues.find(v => v.id === id) as Venues;
				return venue.name;
			})
			.join(', ');
	};

	const renderClasses = (array: Classes[], selectedClassIndex: number) =>
		array.map((c, cIndex) => {
			return (
				<TouchableOpacity
					key={cIndex}
					style={{ paddingVertical: config.metrics.rg }}
					onPress={() => setClass(cIndex)}
				>
					<Text
						size="md"
						color={cIndex === selectedClassIndex ? 'info' : 'black'}
					>
						{c.name}
					</Text>
				</TouchableOpacity>
			);
		});

	const renderSections = () => {
		const newSections = Object.entries(sections);

		return newSections.length ? (
			newSections.map((sData, sIndex) => {
				const section = sData[1];
				const sequenceId = sData[0];
				const paddingBottom = section.activeCard
					? 0
					: config.metrics.rg;
				return (
					<Card
						key={sIndex}
						style={{
							...styles.sectionsCard,
							paddingBottom,
						}}
					>
						<Row align="center" style={styles.sectionHeader}>
							<Text
								size="md"
								bold
								style={[layout.flex_1, styles.sectionTitle]}
								numberOfLines={1}
							>
								{section.isMovement
									? `${section.reps ? `${section.reps} reps` : ''} ${section.movementName} (${section.title})`
									: section.title}
							</Text>
							<Icon
								name={
									section.activeCard
										? 'chevron-up'
										: 'chevron-down'
								}
								color={memberTheme.colors.primary}
								size={25}
								onPress={() => toggleSectionCard(sequenceId)}
							/>
						</Row>
						{section.activeCard && (
							<View style={{ marginTop: config.metrics.rg }}>
								{renderResults(section.results, sIndex)}
							</View>
						)}
					</Card>
				);
			})
		) : (
			<Text center size="md" style={styles.emptyText}>
				No results found
			</Text>
		);
	};

	const renderResults = (results: LeaderboardsDataType[], sIndex: number) => {
		const {
			gender,
			ageFrom,
			ageTo,
			allow_comments: allowComments,
			venueFilters,
		} = state;
		const showResults: LeaderboardsDataType[] = [];

		const allComplete = results.every(
			item => item.section?.scoring_type_id === 3,
		);

		let sortedResults = results;

		if (allComplete) {
			sortedResults = [...results].sort((a, b) =>
				a.firstname.localeCompare(b.firstname),
			);
		}

		if (sortedResults.length) {
			sortedResults.forEach(data => {
				const passGender = gender === data.gender || gender === '';
				const removeInvalid =
					data.value === 'No' && data.section.scoring_type_id === 3;

				if (passGender && !removeInvalid) {
					showResults.push(data);
				}
			});

			return showResults.length ? (
				showResults.map((data, i) => {
					let show = true;
					// filtered by page
					if (ageFrom !== '' && ageTo !== '') {
						show = false;
						if (
							(data.age as number) >= Number(ageFrom) &&
							(data.age as number) <= Number(ageTo)
						) {
							show = false;
						}
					}

					// filtered by venue
					if (
						venueFilters.length > 0 &&
						!venueFilters.includes(data.venue_id as number)
					) {
						show = false;
					}

					return show ? (
						<ResultRow
							key={i}
							rowIndex={i}
							{...data}
							onApplause={handleApplause}
							sectionIndex={sIndex}
							activeSectionIndex={
								state.activeSectionIndex as number
							}
							activeResultIndex={
								state.activeResultIdEmotePopup as number
							}
							onEmoteClick={handleEmoteClick}
							showComments={allowComments}
							last={showResults.length === i + 1}
						/>
					) : null;
				})
			) : (
				<Text center size="md" style={styles.emptyText}>
					No results found
				</Text>
			);
		}
		return (
			<Text center size="md" style={styles.emptyText}>
				No results found
			</Text>
		);
	};

	const renderGenderPanel = () =>
		genderOptions.map((genderData, key) => {
			const { gender } = state;

			const touchableStyle = {
				marginBottom:
					key + 1 !== genderOptions.length ? config.metrics.xl : 0,
			};

			return (
				<TouchableOpacity
					key={key}
					onPress={() => setGender(genderData.id)}
					style={touchableStyle}
				>
					<Row spacing="space-between">
						<Text>
							{genderData.name === '' ? 'All' : genderData.name}
						</Text>
						{genderData.id === gender && (
							<Icon
								name="check"
								size={config.metrics.lg}
								color={config.colors.info}
							/>
						)}
					</Row>
				</TouchableOpacity>
			);
		});

	const onConfirmDatePicker = (date: Date) => {
		setResultDate(moment(date).format(defaultTimeFormat));
		setState(prevState => ({
			...prevState,
			datePanelVisible: false,
		}));
		setTimeout(() => {
			setState(prevState => ({
				...prevState,
				filterPanelVisible: true,
			}));
		}, 500);
	};

	const onCancelDatePicker = () => {
		setState(prevState => ({
			...prevState,
			datePanelVisible: false,
		}));
		setTimeout(() => {
			setState(prevState => ({
				...prevState,
				filterPanelVisible: true,
			}));
		}, 500);
	};

	const handleGenderFilter = () => {
		if (state.gender === 'Male') return 'Female';
		if (state.gender === 'Female') return '';
		return 'Male';
	};

	const renderVenuePanel = () => {
		const { venueFilters, venues } = state;

		return venues.map(({ id, name }, key) => (
			<TouchableOpacity
				key={id}
				onPress={() => toggleVenueFilter(id as number)}
				style={{
					marginBottom:
						key + 1 !== venues.length
							? config.metrics.xl
							: config.metrics.xs,
				}}
			>
				<Row spacing="space-between">
					<Text size="md">{name}</Text>
					{venueFilters.includes(id as number) && (
						<Icon
							name="check"
							size={config.metrics.md}
							color={config.colors.info}
						/>
					)}
				</Row>
			</TouchableOpacity>
		));
	};

	return (
		<View style={styles.mainCon}>
			{state.loading ? (
				<View style={styles.loader}>
					<ActivityIndicator
						size="large"
						color={memberTheme.colors.primary}
					/>
				</View>
			) : (
				<>
					{state.showHeader && (
						<View style={styles.headerCon}>
							<Row align="center" style={styles.classRow}>
								<Text size="sm" bold style={styles.fieldLabel}>
									Class:
								</Text>
								<Spacer horizontal />
								<TouchableOpacity
									style={styles.selectClassBtn}
									onPress={toggleClassesModal}
								>
									<Text
										size="md"
										bold
										center
										style={[
											layout.flex_1,
											styles.className,
										]}
									>
										{
											classes[
												state.selectedClass as number
											]?.name
										}
									</Text>
									<Icon
										name="chevron-down"
										color={memberTheme.colors.primaryInk}
										size={config.metrics.lg}
									/>
								</TouchableOpacity>
								<Spacer horizontal />
								<TouchableOpacity
									style={styles.filterButton}
									onPress={() =>
										setState(prevState => ({
											...prevState,
											filterPanelVisible: true,
										}))
									}
								>
									<Icon
										name="filter-outline"
										color={memberTheme.colors.primaryInk}
										size={config.metrics.lg}
									/>
									{hasFilter && (
										<Badge
											size={8}
											style={styles.badgeConStyle}
											allowFontScaling={false}
										/>
									)}
								</TouchableOpacity>
							</Row>
							<Spacer size="md" />
							<Text
								center
								size="lg"
								bold
								style={styles.resultsTitle}
							>
								{resultDateParsed !== 'Today'
									? `${resultDateParsed} - `
									: "Today's"}{' '}
								Results
							</Text>
							<Row style={styles.genderRow}>
								<TouchableOpacity
									style={styles.maleFemaleBtns}
									onPress={() =>
										setGender(handleGenderFilter())
									}
								>
									<View
										style={{
											...styles.genderText,
											backgroundColor:
												state.gender === 'Male'
													? memberTheme.colors.primary
													: memberTheme.colors
															.surface,
										}}
									>
										<Text
											color={
												state.gender === 'Male'
													? 'light'
													: 'lightgrey'
											}
											bold={state.gender === 'Male'}
										>
											M
										</Text>
									</View>

									<View
										style={{
											...styles.genderText,
											backgroundColor:
												state.gender === 'Female'
													? memberTheme.colors.primary
													: memberTheme.colors
															.surface,
										}}
									>
										<Text
											color={
												state.gender === 'Female'
													? 'light'
													: 'lightgrey'
											}
											bold={state.gender === 'Female'}
										>
											F
										</Text>
									</View>
								</TouchableOpacity>
							</Row>
						</View>
					)}
					<ScrollView
						contentContainerStyle={styles.resultsContainer}
						refreshControl={
							<RefreshControl
								refreshing={state.loadingResults}
								onRefresh={fetchLeaderBoard}
							/>
						}
					>
						{renderSections()}
					</ScrollView>

					{/* Search Modal */}
					<Modal visible={state.classesModal}>
						<View style={styles.modalContainer}>
							<TouchableWithoutFeedback
								onPress={toggleClassesModal}
							>
								<View
									style={
										styles.searchModalTouchableWithoutFeedback
									}
								/>
							</TouchableWithoutFeedback>

							<Card style={styles.modalStyle}>
								<Text size="md" color="mute">
									Select class
								</Text>
								<Spacer />
								<ScrollView>
									<View>
										{renderClasses(
											classes,
											state.selectedClass as number,
										)}
									</View>
								</ScrollView>
							</Card>
						</View>
					</Modal>

					{/* Filter panel */}
					<BottomPanel
						title="Filter Results"
						visible={state.filterPanelVisible}
						onClose={() =>
							setState(prevState => ({
								...prevState,
								filterPanelVisible: false,
							}))
						}
						maxHeight="90%"
						rightTitle={
							<TouchableOpacity onPress={handleResetFilter}>
								<Text size="md" color="darkgray">
									Reset
								</Text>
							</TouchableOpacity>
						}
					>
						<View style={{ padding: config.metrics.lg }}>
							<TouchableOpacity
								onPress={() =>
									setState(prevState => ({
										...prevState,
										genderPanelVisible: true,
										filterPanelVisible:
											Platform.OS === 'android',
									}))
								}
							>
								<Row>
									<Icon
										name="account"
										size={config.metrics.xl}
										color={config.backgrounds.darkgray}
									/>
									<Spacer horizontal size="rg" />
									<View>
										<Text size="md">Gender</Text>
										<Text
											size="sm"
											color={
												state.gender !== ''
													? 'info'
													: 'darkgray'
											}
										>
											{state.gender !== ''
												? state.gender
												: 'All'}
										</Text>
									</View>
								</Row>
							</TouchableOpacity>
							<Spacer />
							<TouchableOpacity
								onPress={() =>
									setState(prevState => ({
										...prevState,
										datePanelVisible: true,
										filterPanelVisible:
											Platform.OS === 'android',
									}))
								}
							>
								<Row>
									<Icon
										name="calendar"
										size={config.metrics.xl}
										color={config.backgrounds.darkgray}
									/>
									<Spacer horizontal size="rg" />
									<View>
										<Text size="md">Result Date</Text>
										<Text
											size="sm"
											color={
												resultDateParsed !== 'Today'
													? 'info'
													: 'darkgray'
											}
										>
											{resultDateParsed}
										</Text>
									</View>
								</Row>
							</TouchableOpacity>
							<Spacer />
							{state.venues.length > 0 && (
								<>
									<TouchableOpacity
										onPress={() =>
											setState(prevState => ({
												...prevState,
												venuePanelVisible: true,
												filterPanelVisible:
													Platform.OS === 'android',
											}))
										}
									>
										<Row>
											<Icon
												name="map"
												size={config.metrics.xl}
												color={
													config.backgrounds.darkgray
												}
											/>
											<Spacer horizontal size="rg" />
											<View style={layout.flex_1}>
												<Text size="md">Location</Text>
												<Text
													size="sm"
													style={{
														color: state
															.venueFilters.length
															? config.colors.info
															: config.backgrounds
																	.darkgray,
													}}
												>
													{renderActiveVenueFilters(
														state.venues,
														state.venueFilters,
													)}
												</Text>
											</View>
											<Spacer horizontal size="rg" />
											{state.venueFilters.length > 0 && (
												<Icon
													name="close"
													size={config.metrics.xl}
													color={
														config.backgrounds
															.darkgray
													}
													onPress={() =>
														setState(prevState => ({
															...prevState,
															venueFilters: [],
														}))
													}
												/>
											)}
										</Row>
									</TouchableOpacity>
									<Spacer />
								</>
							)}
							<HR margin />
							<Text size="md">Age Group</Text>
							<Spacer size="sm" />
							<Row>
								<View style={layout.flex_1}>
									<Text size="rg" color="darkgray">
										From
									</Text>
									<TextInput
										keyboardType="number-pad"
										style={styles.ageInput}
										value={state.ageFrom}
										onChangeText={age => {
											setState(prevState => ({
												...prevState,
												ageFrom: age,
											}));
										}}
										allowFontScaling={false}
									/>
								</View>
								<Spacer horizontal />
								<View style={layout.flex_1}>
									<Text size="rg" color="darkgray">
										To
									</Text>
									<TextInput
										keyboardType="number-pad"
										style={styles.ageInput}
										value={state.ageTo}
										onChangeText={age =>
											setState(prevState => ({
												...prevState,
												ageTo: age,
											}))
										}
										allowFontScaling={false}
									/>
								</View>
							</Row>
							<Spacer size="md" />
							<Button
								title="Apply Filter"
								buttonColor={config.colors.info}
								textColor="white"
								onPress={() =>
									setState(prevState => ({
										...prevState,
										filterPanelVisible: false,
									}))
								}
							/>
						</View>
					</BottomPanel>

					{/* Gender Panel */}
					<BottomPanel
						title="Gender"
						backButton
						visible={state.genderPanelVisible}
						onClose={() =>
							setState(prevState => ({
								...prevState,
								genderPanelVisible: false,
								filterPanelVisible: true,
							}))
						}
					>
						<View style={{ padding: config.metrics.lg }}>
							{renderGenderPanel()}
						</View>
					</BottomPanel>

					{/* Result Date Panel */}
					<DateTimePicker
						mode="date"
						date={new Date(state.resultDate as string)}
						maximumDate={new Date()}
						isVisible={state.datePanelVisible}
						pickerContainerStyleIOS={styles.pickerContaineriOSStyle}
						onConfirm={date => onConfirmDatePicker(date)}
						onCancel={onCancelDatePicker}
					/>

					{/* Location Panel */}
					<BottomPanel
						title="Location"
						visible={state.venuePanelVisible}
						onClose={() =>
							setState(prevState => ({
								...prevState,
								venuePanelVisible: false,
								filterPanelVisible: true,
							}))
						}
						rightTitle={
							<TouchableOpacity
								onPress={() =>
									setState(prevState => ({
										...prevState,
										venuePanelVisible: false,
										filterPanelVisible: true,
									}))
								}
							>
								<Text color="info" size="md">
									Accept
								</Text>
							</TouchableOpacity>
						}
					>
						<View style={{ padding: config.metrics.lg }}>
							{renderVenuePanel()}
						</View>
					</BottomPanel>
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	mainCon: {
		flex: 1,
		backgroundColor: memberTheme.colors.background,
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
	},
	headerCon: {
		margin: memberTheme.spacing.md,
		marginBottom: memberTheme.spacing.lg,
		padding: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.lg,
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		...memberTheme.shadow,
	},
	classRow: {
		width: '100%',
	},
	fieldLabel: {
		color: memberTheme.colors.textMuted,
	},
	selectClassBtn: {
		flex: 1,
		minHeight: 44,
		paddingVertical: memberTheme.spacing.sm,
		paddingHorizontal: memberTheme.spacing.md,
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
		borderColor: memberTheme.colors.border,
		borderWidth: 1,
		borderRadius: memberTheme.radius.sm,
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	className: {
		color: memberTheme.colors.text,
	},
	filterButton: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: memberTheme.radius.sm,
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	resultsTitle: {
		color: memberTheme.colors.text,
	},
	genderRow: {
		marginTop: memberTheme.spacing.md,
		justifyContent: 'center',
	},
	maleFemaleBtns: {
		borderColor: memberTheme.colors.border,
		borderRadius: memberTheme.radius.pill,
		flexDirection: 'row',
		borderWidth: 1,
		overflow: 'hidden',
	},
	genderText: {
		minWidth: 46,
		minHeight: 34,
		alignItems: 'center',
		justifyContent: 'center',
	},
	resultsContainer: {
		paddingHorizontal: memberTheme.spacing.md,
		paddingBottom: memberTheme.spacing.xxl,
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
		padding: 18,
		position: 'absolute',
		top: '20%',
		maxHeight: Constant.DEVICEHEIGHT / 2,
		borderRadius: memberTheme.radius.lg,
		backgroundColor: memberTheme.colors.surface,
		...memberTheme.shadow,
	},
	ageInput: {
		borderWidth: 1,
		borderRadius: memberTheme.radius.sm,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surfaceSoft,
		color: memberTheme.colors.text,
		minHeight: 44,
		textAlign: 'center',
	},
	searchModalTouchableWithoutFeedback: {
		flex: 1,
		width: '100%',
	},
	badgeConStyle: {
		zIndex: 2,
		position: 'absolute',
		backgroundColor: config.colors.danger,
	},
	sectionsCard: {
		borderRadius: memberTheme.radius.md,
		borderColor: memberTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		marginBottom: memberTheme.spacing.md,
		paddingHorizontal: 0,
		backgroundColor: memberTheme.colors.surface,
		overflow: 'hidden',
		...memberTheme.shadow,
	},
	sectionHeader: {
		minHeight: 52,
		paddingHorizontal: memberTheme.spacing.lg,
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	sectionTitle: {
		color: memberTheme.colors.text,
	},
	emptyText: {
		margin: memberTheme.spacing.lg,
		padding: memberTheme.spacing.xl,
		borderRadius: memberTheme.radius.md,
		backgroundColor: memberTheme.colors.surface,
		color: memberTheme.colors.textMuted,
	},
	pickerContaineriOSStyle: {
		paddingLeft: iosVersion >= 14 ? 18 : 0,
	},
});

export default ClassResultsScreen;
