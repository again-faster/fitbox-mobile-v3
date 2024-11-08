import useAuth from '@/auth/hooks/useAuth';
import {
	Avatar,
	Card,
	KeyboardSpacer,
	Row,
	Spacer,
	Text,
} from '@/components/atoms';
import { Modal } from '@/components/molecules';
import {
	commentScore,
	getScoreApplauses,
	getScoreComments,
	getScoreDetails,
} from '@/services/leaderboards';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import resources from '@/theme/resources';
import {
	ApplicationScreenProps,
	DashboardStackNavigatorProps,
	ScoreCommentsParams,
} from '@/types/navigation';
import {
	ApplauseDataType,
	ScoreCommentsDataType,
	ScoreDetailsDataType,
} from '@/types/schemas/leaderboards';
import { Constant, Say } from '@/utils';
import { isEmpty } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import {
	ActivityIndicator,
	ImageSourcePropType,
	Keyboard,
	Platform,
	RefreshControl,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Reactions } from '../ClassResultsScreen/components/ResultRow';
import { CommentItem, GIFList } from './components';

type ReactionsType = {
	[key: string]: number;
};
type State = {
	loading: boolean;
	tab: string;
	commentValue: string;
	comments: ScoreCommentsDataType[];
	loadingComments: boolean;
	applause: ApplauseDataType[];
	loadingApplause: boolean;
	score_info: ScoreDetailsDataType | null;
	reactions: ReactionsType;
	showComments: boolean;
	currentReaction: string | null;
};

const ScoreCommentsScreen = ({
	route,
	navigation,
}: DashboardStackNavigatorProps | ApplicationScreenProps) => {
	const [state, setState] = useState<State>({
		loading: true,
		tab: 'likes',
		commentValue: '',
		comments: [],
		loadingComments: true,
		applause: [],
		loadingApplause: true,
		score_info: null,
		reactions: {},
		showComments: false,
		currentReaction: '',
	});
	const {
		showComments,
		score_id: scoreId,
		type,
	}: {
		showComments: boolean;
		score_id: number;
		type: string;
	} = route.params as ScoreCommentsParams;

	const { user } = useAuth();
	const [toggleGIF, setToggleGIF] = useState<boolean>(false);
	const [gifUrl, setGIFUrl] = useState<string>('');
	const commentScrollViewRef = useRef<ScrollView>(null);
	const [showReactions, setShowReactions] = useState<boolean>(false);

	useEffect(() => {
		fetchDetails();
	}, []);

	const handleComment = async (score_id: number, comment: string) => {
		const payload = {
			score_id,
			comment,
		};

		const res = await commentScore(payload);

		if (!res.error) {
			fetchComments();
		} else {
			Say.err('Something went wrong');
		}
	};

	const fetchDetails = () => {
		getScoreDetails(scoreId)
			.then(res => {
				setState(prevState => ({
					...prevState,
					tab: type,
					showComments,
					score_info: res.data,
					loading: false,
				}));
				fetchApplause(res.data.score_id);
				fetchComments(res.data.score_id);
			})
			.catch(() => {
				Say.err('Something went wrong Here!');
			});
	};

	const fetchApplause = (id?: number) => {
		setState(prevState => ({ ...prevState, loadingApplause: true }));

		getScoreApplauses(id || (state.score_info?.score_id as number))
			.then(res => {
				const reactions: ReactionsType = {};
				Object.keys(resources.react).forEach(key => {
					reactions[key] = 0;
				});

				let currentReaction: string | null = null;
				[...res.data].forEach(({ applause_type, user_id }) => {
					reactions[applause_type] += 1;
					if (user_id === user?.user_data.user_id) {
						currentReaction = applause_type;
					}
				});

				setState(prevState => ({
					...prevState,
					applause: res.data,
					loadingApplause: false,
					reactions,
					currentReaction,
				}));
			})
			.catch(() => {
				Say.err('Something went wrong!');
				return [];
			});
	};

	const fetchComments = (id?: number) => {
		setState(prevState => ({ ...prevState, loadingComments: true }));

		getScoreComments(id || (state.score_info?.score_id as number))
			.then(res => {
				setState(prevState => ({
					...prevState,
					comments: res.data,
					loadingComments: false,
				}));
			})
			.catch(() => {
				Say.err('Something went wrong!');
				return [];
			})
			.finally(() =>
				commentScrollViewRef.current?.scrollToEnd({ animated: true }),
			);
	};

	const submitComment = async () => {
		Keyboard.dismiss();
		setToggleGIF(false);
		const { score_info: scoreInfo, commentValue } = state;

		const comment = !isEmpty(gifUrl)
			? `${commentValue}\n${gifUrl}`
			: commentValue;

		await handleComment(scoreInfo?.score_id as number, comment);
		fetchComments();
		setGIFUrl('');
		setState(prevState => ({ ...prevState, commentValue: '' }));
	};

	const renderComments = (commentsList: ScoreCommentsDataType[]) =>
		commentsList.length ? (
			commentsList.map((comment, index) => (
				<CommentItem key={index} {...comment} right={index % 2 === 0} />
			))
		) : (
			<Text
				size="lg"
				center
				color="darkgray"
				style={{ marginTop: config.metrics.xs }}
			>
				No comments yet
			</Text>
		);

	const renderCommentsTab = () => {
		const commentDisabled = state.commentValue === '' && gifUrl === '';

		return (
			<>
				<ScrollView
					ref={commentScrollViewRef}
					onContentSizeChange={() =>
						commentScrollViewRef.current?.scrollToEnd({
							animated: true,
						})
					}
					showsVerticalScrollIndicator
					contentContainerStyle={{
						paddingHorizontal: config.metrics.md,
					}}
					refreshControl={
						<RefreshControl
							colors={[config.colors.brand]}
							refreshing={state.loadingComments}
							onRefresh={fetchComments}
						/>
					}
				>
					{/* <Spacer /> */}

					<Spacer />
					{renderComments(state.comments)}
				</ScrollView>
				{toggleGIF && (
					<GIFList
						setToggleGIF={setToggleGIF}
						setGIFUrl={setGIFUrl}
					/>
				)}
				<Row style={styles.commentFieldContainer}>
					<Avatar
						source={state.score_info?.profile_image}
						size={30}
					/>
					<Spacer horizontal />
					<TouchableOpacity onPress={() => setToggleGIF(!toggleGIF)}>
						<MIcon
							name="file-gif-box"
							size={config.metrics.xl}
							color={config.colors.brand}
						/>
					</TouchableOpacity>
					<Spacer horizontal size="sm" />

					<View style={layout.flex_1}>
						<TextInput
							style={{
								fontSize: config.fonts.metrics.md,
								color: config.fonts.colors.dark,
							}}
							placeholder="Add your comment"
							multiline
							numberOfLines={3}
							value={state.commentValue}
							onChangeText={value =>
								setState(prevState => ({
									...prevState,
									commentValue: value,
								}))
							}
							allowFontScaling={false}
						/>
					</View>
					<TouchableOpacity
						onPress={() => void submitComment()}
						disabled={commentDisabled}
					>
						<Text
							size="lg"
							color={commentDisabled ? 'lightgrey' : 'info'}
						>
							Post
						</Text>
					</TouchableOpacity>
				</Row>
			</>
		);
	};

	const renderApplause = (applauseList: ApplauseDataType[]) =>
		applauseList.length > 0 ? (
			applauseList.map((data, index) => {
				return (
					<Row
						key={index}
						style={{
							marginHorizontal: config.metrics.sm,
							marginBottom: config.metrics.lg,
						}}
						align="center"
					>
						<Avatar
							key={index}
							source={data.profile_image as ImageSourcePropType}
							size={30}
						/>
						<Spacer horizontal size="rg" />
						<Text size="rg" color="darkgray" style={layout.flex_1}>
							{`${data.firstname} ${data.lastname}`}
						</Text>
						<Text size="xl">
							{
								resources.react[
									data.applause_type as keyof Reactions
								]
							}
						</Text>
					</Row>
				);
			})
		) : (
			<Text
				center
				size="lg"
				color="darkgray"
				style={{ marginTop: config.metrics.xl }}
			>
				No reactions yet
			</Text>
		);

	const renderApplauseTab = () => {
		return (
			<ScrollView
				showsVerticalScrollIndicator
				contentContainerStyle={{ paddingHorizontal: config.metrics.sm }}
			>
				<Spacer />
				{renderApplause(state.applause)}
			</ScrollView>
		);
	};

	return state.loading ? (
		<View style={styles.loadingContainer}>
			<ActivityIndicator size="large" color={config.colors.brand} />
		</View>
	) : (
		<View style={layout.flex_1}>
			<View style={styles.scoreHeaderStyle}>
				<Row align="center">
					<Avatar
						key={state.score_info?.user_id}
						source={state.score_info?.profile_image}
						size={50}
					/>
					<Spacer horizontal size="lg" />
					<Text size="lg" color="darkgray" bold style={layout.flex_1}>
						{`${state.score_info?.firstname} ${state.score_info?.lastname}`}
					</Text>
					<Text size="md" color="darkgray">
						{state.score_info?.value} (
						{state.score_info?.score_type})
					</Text>
				</Row>
				<Row style={{ paddingTop: config.metrics.rg }}>
					<View style={layout.flex_1}>
						{state.applause.length > 0 ? (
							<TouchableOpacity
								onPress={() => setShowReactions(true)}
							>
								<Row style={styles.applauseTypes}>
									{Object.entries(state.reactions).map(
										([key, value]) => (
											<View key={key}>
												{value > 0 && (
													<Row
														align="flex-end"
														style={{
															marginRight:
																config.metrics
																	.xs,
														}}
													>
														<Text size="lg">
															{
																resources.react[
																	key as keyof Reactions
																]
															}
														</Text>
														<Text size="sm">
															{value}
														</Text>
													</Row>
												)}
											</View>
										),
									)}
								</Row>
							</TouchableOpacity>
						) : (
							<Text size="md">No reactions yet</Text>
						)}
					</View>
					<View style={styles.commentsLabel}>
						<Text size="md">
							Comments ({state.comments.length})
						</Text>
					</View>
				</Row>
			</View>
			<Modal visible={showReactions}>
				<View style={styles.modalContainer}>
					<TouchableWithoutFeedback
						onPress={() => setShowReactions(false)}
					>
						<View
							style={
								styles.reactionsModalTouchableWithoutFeedback
							}
						/>
					</TouchableWithoutFeedback>
					<Card style={styles.modalStyle}>{renderApplauseTab()}</Card>
				</View>
			</Modal>
			{renderCommentsTab()}
			{Platform.OS === 'ios' && (
				<KeyboardSpacer
					heightDeduction={
						navigation.getState().routes[0]?.name === 'Main'
							? 0
							: 70
					}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	scoreHeaderStyle: {
		paddingHorizontal: config.metrics.lg,
		paddingTop: config.metrics.lg,
		paddingBottom: config.metrics.rg,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: config.backgrounds.lightgrey,
		color: config.backgrounds.darkgray,
	},
	applauseTypes: {
		alignSelf: 'flex-start',
		marginTop: config.metrics.rg,
	},
	commentFieldContainer: {
		paddingHorizontal: config.metrics.lg,
		paddingVertical:
			Platform.OS === 'android' ? config.metrics.sm : config.metrics.lg,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderColor: config.backgrounds.lightgrey,
		alignItems: 'center',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
	},
	justifyCenter: {
		justifyContent: 'center',
	},
	clapImage: {
		height: 45,
		width: 45,
	},
	justifyFlexEnd: {
		justifyContent: 'flex-end',
	},
	commentsImage: {
		height: 40,
		width: 40,
	},
	modalContainer: {
		flex: 1,
		padding: 18,
		backgroundColor: 'rgba(0,0,0,.3)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	reactionsModalTouchableWithoutFeedback: {
		flex: 1,
		width: '100%',
	},
	modalStyle: {
		width: '100%',
		position: 'absolute',
		top: '28%',
		maxHeight: Constant.DEVICEHEIGHT / 2,
	},
	commentsLabel: {
		flex: 1,
		alignItems: 'flex-end',
		justifyContent: 'flex-end',
	},
});

export default ScoreCommentsScreen;
