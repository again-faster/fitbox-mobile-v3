import { Text } from '@/components/atoms';
import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import { Dimensions, StyleSheet } from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');
const { metrics } = config;

interface DashboardActionButtonProps {
	onPress: () => void;
	text: string;
	icon: string;
}

const DashboardActionButton = ({
	onPress,
	text,
	icon,
}: DashboardActionButtonProps) => {
	const { colors } = useTheme();

	return (
		<TouchableRipple
			onPress={onPress}
			style={[styles.container, { borderColor: colors.gray }]}
		>
			<>
				<Icon name={icon} size={metrics.lg} color={colors.brand} />
				<Text size="md" color="brand" bold>
					{text}
				</Text>
			</>
		</TouchableRipple>
	);
};

export default DashboardActionButton;

const styles = StyleSheet.create({
	container: {
		paddingVertical: metrics.md,
		minWidth: width / 2.4,
		marginBottom: metrics.md,
		gap: 8,
		justifyContent: 'center',
		borderWidth: 1,
		paddingHorizontal: 8,
		borderRadius: 4,
	},
});
