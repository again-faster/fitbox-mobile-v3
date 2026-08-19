import { fireEvent, render } from '@testing-library/react-native';
import TrainingTabBar from './TrainingTabBar';

const navigation = {
	replace: jest.fn(),
} as unknown as { replace: jest.Mock };

describe('TrainingTabBar', () => {
	beforeEach(() => jest.clearAllMocks());

	it('renders the ordered visible tabs with accessible selection state', () => {
		const { getByRole, queryByRole } = render(
			<TrainingTabBar
				visibleTabs={['today', 'progress', 'more']}
				selectedTab="progress"
				navigation={navigation as never}
			/>,
		);

		expect(getByRole('tab', { name: 'Today' })).toBeTruthy();
		expect(getByRole('tab', { name: 'Progress' })).toHaveAccessibilityState({
			selected: true,
		});
		expect(queryByRole('tab', { name: 'Readiness' })).toBeNull();
	});

	it('replaces the current route when a peer tab is selected', () => {
		const { getByRole } = render(
			<TrainingTabBar
				visibleTabs={['today', 'progress', 'more']}
				selectedTab="today"
				navigation={navigation as never}
			/>,
		);

		fireEvent.press(getByRole('tab', { name: 'More' }));

		expect(navigation.replace).toHaveBeenCalledWith('TrainingMore');
	});

	it('renders no rail when Today is the only visible destination', () => {
		const { queryByRole } = render(
			<TrainingTabBar
				visibleTabs={['today']}
				selectedTab="today"
				navigation={navigation as never}
			/>,
		);

		expect(queryByRole('tab')).toBeNull();
	});
});
