import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';
import { navigate } from '@/navigators/NavigationRef';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { MemberFeatureGate, MemberSurfaceGate } from './MemberFeatureGate';

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

	it.each(['Session', 'Bookings'] as const)(
		'guards the %s route with the classes feature',
		route => {
			const isEnabled = mockFeatureEnabled(false);

			render(
				<MemberSurfaceGate route={route}>
					<Text>{route} content</Text>
				</MemberSurfaceGate>,
			);

			expect(isEnabled).toHaveBeenCalledWith('classes');
			expect(screen.queryByText(`${route} content`)).toBeNull();
			expect(screen.getByText('Feature unavailable')).toBeTruthy();
		},
	);

	it('renders an enabled class surface', () => {
		const isEnabled = mockFeatureEnabled(true);

		render(
			<MemberSurfaceGate route="Session">
				<Text>enabled session</Text>
			</MemberSurfaceGate>,
		);

		expect(isEnabled).toHaveBeenCalledWith('classes');
		expect(screen.getByText('enabled session')).toBeTruthy();
	});

	it('does not class-gate Training Today', () => {
		const isEnabled = mockFeatureEnabled(false);

		render(
			<MemberSurfaceGate route="TrainingToday">
				<Text>assigned workout</Text>
			</MemberSurfaceGate>,
		);

		expect(isEnabled).not.toHaveBeenCalled();
		expect(screen.getByText('assigned workout')).toBeTruthy();
	});
});
