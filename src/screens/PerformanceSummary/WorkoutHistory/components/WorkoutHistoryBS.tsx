import { Row, Spacer, Text } from '@/components/atoms';
import { Loader } from '@/components/molecules';
import OneRMComponent from '@/components/molecules/WODPastPerformance/components/OneRMComponent';
import ScoreDisplayFormat from '@/components/molecules/WODPastPerformance/components/ScoreDisplayFormat';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import {
	GetPastPerformanceResultSchemaType,
	PastPerformanceResultSchemaType,
} from '@/types/schemas/leaderboards';
import BottomSheet, {
	BottomSheetScrollView,
	BottomSheetView,
} from '@gorhom/bottom-sheet';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import moment from 'moment';
import { Dispatch, RefObject, SetStateAction } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type ScoresData = PastPerformanceResultSchemaType & {
	wod_score_id: boolean;
};

interface WorkoutHistoryBSProps {
	sheetRef: RefObject<BottomSheetMethods>;
	sheetIndex: number;
	results: GetPastPerformanceResultSchemaType;
	setSheetIndex: Dispatch<SetStateAction<number>>;
	bottomOffset: number;
	isLoading: boolean;
	title: string;
	scoringBy: string;
}

const WorkoutHistoryBS = ({
	sheetRef,
	sheetIndex,
	setSheetIndex,
	results,
	bottomOffset,
	isLoading,
	title,
	scoringBy,
}: WorkoutHistoryBSProps) => {
	const renderScoresData = (data: ScoresData[]) =>
		Array(data).length &&
		data
			.sort((a, b) => moment(b.date_input).diff(moment(a.date_input)))
			.map((values, index) => {
				const notes = values.comments ? values.comments : values.notes;
				return (
					<Row
						spacing="space-between"
						style={{ marginBottom: config.metrics.lg }}
						key={index}
					>
						<View style={layout.flex_1}>
							<ScoreDisplayFormat data={values} />
							{notes ? (
								<Text
									size="rg"
									color="darkgray"
									style={{ marginTop: config.metrics.sm }}
								>
									{notes}
								</Text>
							) : null}
						</View>
						<Text size="rg" color="darkgray">
							{values.date_input
								? moment(values.date_input).format(
										'DD MMM YYYY',
									)
								: moment(values.created_at).format(
										'DD MMM YYYY',
									)}
						</Text>
					</Row>
				);
			});

	const renderSectionScores = () => {
		const showResults: ScoresData[] = [];

		results.section_scores?.forEach(res => {
			showResults.push({
				...res,
				wod_score_id: true,
			});
		});

		if (showResults.length) {
			return (
				<View style={styles.scoreContainerStyle}>
					{renderScoresData(showResults)}
				</View>
			);
		}

		throw new Error('No section scores');
	};

	const renderMovementScores = () => {
		const userMovement = results.user_movement; // use user_movement if scored by 'movement'
		const showResults: Record<string, PastPerformanceResultSchemaType[]> =
			{};

		userMovement?.forEach(d => {
			// Changed from map to forEach
			const slug = (d.movement_name || '').replace(/ /g, '_');

			if (slug !== '') {
				if (!showResults[slug]) {
					showResults[slug] = [];
				}

				showResults[slug]!.push(d);
			}
		});

		if (Object.keys(showResults).length) {
			throw new Error('No movement scores');
		}

		const oneRMs: Record<
			string,
			PastPerformanceResultSchemaType['one_rm']
		> = {};

		Object.keys(showResults).forEach(movement_type => {
			if (showResults[movement_type]) {
				showResults[movement_type]!.forEach(mov => {
					if (mov.one_rm && !oneRMs[movement_type]) {
						oneRMs[movement_type] = mov.one_rm;
					}
				});
			}
		});

		// return false;
		return Object.entries(showResults).map(([movement, showMovements]) => {
			const hasData = showMovements.some(d => d.scored && d.isResult);

			return (
				<View key={movement} style={styles.scoreContainerStyle}>
					<Text
						size="lg"
						bold
						color="darkgray"
						transform="capitalize"
					>
						{movement.replace(/_/g, ' ').trim()}
					</Text>

					<Spacer size="sm" />

					{oneRMs[movement]?.weight && (
						<OneRMComponent
							weight={oneRMs[movement]?.weight as number}
						/>
					)}

					{hasData || oneRMs[movement] ? (
						renderScoresData(showMovements.splice(0, 5))
					) : (
						<Text size="rg" color="darkgray">
							No results yet
						</Text>
					)}
				</View>
			);
		});
	};

	const renderResults = () => {
		try {
			if (scoringBy === 'section') return renderSectionScores();
			if (scoringBy === 'movement') return renderMovementScores();
			return null;
		} catch (error) {
			return (
				<Text center size="md" color="darkgray">
					History Unavailable
				</Text>
			);
		}
	};

	const isSheetOpened = sheetIndex === 1;
	return (
		<BottomSheet
			ref={sheetRef}
			index={sheetIndex}
			snapPoints={[bottomOffset, '100%']}
			onChange={setSheetIndex}
			handleComponent={null}
			backgroundStyle={styles.bottomSheetContainer}
			enableContentPanningGesture={!isSheetOpened}
			enableDynamicSizing={false}
		>
			<BottomSheetView style={layout.flex_1}>
				<Row
					align="center"
					spacing="space-between"
					style={{
						paddingHorizontal: config.metrics.md,
						paddingVertical: config.metrics.md,
					}}
				>
					<Text size="md" bold>
						{isSheetOpened ? title : 'History'}
					</Text>

					<Row
						align="center"
						onPress={() =>
							sheetRef.current?.snapToIndex(isSheetOpened ? 0 : 1)
						}
					>
						{isSheetOpened ? (
							<Icon
								name="plus"
								size={20}
								color={config.fonts.colors.info}
							/>
						) : (
							<Icon
								name="chevron-up"
								size={20}
								color={config.fonts.colors.info}
							/>
						)}
						<Text size="md" color="info">
							{isSheetOpened ? 'Add' : 'View Scores'}
						</Text>
					</Row>
				</Row>

				{isLoading ? (
					<View style={styles.loaderContainer}>
						<Loader size={config.metrics.xl} />
					</View>
				) : (
					<BottomSheetScrollView
						style={{ paddingHorizontal: config.metrics.rg }}
					>
						{renderResults()}
					</BottomSheetScrollView>
				)}
			</BottomSheetView>
		</BottomSheet>
	);
};

export default WorkoutHistoryBS;

const styles = StyleSheet.create({
	movementInfo: {
		marginTop: config.metrics.sm,
		marginBottom: config.metrics.md,
		marginHorizontal: 5,
		borderRadius: 4,
		paddingHorizontal: 8,
		paddingVertical: 5,
	},
	bottomSheetContainer: {
		borderRadius: 0,
		borderTopWidth: 1,
		borderColor: config.fonts.colors.gray200,
	},
	loaderContainer: {
		position: 'absolute',
		bottom: config.metrics.lg,
		left: 0,
		right: 0,
		top: 0,
		justifyContent: 'center',
		alignItems: 'center',
	},
	scoreContainerStyle: {
		paddingHorizontal: config.metrics.sm,
		marginBottom: config.metrics.xl,
	},
});
