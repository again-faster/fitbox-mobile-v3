import {
	Button,
	Card,
	HTMLRenderer,
	Row,
	ScrollView,
	Spacer,
	Text,
} from '@/components/atoms';
import { Loader } from '@/components/molecules';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ApplicationStackParamList } from '@/types/navigation';
import {
	SessionDetailSchemaType,
	SessionSectionSchemaType,
	SessionWODMovementSchemaType,
} from '@/types/schemas/session';
import { Constant, Func, Say } from '@/utils';
import { SessionTabsEnum } from '@/utils/Enum';
import useStore from '@/zustand/Store';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { isArray, isEmpty, parseInt } from 'lodash';
import { useCallback, useState } from 'react';
import {
	Modal,
	StyleSheet,
	TouchableOpacity,
	Text as Txt,
	View,
} from 'react-native';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';

const { metrics, fonts } = config;

const movementParams = Constant.MOVEMENT_PARAMS;

const WarningText = ({ text }: { text: string }) => (
	<Text
		style={{
			marginTop: metrics.xl,
			paddingHorizontal: metrics.xl,
			...styles.warningTxt,
		}}
	>
		{text}
	</Text>
);

interface SessionsSectionsTabProps {
	session: SessionDetailSchemaType;
	refreshing: boolean;
	handleTabChange: (tab: SessionTabsEnum) => void;
}

const SessionsSectionsTab = ({
	session,
	refreshing,
	handleTabChange,
}: SessionsSectionsTabProps) => {
	const navigation =
		useNavigation<NavigationProp<ApplicationStackParamList>>();

	const queryClient = useQueryClient();

	const loggedInUser = useStore(s => s.loggedInUser);

	// check if user is already booked
	const isAttend = !!session.member_attendance.some(
		member => member.user_id === loggedInUser?.id,
	);

	const [isVideoLoading, setIsVideoLoading] = useState(false);
	const [videoModalActive, setVideoModalActive] = useState(false);
	const [videoUrlCode, setVideoUrlCode] = useState('');
	const [toggledSections, setToggledSections] = useState<number[]>(() => {
		let openSections: number[] = [];

		// check sections if its an array
		if (isArray(session?.sections) && session?.sections.length > 0) {
			const sections = session?.sections;

			// Collapse all by default
			openSections = sections.map((_, sIndex) => sIndex);

			// check if one of sections has default_collapse_state = 1
			const hasCollapse = sections.some(
				section => section.default_collapse_state,
			);
			if (hasCollapse) {
				// get all indexes of sections that has default_collapse_state = 1
				openSections = sections
					.map((section, index) => {
						return section.default_collapse_state === 0
							? index
							: -1;
					})
					.filter(index => index !== -1);
			}
		}

		return openSections;
	});

	const sections = session?.sections ?? 'No Sections Found';

	const handleToggleAllSections = () => {
		if (toggledSections.length === 0) {
			setToggledSections(
				Array.from({ length: sections.length }, (_, i) => i),
			);
		} else {
			setToggledSections([]);
		}
	};
	const handleToggleSection = (index: number) => {
		// Check if section is already toggled
		if (toggledSections.includes(index)) {
			setToggledSections(
				toggledSections.filter(sectionId => sectionId !== index),
			);
		} else {
			setToggledSections([...toggledSections, index]);
		}
	};

	const onLoadVideo = () => setIsVideoLoading(false);
	const handlePlayVideo = (video: string) => {
		setVideoUrlCode(video);
		setIsVideoLoading(true);
		setVideoModalActive(true);
	};
	const onVideoError = () => {
		Say.err('Error in loading video');
		setVideoModalActive(false);
	};

	const handleNotesClick = (title: string, content: string) => {
		navigation.navigate('Webview', {
			title,
			content: `${content}<br/><br/>`, // workaround for scrolling issues
		});
	};

	const handleRefresh = () => {
		void queryClient.invalidateQueries({
			queryKey: ['sessionGetScheduleDetail'],
		});
	};

	const handleCloseVideo = () => setVideoModalActive(false);
	const handleVideoOnLoaded = () => setIsVideoLoading(false);

	const handleVideoOnError = () => {
		Say.err('Error in loading video');
		setVideoModalActive(false);
	};

	const submitScore = (section: SessionSectionSchemaType) => {
		navigation.navigate('Scoring', {
			section,
			sessionId: session.id,
		});
	};

	const renderSections = useCallback(() => {
		return (
			isArray(sections) &&
			sections.map((sData: SessionSectionSchemaType, index: number) => {
				const { wod_movements: wodMovements, fb_wod: fbWod } = sData;

				let useWodMovements: SessionWODMovementSchemaType[] =
					wodMovements ?? [];

				let section: SessionSectionSchemaType = {
					...sData,
					leaderboard_section_id: sData.id,
				};

				if (fbWod != null) {
					// Merge data if section have fb_wod
					let useTextSection = '';
					if (section?.fb_wod?.wod_section?.text_section !== '') {
						useTextSection =
							String(fbWod.wod_section.text_section) +
							(fbWod.notes ? `<br/> ${fbWod.notes}` : '');
					} else {
						useTextSection = Func.decodeHtml(fbWod.summary);
					}

					// setup section
					section = {
						...section,
						...fbWod.wod_section,
						name: section.name,
						text_section: useTextSection,
					};

					useWodMovements = fbWod?.wod_section?.wod_movements ?? [];
				}

				// Check if show embed
				const isShowEmbed =
					isEmpty(useWodMovements) &&
					section.video !== null &&
					section.video !== '';

				const staffOnly = Boolean(section?.staff_only);
				const isSectionToggled = toggledSections.includes(index);
				const sectionHeaderPadding = {
					paddingBottom: isSectionToggled ? 0 : 15,
					paddingTop: staffOnly ? 5 : 20,
				};

				return (
					<>
						<View
							key={section.id}
							style={styles.sessionHeaderContainer}
						>
							<TouchableOpacity
								onPress={() => handleToggleSection(index)}
								style={[
									styles.sessionHeaderComponent,
									sectionHeaderPadding,
								]}
							>
								{staffOnly && (
									<View style={styles.coachOnlyContainer}>
										<Text
											size="xs"
											bold
											style={styles.badgeStyle}
										>
											Coach Only
										</Text>
									</View>
								)}
								<Row>
									<Txt
										style={{
											...layout.fontInterBold,
											fontSize: fonts.metrics.lg,

											...layout.flex_1,
										}}
									>
										{section.name}
									</Txt>

									<MIcon
										name={
											isSectionToggled
												? 'chevron-up'
												: 'chevron-down'
										}
										color={fonts.colors.darkgray}
										size={fonts.metrics.xxl}
									/>
								</Row>
							</TouchableOpacity>

							{isSectionToggled && (
								<View style={styles.sessionContainer}>
									{section.scoring_type &&
										section.scoring_by === 'section' && (
											<Txt
												style={{
													...layout.fontInterRegular,
													fontSize:
														config.fonts.metrics.md,
													color: config.fonts.colors
														.mute,
												}}
											>
												{section.scoring_type.name}
											</Txt>
										)}

									<Row>
										{section.sets !== 0 &&
											section.sets != null && (
												<Txt
													style={{
														...layout.fontInterRegular,
														fontSize:
															config.fonts.metrics
																.md,
														color: config.fonts
															.colors.mute,
													}}
												>
													{section.sets} Set(s){' '}
												</Txt>
											)}
										{section.rounds !== 0 &&
											section.rounds != null && (
												<Txt
													style={{
														...layout.fontInterRegular,
														fontSize:
															config.fonts.metrics
																.md,
														color: config.fonts
															.colors.mute,
													}}
												>
													{section.rounds} Round(s){' '}
												</Txt>
											)}
										{section.reps !== '' && (
											<Txt
												style={{
													...layout.fontInterRegular,
													fontSize:
														config.fonts.metrics.md,
													color: config.fonts.colors
														.mute,
												}}
											>
												{' '}
												{section.reps} reps
											</Txt>
										)}
									</Row>

									{section.duration !== 0 &&
										section.duration != null && (
											<Txt
												style={{
													...layout.fontInterRegular,
													fontSize:
														config.fonts.metrics.md,
													color: config.fonts.colors
														.mute,
												}}
											>
												{section.duration} min(s)
											</Txt>
										)}

									{isShowEmbed && (
										<View style={styles.embedYoutube}>
											<WebView
												javaScriptEnabled
												domStorageEnabled
												onLoadEnd={onLoadVideo}
												onError={onVideoError}
												source={{
													uri: `https://www.youtube.com/embed/${Func.getYoutubeUrl(
														String(section.video),
													)}?loop=1`,
												}}
											/>
										</View>
									)}

									{section.text_section ? (
										<HTMLRenderer
											content={String(
												section.text_section,
											)}
											isMarginBottomLess={
												!isEmpty(
													section?.member_notes,
												) ||
												!isEmpty(section?.coach_notes)
											}
										/>
									) : null}

									{useWodMovements.length > 0 ? (
										<Spacer size="rg" />
									) : null}

									{useWodMovements.map((movement, key) => {
										const {
											notes,
											reps,
											movement_id: movementId,
										} = movement;
										const movementDetails =
											movement.movement;

										// Prepare video url
										const videoUrl = Func.getYoutubeUrl(
											String(movement.video),
										);

										return (
											<View
												key={key}
												style={{
													marginBottom: metrics.lg,
												}}
											>
												<Row
													spacing="space-between"
													align="center"
												>
													<Row
														style={[
															styles.movementSpacing,
															layout.flex_1,
														]}
													>
														{reps &&
															reps !== '' && (
																<>
																	<Txt
																		style={{
																			...layout.fontInterBold,
																			fontSize:
																				config
																					.fonts
																					.metrics
																					.lg,
																			color: config
																				.colors
																				.info,
																		}}
																	>
																		{reps}
																	</Txt>
																	<Spacer
																		size="sm"
																		horizontal
																	/>
																</>
															)}
														<Txt
															style={{
																...layout.fontInterBold,
																fontSize:
																	config.fonts
																		.metrics
																		.lg,
															}}
														>
															{
																movementDetails.name
															}
														</Txt>
													</Row>

													<Row>
														{!isEmpty(videoUrl) ? (
															<>
																<TouchableOpacity
																	onPress={() =>
																		handlePlayVideo(
																			videoUrl,
																		)
																	}
																>
																	<MIcon
																		name="play-circle-outline"
																		color={
																			fonts
																				.colors
																				.brand
																		}
																		size={
																			fonts
																				.metrics
																				.xxl
																		}
																	/>
																</TouchableOpacity>
																<Spacer
																	horizontal
																	size={
																		config
																			.metrics
																			.sm
																	}
																/>
															</>
														) : null}
														<TouchableOpacity
															onPress={() => {
																navigation.navigate(
																	'MovementHistory',
																	{
																		movementId,
																		name: movementDetails.name,
																	},
																);
															}}
														>
															<MIcon
																name="clock-time-three-outline"
																color={
																	fonts.colors
																		.brand
																}
																size={
																	fonts
																		.metrics
																		.xxl
																}
															/>
														</TouchableOpacity>
													</Row>
												</Row>

												{section.scoring_type &&
													section.scoring_by ===
														'movement' && (
														<Txt
															style={{
																...layout.fontInterRegular,
																fontSize:
																	config.fonts
																		.metrics
																		.md,
																color: config
																	.fonts
																	.colors
																	.mute,
															}}
														>
															{
																section
																	.scoring_type
																	.name
															}
														</Txt>
													)}

												{movementParams.map(
													mov_param => {
														if (
															mov_param.key ===
															'time'
														) {
															return (
																parseInt(
																	String(
																		movement[
																			mov_param
																				.key
																		],
																	),
																) > 0 && (
																	<Txt
																		key={
																			mov_param.key
																		}
																		style={{
																			...layout.fontInterRegular,
																			fontSize:
																				config
																					.fonts
																					.metrics
																					.md,
																			color: config
																				.fonts
																				.colors
																				.mute,
																		}}
																	>
																		{
																			movement[
																				mov_param
																					.key
																			]
																		}

																		{String(
																			movement[
																				`${mov_param.key}_unit`
																			],
																		)}
																	</Txt>
																)
															);
														}

														// Destructure and obtain the gender-specific height and unit only once
														const maleHeight =
															String(
																movement[
																	`${mov_param.key}_male` as keyof SessionWODMovementSchemaType
																],
															);
														const femaleHeight =
															String(
																movement[
																	`${mov_param.key}_female` as keyof SessionWODMovementSchemaType
																],
															);
														const unit = String(
															movement[
																`${mov_param.key}_unit` as keyof SessionWODMovementSchemaType
															],
														);

														// Simplify .replace() by creating a helper function
														const cleanHeight = (
															height: string,
														) =>
															height.replace(
																'.00',
																'',
															);

														// Compute content only once and store it in a variable
														const content =
															parseInt(
																maleHeight,
																10,
															) > 0 ? (
																<Text
																	key={
																		mov_param.key
																	}
																	size="md"
																	color="mute"
																>
																	{cleanHeight(
																		maleHeight,
																	)}{' '}
																	{unit} (
																	{cleanHeight(
																		femaleHeight,
																	)}{' '}
																	{unit})
																</Text>
															) : null;

														// Return the content
														return content;
													},
												)}

												{notes !== '' &&
													notes != null && (
														<Text
															size="md"
															style={{
																marginTop:
																	metrics.rg,
															}}
														>
															{notes}
														</Text>
													)}
											</View>
										);
									})}

									{!isEmpty(section?.coach_notes) ? (
										<Row
											onPress={() =>
												handleNotesClick(
													'Coach Notes',
													String(section.coach_notes),
												)
											}
											style={{
												marginTop: metrics.xl,
												marginBottom: metrics.sm,
											}}
											align="center"
										>
											<MIcon
												name="account-edit"
												color={fonts.colors.info}
												size={fonts.metrics.xxl}
											/>
											<Spacer horizontal size="xs" />
											<Txt
												style={{
													...layout.fontInterBold,
													color: config.colors.info,
													fontSize:
														config.fonts.metrics.lg,
												}}
											>
												Coach Notes
											</Txt>
										</Row>
									) : null}

									{!isEmpty(section?.member_notes) ? (
										<Row
											onPress={() =>
												handleNotesClick(
													'Member Notes',
													String(
														section.member_notes,
													),
												)
											}
											style={{
												marginVertical: metrics.rg,
											}}
										>
											<MIcon
												name="clipboard-outline"
												color={fonts.colors.info}
												size={fonts.metrics.xxl}
											/>
											<Spacer horizontal size="xs" />
											<Txt
												style={{
													...layout.fontInterBold,
													color: config.colors.info,
													fontSize:
														config.fonts.metrics.lg,
												}}
											>
												Member Notes
											</Txt>
										</Row>
									) : null}

									{section.scored && isAttend && (
										<Row>
											<Button
												title="Add Result"
												onPress={() =>
													submitScore(section)
												}
												labelStyle={styles.logResultBtn}
												style={
													styles.logResultBtnContainer
												}
												bold
											/>

											{section.is_leaderboard && (
												<TouchableOpacity
													onPress={() =>
														handleTabChange(
															SessionTabsEnum.RESULTS,
														)
													}
													style={styles.resultBtn}
												>
													<MIcon
														name="trophy"
														size={20}
														color={
															fonts.colors.light
														}
													/>
												</TouchableOpacity>
											)}
										</Row>
									)}
								</View>
							)}
						</View>
						{index === sections.length - 1 && (
							<Spacer size="h2" key={index} />
						)}
					</>
				);
			})
		);
	}, [sections, toggledSections, isAttend]);

	if (Array.isArray(sections)) {
		if (sections.length > 0) {
			return (
				<View style={layout.flex_1}>
					<ScrollView
						contentContainerStyle={styles.sectionsContainer}
						refreshing={Boolean(refreshing)}
						onRefresh={handleRefresh}
					>
						{renderSections()}
					</ScrollView>

					<TouchableOpacity
						activeOpacity={0.8}
						onPress={handleToggleAllSections}
						style={styles.floatingActionBtn}
					>
						<MIcon
							name={
								toggledSections.length > 0
									? 'chevron-double-up'
									: 'chevron-double-down'
							}
							color={fonts.colors.light}
							size={fonts.metrics.xl}
						/>
					</TouchableOpacity>

					<Modal
						animationType="fade"
						transparent
						visible={videoModalActive}
					>
						<View style={styles.videoModal}>
							<Card
								// eslint-disable-next-line react-native/no-inline-styles
								style={{
									width: isVideoLoading ? null : '100%',
									height: isVideoLoading
										? 100
										: Constant.DEVICEHEIGHT / 2,
								}}
							>
								{isVideoLoading && (
									<>
										<Loader size={50} color="brand" />
										<Spacer size="sm" />
										<Text>Loading Video..</Text>
									</>
								)}

								<WebView
									javaScriptEnabled
									domStorageEnabled
									allowsFullscreenVideo
									allowsInlineMediaPlayback
									mediaPlaybackRequiresUserAction={false}
									onLoadEnd={handleVideoOnLoaded}
									onError={handleVideoOnError}
									source={{
										uri: `https://www.youtube.com/embed/${videoUrlCode}?loop=1`,
									}}
								/>
							</Card>

							{!isVideoLoading && (
								<Button
									onPress={handleCloseVideo}
									title="Close Video"
									style={styles.handleVideoCloseBtn}
								/>
							)}
						</View>
					</Modal>
				</View>
			);
		}
		return (
			<WarningText text="This Session doesn't currently have a Workout Programmed" />
		);
	}
	return <WarningText text={sections} />;
};

export default SessionsSectionsTab;

const styles = StyleSheet.create({
	sectionsContainer: {},
	floatingActionBtn: {
		...layout.shadowMedium,
		height: 40,
		width: 40,
		borderRadius: 40,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		bottom: metrics.md,
		right: metrics.md,
		backgroundColor: fonts.colors.brand,
	},
	warningTxt: {
		color: '#595959',
		textAlign: 'center',
		fontSize: 16,
	},
	sessionContainer: {
		paddingHorizontal: 20,
		paddingBottom: 10,
	},
	sessionHeaderContainer: {
		borderColor: '#F2F2F2',
		borderWidth: 1,
		marginHorizontal: config.metrics.rg,
		marginBottom: config.metrics.rg,
		...layout.shadowLight,
	},
	sessionHeaderComponent: {
		padding: 20,
	},
	grayedContainer: {
		backgroundColor: '#F5F5F5',
	},
	badgeStyle: {
		padding: 5,
		borderRadius: 8,
		color: fonts.colors.light,
		backgroundColor: fonts.colors.brand,
		minWidth: 75,
		textAlign: 'center',
		right: -10,
	},
	embedYoutube: {
		height: 200,
		marginVertical: metrics.sm,
		marginBottom: metrics.lg,
	},
	movementSpacing: {
		width: '80%',
	},
	logResultBtn: {
		fontSize: fonts.metrics.sm,
	},
	logResultBtnContainer: {
		height: 40,
		flex: 1,
	},
	videoModal: {
		backgroundColor: 'rgba(0,0,0,0.3)',
		flex: 1,
		padding: 15,
		justifyContent: 'center',
		alignItems: 'center',
	},
	handleVideoCloseBtn: {
		width: '100%',
		marginTop: config.fonts.metrics.sm,
	},
	resultBtn: {
		backgroundColor: config.colors.brand,
		borderRadius: 6,
		marginLeft: 5,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 15,
	},
	coachOnlyContainer: {
		alignItems: 'flex-end',
	},
});
