import { useTheme } from '@/theme';
import { RefreshControl, ScrollView as SV } from 'react-native';

interface ScrollViewProps extends React.ComponentProps<typeof SV> {
	onRefresh?: () => void;
	children: React.ReactNode;
	refreshing?: boolean;
}

const ScrollView = ({
	onRefresh,
	children,
	refreshing,
	...props
}: ScrollViewProps) => {
	const { colors } = useTheme();

	const refreshControl = (
		<RefreshControl
			colors={[colors.brand]}
			refreshing={!!refreshing}
			onRefresh={onRefresh}
		/>
	);

	return (
		<SV
			{...props}
			refreshControl={onRefresh && refreshControl}
			showsVerticalScrollIndicator={false}
			overScrollMode="never"
		>
			{children}
		</SV>
	);
};

ScrollView.defaultProps = {
	onRefresh: undefined,
	refreshing: false,
};

export default ScrollView;
