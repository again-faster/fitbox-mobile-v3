import { Text } from '@/components/atoms';
import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import { StyleSheet, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome5';

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
			style={[styles.container, { borderColor: colors.brand }]}
		>
			<View style={styles.tileContainer}>
				<View style={styles.tileIconContainer}>
					<Icon name={icon} size={metrics.lg} color={colors.brand} />
				</View>
				<View style={styles.tileTextContainer}>
					<Text size="md" color="brand" bold numberOfLines={2}>
						{text}
					</Text>
				</View>
			</View>
		</TouchableRipple>
	);
};

export default DashboardActionButton;

const styles = StyleSheet.create({
	container: {
		paddingVertical: metrics.sm,
		width: '48%',
		marginBottom: metrics.md,
		gap: 8,
		borderWidth: 1,
		paddingHorizontal: 7,
		borderRadius: 4,
		justifyContent: 'center',
		height: 55,
	},
	tileTextContainer: {
		flex: 4,
	},
	tileIconContainer: {
		flex: 1,
	},
	tileContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
});
