import { Avatar, Row, Spacer, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import resources from '@/theme/resources';
import { SectionType } from '@/types/schemas/leaderboards';
import { Constant } from '@/utils';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

type Props = {
	rowIndex: number;
	onApplause: (
		score_id: number,
		reaction?: string,
		currentReaction?: string | null,
	) => Promise<void>;
	sectionIndex: number;
	activeSectionIndex: number;
	activeResultIndex: number;
	onEmoteClick: (rowIndex: number, sectionIndex: number) => void;
	showComments: boolean;
	last: boolean;
	section: SectionType;
	is_PR: unknown;
	value?: string;
	reps: string | number;
	applause_type: string | null;
	applaused_type: string | null;
	user_id: string | number;
	profile_image: string;
	firstname: string;
	lastname: string;
	score_type: string | null;
	num_of_comments: number;
	score_id: number;
};

export type Reactions = {
	clap: string;
	fire: string;
	celebrate: string;
	fist: string;
	poo: string;
};

const ResultRow = (props: Props) => {
	const {
		rowIndex,
		onApplause,
		sectionIndex,
		activeResultIndex,
		activeSectionIndex,
		onEmoteClick,
		showComments,
		last,
		section,
		is_PR: isPr,
		value,
		reps,
		applause_type: applauseType,
		applaused_type: applausedType,
		user_id: userID,
		profile_image: profileImage,
		firstname,
		lastname,
		score_type: scoreType,
		num_of_comments: numOfComments,
		score_id: scoreId,
	} = props;

	// 17, 20 for load/aggregate
	const hideRxSwitch =
		section.scoring_by === 'movement' &&
		[17, 20].includes(section.scoring_type_id);

	const isPR = !!isPr;

	const showValue = () => {
		let retVal: string;
		switch (section.scoring_type_id) {
			case 8:
				retVal = `${value} + ${reps}`;
				break;

			default:
				retVal = value as string;
				break;
		}

		if (isPR) {
			retVal = `${retVal} (PR)`;
		}

		return retVal;
	};

	const reactions = applauseType ? applauseType.split('|') : [];
	const currentReaction = applausedType || null;
	const reactionCounts = reactions.map(reaction => {
		const reactionSplit = reaction.split(',');
		return {
			reaction: reactionSplit[0],
			count: reactionSplit[1],
			isApplauded: currentReaction === reactionSplit[0],
		};
	});

	const activeIcons = reactionCounts.map(({ reaction }) => reaction);
	const showReactions = Object.entries(resources.react).filter(
		([key]) => !activeIcons.includes(key),
	);
	const tooltipPopupActive =
		activeResultIndex === rowIndex && activeSectionIndex === sectionIndex;

	const containerStyle = {
		...styles.dataRow,
		borderBottomWidth: !last ? 0.5 : 0,
		backgroundColor: isPR ? '#FDDC5C' : 'transparent',
	};

	const onClickReact = async (reaction: string) => {
		await onApplause(scoreId, reaction, currentReaction);
		onEmoteClick(rowIndex, sectionIndex);
	};

	const renderPopupReact = (
		isActive: boolean,
		icons: [string, string][],
		onIconClick: (reaction: string) => Promise<void>,
	) => {
		return isActive ? (
			<View style={styles.tooltipContainer}>
				<View style={styles.tooltip}>
					<Row>
						{icons.map(([key, reaction]) => {
							return (
								<TouchableOpacity
									key={key}
									style={{
										marginHorizontal: config.metrics.rg,
									}}
									onPress={() => void onIconClick(key)}
								>
									<Text size="xl">{reaction}</Text>
								</TouchableOpacity>
							);
						})}
					</Row>
				</View>
			</View>
		) : null;
	};

	return (
		<View style={containerStyle}>
			<TouchableOpacity
				onPress={() =>
					navigate('ScoreComments', {
						score_id: scoreId,
						type: 'likes',
						showComments,
					})
				}
			>
				<Row>
					<Avatar key={userID} source={profileImage} size={55} />
					<Spacer horizontal size="sm" />
					<View style={styles.textContainer}>
						<Text
							size="md"
							color="darkgray"
							bold
							style={layout.flex_1}
							numberOfLines={1}
						>
							{`${firstname} ${lastname}`}
						</Text>

						<Text numberOfLines={1}>
							{hideRxSwitch && 'Score: '}
							{showValue()}
							{!hideRxSwitch &&
								` (${(scoreType as string).slice(0, 2)})`}
						</Text>
					</View>
					<Spacer horizontal size="sm" />
					<View style={styles.iconsContainer}>
						<View style={styles.commentStyle}>
							{showComments ? (
								<>
									<Spacer horizontal />
									<TouchableOpacity
										onPress={() =>
											navigate('ScoreComments', {
												score_id: scoreId,
												type: 'comments',
												showComments,
											})
										}
									>
										<Row align="flex-end">
											<Image
												source={
													numOfComments > 0
														? resources.icon
																.comments
														: resources.icon
																.commentso
												}
												style={{
													width: config.metrics.lg,
													height: config.metrics.lg,
												}}
											/>
											{numOfComments > 0 && (
												<>
													<Spacer
														horizontal
														size="xs"
													/>
													<Text>{numOfComments}</Text>
												</>
											)}
										</Row>
									</TouchableOpacity>
								</>
							) : null}
						</View>
						<Spacer size="xs" />
						<View style={styles.reactionsContainer}>
							<Row style={styles.reactionsStyle}>
								{renderPopupReact(
									tooltipPopupActive,
									showReactions,
									onClickReact,
								)}
								{reactionCounts.length > 0 &&
									reactionCounts.map(
										(
											{ reaction, count, isApplauded },
											index,
										) => {
											return (
												<TouchableOpacity
													key={reaction}
													style={{
														marginRight:
															index ===
															reactionCounts.length -
																1
																? config.metrics
																		.rg
																: config.metrics
																		.xs,
													}}
													onPress={() => {
														void onApplause(
															scoreId,
															reaction,
															currentReaction,
														);
													}}
												>
													<Row align="flex-end">
														<Text size="md">
															{
																resources.react[
																	reaction as keyof Reactions
																]
															}
														</Text>

														<Text
															size="sm"
															color={
																isApplauded
																	? 'info'
																	: 'darkgray'
															}
															bold={!!isApplauded}
														>
															{count}
														</Text>
													</Row>
												</TouchableOpacity>
											);
										},
									)}
								{showReactions.length > 0 && (
									<TouchableOpacity
										onPress={() =>
											onEmoteClick(rowIndex, sectionIndex)
										}
									>
										<Image
											source={resources.icon.addReaction}
											style={styles.addReactionStyle}
										/>
									</TouchableOpacity>
								)}
							</Row>
						</View>
					</View>
				</Row>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	dataRow: {
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderColor: config.backgrounds.lightgrey,
	},
	alignCenter: {
		alignItems: 'center',
	},
	tooltipContainer: {
		width: Constant.DEVICEWIDTH / 2,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'absolute',
		right: 60,
		top: '-150%',
		zIndex: 99999,
		flex: 1,
	},
	tooltip: {
		flexDirection: 'row',
		padding: 15,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'space-between',
		position: 'absolute',
		minWidth: 100,
		backgroundColor: 'white',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.23,
		shadowRadius: 2.62,
		elevation: 4,
	},
	closeToolTip: {
		alignItems: 'center',
		position: 'absolute',
		left: 2,
		top: '-190%',
		zIndex: 999999,
		flex: 1,
	},
	closeContainer: {
		flexDirection: 'row',
		padding: 2,
		borderRadius: 10,
		alignItems: 'center',
		backgroundColor: 'white',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.23,
		shadowRadius: 2.62,
		elevation: 4,
		left: 20,
		bottom: 20,
	},
	reactionsStyle: {
		flex: 5,
		flexWrap: 'wrap',
		alignItems: 'flex-end',
	},
	addReactionStyle: { width: 20, height: 20 },
	commentStyle: {
		alignItems: 'flex-end',
		paddingRight: 2,
	},
	textContainer: {
		flex: 3,
	},
	iconsContainer: {
		justifyContent: 'space-between',
	},
	reactionsContainer: {
		alignItems: 'flex-end',
		justifyContent: 'flex-end',
	},
});

export default ResultRow;
