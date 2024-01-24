import { Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import { Dimensions, StyleSheet } from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width } = Dimensions.get('window');
const { colors, metrics } = config;

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
	return (
		<TouchableRipple onPress={onPress} style={styles.container}>
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
		borderColor: colors.gray,
		minWidth: width / 2.4,
		marginBottom: metrics.md,
		gap: 8,
		justifyContent: 'center',
		borderWidth: 1,
		paddingHorizontal: 8,
		borderRadius: 4,
	},
});
