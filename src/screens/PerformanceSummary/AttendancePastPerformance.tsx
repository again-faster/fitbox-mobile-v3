import { Avatar, Row, Spacer, Text } from '@/components/atoms';
import OneRMComponent from '@/components/molecules/WODPastPerformance/components/OneRMComponent';
import { navigationRef } from '@/navigators/NavigationRef';
import { getOneRMsBySessionSection } from '@/services/leaderboards';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ApplicationScreenProps } from '@/types/navigation';
import { WorkoutType } from '@/types/schemas/leaderboards';
import {
	SessionDetailSchemaType,
	SessionSectionSchemaType,
} from '@/types/schemas/session';
import { Say } from '@/utils';
import { isArray, sortBy } from 'lodash';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import MIcon from 'react-native-vector-icons/MaterialCommunityIcons';

type UserScores = {
	firstname: string;
	lastname: string;
	value: string;
	image: string | undefined;
	id: number;
};

const AttendancePastPerformance = ({ route }: ApplicationScreenProps) => {
	const [workouts, setWorkouts] = useState<WorkoutType[]>([]);
	const [activeWorkout, setActiveWorkout] = useState<WorkoutType>();
	const [showWorkouts, setShowWorkouts] = useState(false);
	const [userScores, setUserScores] = useState<UserScores[]>([]);
	const [displayUserScores, setDisplayUserScores] = useState<UserScores[]>(
		[],
	);

	const [scoresLoading, setScoresLoading] = useState<boolean>(false);

	const [percent, setPercent] = useState<number>(100);

	const { params } = route;
	const session =
		params && 'session' in params
			? // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
				(params.session as SessionDetailSchemaType)
			: ({} as SessionDetailSchemaType);

	const sections: {
		movementId: number | null;
		name: string;
		sectionId: number | null;
		scoringTypeId: number;
		id: number | null;
	}[] = [];

	if (session?.sections && isArray(session.sections)) {
		session.sections.map((item: SessionSectionSchemaType) => {
			if (
				item.wod_movements &&
				item.wod_movements?.length > 0 &&
				item.scoring_type_id === 20 // For Load
			) {
				if (item.wod_movements && item.wod_movements.length > 0) {
					item.wod_movements.map(movement => {
						return sections.push({
							movementId: movement.movement.id,
							name: movement.movement.name,
							sectionId: item.id,
							scoringTypeId: item.scoring_type_id as number,
							id: movement.id,
						});
					});
				} else {
					const base = {
						movementId: null,
						sectionId: item.id,
						name: item.name,
						scoringTypeId: item.scoring_type_id as number,
						id: null,
					};
					return sections.push(base);
				}
			}
			return null;
		});
	} else {
		void Say.okThen('No sections found in the session.').then(() => {
			navigationRef.goBack();
		});
	}

	const users = session.member_attendance.map(item => item.user);

	useEffect(() => {
		setWorkouts(sections);
		setActiveWorkout(sections[0] || null);
	}, []);

	useEffect(() => {
		const scoresData = userScores;
		const results: {
			firstname: string;
			lastname: string;
			value: string;
			image: string | undefined;
			id: number;
		}[] = [];

		scoresData.forEach(score => {
			const newScore = Number.isNaN(Number(score.value))
				? '-'
				: `${(Number(score.value) * (percent / 100))
						.toFixed(2)
						.replace(/\.00$/, '')}`;
			results.push({
				...score,
				value: newScore,
			});
		});

		setDisplayUserScores(results);
	}, [percent]);

	const getScores = () => {
		setScoresLoading(true);

		getOneRMsBySessionSection(activeWorkout?.sectionId || 0, session.id)
			.then(res => {
				if (!res.error) {
					if (res.data) {
						const results: {
							firstname: string;
							lastname: string;
							value: string;
							image: string | undefined;
							id: number;
						}[] = [];

						users.forEach(user => {
							const oneRMData = res.data.find(
								item =>
									item.user_id === user.id &&
									item.movement_id ===
										activeWorkout?.movementId,
							);
							if (oneRMData) {
								results.push({
									firstname: user.firstname,
									lastname: user.lastname,
									value: oneRMData.weight || '-',
									image: user.profile_image,
									id: user.id,
								});
							}
						});

						setUserScores(results);
						setDisplayUserScores(results);
					}
				}
			})
			.catch(err => Say.err((err as string) || 'Failed to fetch scores'))
			.finally(() => setScoresLoading(false));
	};

	useEffect(() => {
		if (workouts.length > 0 && activeWorkout) {
			void getScores();
		}
	}, [activeWorkout]);

	const renderWorkoutDropDown = () => {
		return (
			<View style={styles.dropdownContainer}>
				<TouchableOpacity
					style={styles.headerContainer}
					onPress={() => setShowWorkouts(!showWorkouts)}
				>
					<Row align="center">
						<Text bold numberOfLines={1} style={layout.flex_1}>
							{activeWorkout?.name}
						</Text>
						<MIcon
							name={showWorkouts ? 'chevron-up' : 'chevron-down'}
							size={config.metrics.xl}
							color={config.backgrounds.darkgray}
						/>
					</Row>
				</TouchableOpacity>
				{showWorkouts && (
					<View style={styles.headerOptionsContainer}>
						{workouts.map(workout => {
							const isMovement = workout?.movementId !== null;
							const isActive = isMovement
								? workout?.movementId !==
									activeWorkout?.movementId
								: workout.sectionId !==
									activeWorkout?.sectionId;

							return (
								<TouchableOpacity
									key={
										isMovement
											? workout?.movementId
											: workout.sectionId
									}
									onPress={() => {
										if (isMovement) {
											if (
												activeWorkout?.movementId !==
												workout?.movementId
											) {
												setActiveWorkout(workout);
											}
										} else if (
											activeWorkout?.sectionId !==
											workout.sectionId
										) {
											setActiveWorkout(workout);
										}
										setShowWorkouts(false);
									}}
								>
									<Row>
										<Text
											style={{
												paddingVertical:
													config.metrics.sm,
												...layout.flex_1,
											}}
										>
											{workout?.name}
										</Text>
										{!isActive && (
											<MIcon
												name="check"
												size={config.metrics.lg}
												color={
													config.backgrounds.darkgray
												}
											/>
										)}
									</Row>
								</TouchableOpacity>
							);
						})}
					</View>
				)}
			</View>
		);
	};

	const renderLeaderboard = ({
		item,
	}: {
		item: {
			firstname: string;
			lastname: string;
			value: string;
			image: string | undefined;
		};
	}) => {
		return (
			<Row style={styles.detailsContainer}>
				<View style={styles.avatarCon}>
					<Avatar
						source={item.image}
						style={styles.avatarStyle}
						size={43}
					/>
				</View>
				<Spacer horizontal size="xs" />
				<View style={styles.attendanceListNameCon}>
					<Text numberOfLines={1}>
						{item.firstname} {item.lastname}
					</Text>
				</View>
				<View style={styles.bestScoreContainer}>
					<Text bold numberOfLines={1}>
						{`${item.value} ${item.value === '-' ? '' : 'kg'} `}
					</Text>
				</View>
			</Row>
		);
	};

	return (
		<View
			style={{
				...layout.flex_1,
				marginTop: config.metrics.md,
				marginHorizontal: config.metrics.md,
			}}
		>
			{renderWorkoutDropDown()}
			{scoresLoading ? (
				<View style={[layout.flex_1, layout.justifyCenter]}>
					<ActivityIndicator
						size="small"
						color={config.colors.brand}
					/>
				</View>
			) : (
				<>
					<Spacer size="lg" />
					<OneRMComponent
						weight={0}
						noHeader
						initialPercentage={100}
						setPercentage={setPercent}
					/>
					<FlatList
						renderItem={renderLeaderboard}
						data={sortBy(displayUserScores, item =>
							item.firstname.toLowerCase(),
						)}
					/>
				</>
			)}
		</View>
	);
};

export default AttendancePastPerformance;

const styles = StyleSheet.create({
	headerContainer: {
		paddingLeft: config.metrics.md,
		borderWidth: 1,
		borderColor: '#c4c4c4',
		height: 35,
	},
	headerOptionsContainer: {
		position: 'absolute',
		top: 35,
		paddingHorizontal: config.metrics.md,
		paddingVertical: config.metrics.sm,
		borderWidth: 1,
		borderColor: '#eee',
		zIndex: 10,
		backgroundColor: '#fff',
		width: '100%',
	},
	avatarStyle: {
		borderRadius: 35,
		overflow: 'hidden',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: config.fonts.colors.lightgrey,
	},
	avatarCon: {
		width: 36,
		alignItems: 'center',
	},
	attendanceListNameCon: {
		width: '55%',
	},
	detailsContainer: {
		paddingHorizontal: config.metrics.sm,
		paddingVertical: config.metrics.sm,
		alignItems: 'center',
	},
	bestScoreContainer: {
		flex: 1,
		alignItems: 'flex-end',
	},
	dropdownContainer: {
		zIndex: 9999,
	},
});
