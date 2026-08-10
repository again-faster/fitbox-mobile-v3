import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { memberTheme } from '@/theme/member';
import MemberButton from './MemberButton';
import MemberCard from './MemberCard';
import MemberScreen from './MemberScreen';
import MemberSection from './MemberSection';
import MemberStatusPill from './MemberStatusPill';
import MemberText from './MemberText';

describe('member UI primitives', () => {
	it('renders semantic typography from the canonical roles', () => {
		const { getByText } = render(<MemberText role="screenTitle">Training</MemberText>);

		expect(StyleSheet.flatten(getByText('Training').props.style)).toMatchObject(
			memberTheme.typography.screenTitle,
		);
	});

	it('renders a primary member button with the minimum touch target', () => {
		const { getByRole } = render(<MemberButton label="Save" onPress={jest.fn()} />);
		const button = getByRole('button', { name: 'Save' });

		expect(button.props.accessibilityState).toMatchObject({ disabled: false });
		expect(StyleSheet.flatten(button.props.style)).toMatchObject({
			minHeight: memberTheme.controls.primaryHeight,
			backgroundColor: memberTheme.colors.primary,
		});
	});

	it('supports outlined and disabled button states', () => {
		const onPress = jest.fn();
		const { getByRole } = render(
			<MemberButton label="Delete" variant="danger" disabled onPress={onPress} />,
		);
		const button = getByRole('button', { name: 'Delete' });

		expect(button.props.accessibilityState).toMatchObject({ disabled: true });
		fireEvent.press(button);
		expect(onPress).not.toHaveBeenCalled();
	});

	it('exposes member screen gutters and content container styling', () => {
		const { getByTestId } = render(
			<MemberScreen testID="member-screen" contentContainerStyle={{ paddingTop: 8 }}>
				<MemberText>Content</MemberText>
			</MemberScreen>,
		);

		expect(StyleSheet.flatten(getByTestId('member-screen').props.style)).toMatchObject({
			backgroundColor: memberTheme.colors.background,
		});
	});

	it('renders an accessible section action with the minimum touch target', () => {
		const { getByRole } = render(
			<MemberSection title="Progress" actionLabel="View all" onActionPress={jest.fn()} />,
		);
		const action = getByRole('button', { name: 'View all' });

		expect(StyleSheet.flatten(action.props.style)).toMatchObject({
			minHeight: memberTheme.controls.minTouchTarget,
		});
	});

	it('maps status pills to semantic colors and accessible labels', () => {
		const { getByLabelText } = render(<MemberStatusPill label="Ready" status="success" />);
		const pill = getByLabelText('Ready');

		expect(StyleSheet.flatten(pill.props.style)).toMatchObject({
			backgroundColor: memberTheme.colors.successSoft,
		});
	});

	it('supports member card variants with tokenized spacing', () => {
		const { getByText } = render(
			<MemberCard title="Today" subtitle="Workout">
				<MemberText>Session</MemberText>
			</MemberCard>,
		);

		expect(getByText('Today')).toBeTruthy();
		expect(getByText('Workout')).toBeTruthy();
	});
});
