import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';
import { navigate } from '@/navigators/NavigationRef';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { MemberFeatureGate } from './MemberFeatureGate';

jest.mock('@/context/WorkoutStudioProvider');
jest.mock('@/navigators/NavigationRef', () => ({
	navigate: jest.fn(),
}));
jest.mock(
	'react-native-vector-icons/MaterialCommunityIcons',
	() => 'MaterialCommunityIcon',
);

const mockedUseWorkoutStudio = jest.mocked(useWorkoutStudio);
const mockedNavigate = jest.mocked(navigate);

const mockFeatureEnabled = (enabled: boolean) => {
	const isEnabled = jest.fn(() => enabled);
	mockedUseWorkoutStudio.mockReturnValue({
		isEnabled,
	} as unknown as ReturnType<typeof useWorkoutStudio>);
	return isEnabled;
};

describe('MemberFeatureGate', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('replaces disabled deep-linked content with the approved safe state', () => {
		const isEnabled = mockFeatureEnabled(false);

		render(
			<MemberFeatureGate feature="results">
				<Text>secret results</Text>
			</MemberFeatureGate>,
		);

		expect(isEnabled).toHaveBeenCalledWith('results');
		expect(screen.queryByText('secret results')).toBeNull();
		expect(screen.getByText('Feature unavailable')).toBeTruthy();
		expect(
			screen.getByText(
				"Your gym hasn't enabled this feature for members.",
			),
		).toBeTruthy();
	});

	it('returns to Training Today from the disabled state', () => {
		mockFeatureEnabled(false);
		render(
			<MemberFeatureGate feature="results">
				<Text>secret results</Text>
			</MemberFeatureGate>,
		);

		fireEvent.press(screen.getByRole('button'));

		expect(mockedNavigate).toHaveBeenCalledWith('Main', {
			screen: 'TrainingStack',
			params: { screen: 'TrainingToday' },
		});
	});

	it('renders content when the feature is enabled', () => {
		mockFeatureEnabled(true);

		render(
			<MemberFeatureGate feature="results">
				<Text>enabled results</Text>
			</MemberFeatureGate>,
		);

		expect(screen.getByText('enabled results')).toBeTruthy();
		expect(screen.queryByText('Feature unavailable')).toBeNull();
	});

	it('renders explicitly allowed content when the feature is disabled', () => {
		mockFeatureEnabled(false);

		render(
			<MemberFeatureGate feature="custom_workouts" allow>
				<Text>sponsored builder</Text>
			</MemberFeatureGate>,
		);

		expect(screen.getByText('sponsored builder')).toBeTruthy();
		expect(screen.queryByText('Feature unavailable')).toBeNull();
	});
});
