import { Row, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import { PastPerformanceResultType } from '@/types/schemas/leaderboards';
import Icon from 'react-native-vector-icons/Feather';

type ScoreDisplayFormatProps = {
	data: PastPerformanceResultType;
};

const ScoreDisplayFormat = ({ data }: ScoreDisplayFormatProps) => {
	switch (data.scoring_type_id) {
		case 3: // Complete
			return (
				<Icon
					name={data.completed ? 'check' : 'x'}
					size={config.fonts.metrics.xl}
					color={config.fonts.colors.darkgray}
				/>
			);
		case 6: // For Time
			return (
				<Text size="md" color="darkgray">
					{(data.wod_score_id ? data.value! : data.time!).replace(
						'.',
						':',
					)}{' '}
					minutes
				</Text>
			);
		case 8: // AMRAP
			return data.wod_score_id ? (
				<Row spacing="space-between">
					<Row>
						<Text size="md" color="darkgray" bold>
							{data.value}{' '}
						</Text>
						<Text size="md" color="darkgray">
							rounds{' '}
						</Text>
						<Text size="md" color="darkgray" bold>
							{!data.reps || data.reps === '0'
								? 1
								: data.reps ?? data?.wod_score_reps}{' '}
						</Text>
						<Text size="md" color="darkgray">
							reps
						</Text>
					</Row>
					{!data.wod_score_id && `${data.time}`.includes('.') && (
						<Text size="md" color="darkgray">
							: {data.time!.replace('.', ':')} minutes
						</Text>
					)}
				</Row>
			) : (
				<Row spacing="space-between">
					<Row>
						<Text size="md" color="darkgray" bold>
							{data.reps}{' '}
						</Text>
						<Text size="md" color="darkgray">
							rounds
						</Text>
					</Row>
					{!data.wod_score_id && `${data.time}`.includes('.') && (
						<Text size="md" color="darkgray">
							: {data.time!.replace('.', ':')} minutes
						</Text>
					)}
				</Row>
			);
		case 9: //  AMReP
			return (
				<Row spacing="space-between">
					<Row>
						<Text size="md" color="darkgray" bold>
							{data.wod_score_id ? data.value : data.reps}{' '}
						</Text>
						<Text size="md" color="darkgray">
							reps
						</Text>
					</Row>
					{!data.wod_score_id && `${data.time}`.includes('.') && (
						<Text size="md" color="darkgray">
							: {data.time!.replace('.', ':')} minutes
						</Text>
					)}
				</Row>
			);
		case 10: // Total Weight
			return (
				<Row>
					<Text size="md" color="darkgray">
						{data.rounds ? data.rounds : data.sets} x{' '}
						{data.reps === '0' ? 1 : data.reps} =
					</Text>
					<Text size="md" color="darkgray" bold>
						{' '}
						{data.wod_score_id
							? data.value
							: `${data.weight} ${
									data.weight_unit ? data.weight_unit : ''
							  }`}
					</Text>
				</Row>
			);
		case 15: // Most Distance
			return data.wod_score_id ? (
				<Text size="md" color="darkgray">
					Distance: {data.value}
				</Text>
			) : (
				<Text size="md" color="darkgray" bold>
					{data.distance} {data.distance_unit}
				</Text>
			);
		case 20: {
			// For Load
			const weight = data?.weight ?? data.value;
			return (
				<Row>
					<Text size="md" color="darkgray">
						{data.rounds ?? data.sets ?? 1} x{' '}
						{data.reps === '0' ? 1 : data.reps} @
					</Text>
					<Text size="md" color="darkgray" bold>
						{` ${weight} ${data.weight_unit || 'kg'}`}
					</Text>
				</Row>
			);
		}
		case 34: // Calories
			return (
				<Row spacing="space-between">
					<Row>
						<Text size="md" color="darkgray" bold>
							{data.wod_score_id ? data.value : data.calories}{' '}
						</Text>
						<Text size="md" color="darkgray">
							Calories{' '}
						</Text>
					</Row>
				</Row>
			);
		default:
			return (
				<Text size="md" color="darkgray">
					{data.value ? data.value : 'Data unavailable'}
				</Text>
			);
	}
};

export default ScoreDisplayFormat;
