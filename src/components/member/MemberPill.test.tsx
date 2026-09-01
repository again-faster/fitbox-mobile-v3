import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { memberTheme } from '@/theme/member';

import MemberPill from './MemberPill';

describe('MemberPill', () => {
	it('uses violet for selected state and keeps the button accessible', () => {
		const onPress = jest.fn();
		const { getByRole, getByText } = render(
			<MemberPill label="Month" selected onPress={onPress} />,
		);
		const button = getByRole('button', { name: 'Month' });

		expect(button).toHaveStyle({
			backgroundColor: memberTheme.colors.primary,
		});
		expect(button).toHaveAccessibilityState({ selected: true });
		expect(getByText('Month')).toHaveStyle({
			color: memberTheme.colors.surface,
		});

		fireEvent.press(button);

		expect(onPress).toHaveBeenCalledTimes(1);
	});
});
