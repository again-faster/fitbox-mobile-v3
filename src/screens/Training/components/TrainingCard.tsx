import type { PropsWithChildren } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { MemberCard } from '@/components/member';
import { memberTheme } from '@/theme/member';

type Props = PropsWithChildren<{
	style?: StyleProp<ViewStyle>;
	accent?: 'primary' | 'success' | 'warning';
}>;

const accentColor = {
	primary: memberTheme.colors.primary,
	success: memberTheme.colors.success,
	warning: memberTheme.colors.warning,
};

const TrainingCard = ({ children, style, accent }: Props) => (
	<MemberCard
		style={[
			accent
				? { borderLeftColor: accentColor[accent], borderLeftWidth: 4 }
				: null,
			style,
		]}
		elevated={false}
	>
		{children}
	</MemberCard>
);

export default TrainingCard;
