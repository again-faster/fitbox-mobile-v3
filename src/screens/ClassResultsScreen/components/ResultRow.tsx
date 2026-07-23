import { Avatar, Row, Spacer, Text } from '@/components/atoms';
import { navigate } from '@/navigators/NavigationRef';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
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
	const hideRxSwitch = section.scoring_by === 'movement';
	const isScoreByComplete = section.scoring_type_id === 3;

	const isPR = !!isPr;

	const showValue = () => {
		let retVal: string;
		switch (section.scoring_type_id) {
			case 8:
				retVal = `${value} + ${reps}`;
				break;
			case 3:
				retVal = 'Completed';
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
	const allReactions = Object.entries(resources.react);

	const tooltipPopupActive =
		activeResultIndex === rowIndex && activeSectionIndex === sectionIndex;

	const containerStyle = {
		...styles.dataRow,
		borderBottomWidth: !last ? 0.5 : 0,
		backgroundColor: isPR
			? memberTheme.colors.surfaceSoft
			: memberTheme.colors.surface,
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
						hideRxSwitch,
					})
				}
			>
				<Row>
					<Avatar key={userID} source={profileImage} size={55} />
					<Spacer horizontal size="sm" />
					<View style={styles.textContainer}>
						<Row style={layout.flex_1}>
							<Text
								size="md"
								bold
								numberOfLines={1}
								style={styles.titleStyle}
							>
								{`${firstname} ${lastname}`}
							</Text>
							<Spacer horizontal />
							<View style={styles.commentStyle}>
								{showComments ? (
									<>
										<Spacer horizontal />

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
									</>
								) : null}
							</View>
						</Row>
						<Row style={styles.bottomRowContainer}>
							<Text numberOfLines={1} style={styles.scoreText}>
								{hideRxSwitch &&
									!isScoreByComplete &&
									'Score: '}
								{showValue()}
								{!hideRxSwitch &&
									` (${(scoreType as string).slice(0, 2)})`}
							</Text>
							<View style={styles.reactionsContainer}>
								<Row style={styles.reactionsStyle}>
									{renderPopupReact(
										tooltipPopupActive,
										allReactions,
										onClickReact,
									)}
									{reactionCounts.length > 0 &&
										reactionCounts.map(
											(
												{
													reaction,
													count,
													isApplauded,
												},
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
																	? config
																			.metrics
																			.rg
																	: config
																			.metrics
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
																	resources
																		.react[
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
																bold={
																	!!isApplauded
																}
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
												onEmoteClick(
													rowIndex,
													sectionIndex,
												)
											}
										>
											<Image
												source={
													resources.icon.addReaction
												}
												style={styles.addReactionStyle}
											/>
										</TouchableOpacity>
									)}
								</Row>
							</View>
						</Row>
					</View>
				</Row>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	dataRow: {
		paddingHorizontal: memberTheme.spacing.lg,
		paddingVertical: memberTheme.spacing.md,
		borderColor: memberTheme.colors.border,
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
		backgroundColor: memberTheme.colors.surface,
		...memberTheme.shadow,
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
		backgroundColor: memberTheme.colors.surface,
		...memberTheme.shadow,
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
		justifyContent: 'space-between',
		flex: 1,
	},
	bottomRowContainer: {
		justifyContent: 'space-between',
		alignItems: 'flex-end',
	},
	reactionsContainer: {
		alignItems: 'flex-end',
		justifyContent: 'flex-end',
	},
	titleStyle: {
		maxWidth: '82%',
		color: memberTheme.colors.text,
	},
	scoreText: {
		color: memberTheme.colors.textMuted,
		fontWeight: '600',
	},
});

export default ResultRow;
