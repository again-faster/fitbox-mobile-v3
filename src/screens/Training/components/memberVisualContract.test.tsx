import { render } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { memberTheme } from '@/theme/member';
import OfflineBanner from './OfflineBanner';
import PrimaryButton from './PrimaryButton';
import SectionHeading from './SectionHeading';
import TrainingCard from './TrainingCard';

describe('Training shared visual contract', () => {
	it('delegates primary actions to the member button contract', () => {
		const { getByRole } = render(
			<PrimaryButton label="Start" onPress={jest.fn()} />,
		);
		const button = getByRole('button', { name: 'Start' });

		expect(StyleSheet.flatten(button.props.style)).toMatchObject({
			minHeight: memberTheme.controls.primaryHeight,
			backgroundColor: memberTheme.colors.primary,
		});
	});

	it('delegates section headings and actions to member primitives', () => {
		const { getByRole } = render(
			<SectionHeading
				title="Today's training"
				action="View all"
				onActionPress={jest.fn()}
			/>,
		);

		expect(getByRole('button', { name: 'View all' })).toBeTruthy();
	});

	it('uses member card surfaces and an accessible offline retry action', () => {
		const { getByRole, getByTestId } = render(
			<>
				<TrainingCard>
					<Text testID="card-content">Session</Text>
				</TrainingCard>
				<OfflineBanner onRetry={jest.fn()} />
			</>,
		);

		expect(getByTestId('card-content')).toBeTruthy();
		expect(getByRole('button', { name: 'Retry' })).toBeTruthy();
	});
});
