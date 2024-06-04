import { Button, Row, ScrollView, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import {
	SessionDetailSchemaType,
	SessionSectionSchemaType,
	SessionWODMovementSchemaType,
} from '@/types/schemas/session';
import { Func, Say } from '@/utils';
import { isArray, isEmpty, parseInt } from 'lodash';
import { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import HTMLView from 'react-native-htmlview';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import WebView from 'react-native-webview';

const { metrics, fonts } = config;

// TODO: Move this to constant
const movementParams = [
	{ key: 'calories' },
	{ key: 'distance' },
	{ key: 'height' },
	{ key: 'weight' },
	{ key: 'time' },
];

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
}

const SessionsSectionsTab = ({ session }: SessionsSectionsTabProps) => {
	const isAttend = true;
	const [refreshing, setRefreshing] = useState(false);
	const [toggledSections, setToggledSections] = useState<number[]>([]);
	const [isVideoLoading, setIsVideoLoading] = useState(true);
	const [videoModalActive, setVideoModalActive] = useState(false);
	const [videoUrlCode, setVideoUrlCode] = useState('');

	// eslint-disable-next-line no-console
	console.log('justatest', {
		setRefreshing,
		isVideoLoading,
		videoModalActive,
		videoUrlCode,
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
		// TODO: Implement this once the WebView screen is available
		// navigate('WebView', {
		// 	title: title,
		// 	html: content + '<br/><br/>', // workaround for scrolling issues
		// });

		Say.ok(content, `${title} coming soon!`);
	};

	const submitScore = () => {
		Say.ok('submitScore coming soon!');
		// TODO: Implement this
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

				return (
					<View
						key={section.id}
						style={[index % 2 === 0 && styles.grayedContainer]}
					>
						<TouchableOpacity
							onPress={() => handleToggleSection(index)}
							style={styles.sessionHeaderComponent}
						>
							<Row align="center">
								<Text size="lg" bold style={layout.flex_1}>
									{section.name}
								</Text>
								<Row style={layout.relative}>
									{staffOnly && (
										<Text
											size="sm"
											bold
											style={styles.badgeStyle}
										>
											Coach Only
										</Text>
									)}
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
							</Row>
						</TouchableOpacity>

						{isSectionToggled && (
							<View style={styles.sessionContainer}>
								{section.scoring_type &&
									section.scoring_by === 'section' && (
										<Text size="md" color="mute">
											{section.scoring_type.name}
										</Text>
									)}

								<Row>
									{section.sets !== 0 &&
										section.sets != null && (
											<Text size="md" color="mute">
												{section.sets} Set(s){' '}
											</Text>
										)}
									{section.rounds !== 0 &&
										section.rounds != null && (
											<Text size="md" color="mute">
												{section.rounds} Round(s){' '}
											</Text>
										)}
									{section.reps !== '' && (
										<Text size="md" color="mute">
											{' '}
											{section.reps} reps
										</Text>
									)}
								</Row>

								{section.duration !== 0 &&
									section.duration != null && (
										<Text size="md" color="mute">
											{section.duration} min(s)
										</Text>
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
									<>
										<Spacer size="rg" />
										<HTMLView
											value={String(section.text_section)}
										/>
									</>
								) : null}

								{useWodMovements.length > 0 ? (
									<Spacer size="rg" />
								) : null}

								{useWodMovements.map((movement, key) => {
									const { notes, reps } = movement;
									const movementDetails = movement.movement;

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
											<Row spacing="space-between">
												<Row
													style={
														styles.movementSpacing
													}
												>
													<Text
														size="lg"
														bold
														color="info"
													>
														{reps}
													</Text>
													<Spacer
														size="sm"
														horizontal
													/>
													<Text size="lg" bold>
														{movementDetails.name}
													</Text>
												</Row>

												{!isEmpty(videoUrl) && (
													<TouchableOpacity
														style={[
															styles.floatRightBtn,
														]}
														onPress={() =>
															handlePlayVideo(
																videoUrl,
															)
														}
													>
														<MIcon
															name="play-circle-outline"
															color={
																fonts.colors
																	.brand
															}
															size={
																fonts.metrics
																	.xxl
															}
														/>
													</TouchableOpacity>
												)}
											</Row>

											{section.scoring_type &&
												section.scoring_by ===
													'movement' && (
													<Text
														size="md"
														color="mute"
													>
														{
															section.scoring_type
																.name
														}
													</Text>
												)}

											{movementParams.map(mov_param => {
												if (mov_param.key === 'time') {
													return (
														parseInt(
															String(
																movement[
																	mov_param
																		.key
																],
															),
														) > 0 && (
															<Text
																key={
																	mov_param.key
																}
																size="md"
																color="mute"
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
															</Text>
														)
													);
												}

												// Destructure and obtain the gender-specific height and unit only once
												const maleHeight = String(
													movement[
														`${mov_param.key}_male` as keyof SessionWODMovementSchemaType
													],
												);
												const femaleHeight = String(
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
												) => height.replace('.00', '');

												// Compute content only once and store it in a variable
												const content =
													parseInt(maleHeight, 10) >
													0 ? (
														<Text
															key={mov_param.key}
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
											})}

											{notes !== '' && notes != null && (
												<Text
													size="md"
													style={{
														marginTop: metrics.rg,
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
									>
										<MIcon
											name="account-edit"
											color={fonts.colors.info}
											size={fonts.metrics.xxl}
										/>
										<Spacer horizontal size="xs" />
										<Text color="info" size="lg" bold>
											Coach Notes
										</Text>
									</Row>
								) : null}

								{!isEmpty(section?.member_notes) ? (
									<Row
										onPress={() =>
											handleNotesClick(
												'Member Notes',
												String(section.member_notes),
											)
										}
										style={{ marginBottom: metrics.rg }}
									>
										<MIcon
											name="clipboard-outline"
											color={fonts.colors.info}
											size={fonts.metrics.xxl}
										/>
										<Spacer horizontal size="xs" />
										<Text color="info" size="lg" bold>
											Member Notes
										</Text>
									</Row>
								) : null}

								{section.scored && isAttend && (
									<>
										<Spacer />
										<Button
											variant="info"
											title="Log Result"
											onPress={() => submitScore()}
											labelStyle={styles.logResultBtn}
										/>
									</>
								)}
							</View>
						)}
					</View>
				);
			})
		);
	}, [sections, toggledSections]);

	if (Array.isArray(sections)) {
		if (sections.length > 0) {
			return (
				<View style={layout.flex_1}>
					<ScrollView
						contentContainerStyle={styles.sectionsContainer}
						refreshing={Boolean(refreshing)}
						onRefresh={() => {}}
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
		padding: 20,
		paddingTop: 0,
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
		overflow: 'hidden',
		color: fonts.colors.light,
		backgroundColor: fonts.colors.brand,
		position: 'absolute',
		top: -23,
		right: 5,
	},
	embedYoutube: {
		height: 200,
		marginVertical: metrics.sm,
	},
	movementSpacing: {
		width: '80%',
	},
	floatRightBtn: {
		zIndex: 1,
		position: 'absolute',
		right: 5,
		top: 6,
	},
	logResultBtn: {
		paddingVertical: fonts.metrics.sm,
	},
});
