import { StyleSheet, View } from 'react-native';

import { Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import {
	GetPastPerformanceResultType,
	PastPerformanceResultType,
} from '@/types/schemas/leaderboards';
import { SessionSectionSchemaType } from '@/types/schemas/session';
import moment from 'moment';
import { Key, useCallback } from 'react';
import Loader from '../Loader/Loader';
import OneRMComponent from './components/OneRMComponent';
import ScoreDisplayFormat from './components/ScoreDisplayFormat';

type WODPastPerformanceProps = {
	isLoading: boolean;
	section: SessionSectionSchemaType;
	results: GetPastPerformanceResultType;
};

const WODPastPerformance = ({
	isLoading,
	section,
	results,
}: WODPastPerformanceProps) => {
	const ErrorDisplayText = (
		<Text center size="md" style={styles.emptyText}>
			History Unavailable
		</Text>
	);

	const renderScoresData = useCallback(
		(data: PastPerformanceResultType[]) => {
			if (!data || !data.length) return null;

			return data
				.sort((a, b) => moment(b.date_input).diff(moment(a.date_input)))
				.map((values, index: Key | null | undefined) => {
					const notes = values.comments || values.notes;

					return (
						<Row
							spacing="space-between"
							style={styles.resultRow}
							key={index}
						>
							<View style={layout.flex_1}>
								<ScoreDisplayFormat data={values} />

								{notes ? (
									<Text size="rg" style={styles.notes}>
										{notes}
									</Text>
								) : null}
							</View>
							<Text size="rg" style={styles.dateText}>
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
		},
		[],
	);

	const renderSectionScores = useCallback(() => {
		const { section_scores: scores } = results;

		const showResults =
			scores?.map(res => ({ ...res, wod_score_id: true })) || [];

		// remove the scored false
		showResults.filter(d => d.scored);
		if (showResults.length) {
			return (
				<View style={styles.scoreContainerStyle}>
					{renderScoresData(showResults)}
				</View>
			);
		}

		return ErrorDisplayText;
	}, [results]);

	const renderMovementScores = useCallback(() => {
		const { user_movement: userMov = [] } = results;
		const showResults: {
			[key: string]: PastPerformanceResultType[];
		} = {};
		if (userMov.length) {
			userMov.forEach(d => {
				const slug = d.movement_name!.replace(/ /g, '_');
				if (slug) {
					if (!showResults[slug]) showResults[slug] = [];
					showResults[slug]!.push(d);
				}
			});
		} else {
			return ErrorDisplayText;
		}

		const oneRMs: { [key: string]: { weight: number } } = {};

		Object.keys(showResults).forEach(movement_type => {
			showResults[movement_type]!.forEach(mov => {
				if (mov.one_rm && !oneRMs[movement_type]) {
					oneRMs[movement_type] = mov.one_rm as unknown as {
						weight: number;
					};
				}
			});
		});

		return Object.keys(showResults).map(movement => {
			const showMovements = showResults[movement] || [];
			const hasData = showMovements.some(d => d.scored && d.isResult);
			return (
				<View key={movement} style={styles.scoreContainerStyle}>
					<Text
						size="lg"
						bold
						color="darkgray"
						style={styles.movementHeaderStyle}
					>
						{movement.replace(/_/g, ' ').trim()}
					</Text>
					<Spacer size="sm" />

					{oneRMs[movement] && (
						<OneRMComponent
							weight={oneRMs[movement]?.weight as number}
						/>
					)}

					{hasData || oneRMs[movement] ? (
						renderScoresData(showMovements)
					) : (
						<Text size="rg" color="darkgray">
							No results yet
						</Text>
					)}
				</View>
			);
		});
	}, [results]);

	if (isLoading) {
		return <Loader />;
	}

	const scoreBy = section?.scoring_by || '';
	return (
		<View
			style={{
				paddingVertical: config.metrics.md,
				paddingHorizontal: config.metrics.sm,
			}}
		>
			{scoreBy === 'section' ? renderSectionScores() : null}
			{scoreBy === 'movement' ? renderMovementScores() : null}
		</View>
	);
};

const styles = StyleSheet.create({
	scoreContainerStyle: {
		padding: memberTheme.spacing.lg,
		marginBottom: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.md,
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	movementHeaderStyle: {
		textTransform: 'capitalize',
		color: memberTheme.colors.text,
	},
	resultRow: {
		marginBottom: memberTheme.spacing.lg,
	},
	notes: {
		marginTop: memberTheme.spacing.sm,
		color: memberTheme.colors.textMuted,
	},
	dateText: {
		color: memberTheme.colors.textMuted,
	},
	emptyText: {
		marginTop: memberTheme.spacing.xl,
		color: memberTheme.colors.textMuted,
	},
});

export default WODPastPerformance;
