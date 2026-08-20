import { memberTheme } from '@/theme/member';
import type { ComponentProps } from 'react';
import { StyleSheet, Text as RNText } from 'react-native';

export type MemberTextRole =
	| 'display'
	| 'screenTitle'
	| 'sectionTitle'
	| 'body'
	| 'label'
	| 'meta'
	| 'button';

type MemberTextProps = Omit<ComponentProps<typeof RNText>, 'role'> & {
	variant?: MemberTextRole;
	muted?: boolean;
};

const MemberText = ({
	variant = 'body',
	muted = false,
	style,
	...props
}: MemberTextProps) => (
	<RNText
		{...props}
		style={[styles.base, styles[variant], muted && styles.muted, style]}
	/>
);

const styles = StyleSheet.create({
	base: {
		color: memberTheme.colors.text,
	},
	display: memberTheme.typography.display,
	screenTitle: memberTheme.typography.screenTitle,
	sectionTitle: memberTheme.typography.sectionTitle,
	body: memberTheme.typography.body,
	label: memberTheme.typography.label,
	meta: memberTheme.typography.meta,
	button: memberTheme.typography.button,
	muted: {
		color: memberTheme.colors.textMuted,
	},
});

export default MemberText;
