import { Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import { memberTheme } from '@/theme/member';
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
	return (
		<TouchableRipple
			onPress={onPress}
			style={styles.container}
			accessibilityRole="button"
			accessibilityLabel={text}
		>
			<View style={styles.tileContainer}>
				<View style={styles.tileIconContainer}>
					<Icon
						name={icon}
						size={metrics.lg}
						color={memberTheme.colors.primary}
					/>
				</View>

				<View style={styles.tileTextContainer}>
					<Text
						size="md"
						bold
						numberOfLines={2}
						style={styles.tileText}
					>
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
		width: '100%',
		borderWidth: 1,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surfaceSoft,
		padding: memberTheme.spacing.md,
		borderRadius: memberTheme.radius.md,
		justifyContent: 'center',
		minHeight: 104,
		...memberTheme.shadow,
	},
	tileTextContainer: {
		width: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},
	tileIconContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: memberTheme.spacing.sm,
		width: 44,
		height: 44,
		borderRadius: memberTheme.radius.sm,
		backgroundColor: memberTheme.colors.surface,
	},
	tileContainer: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	tileText: {
		textAlign: 'center',
		color: memberTheme.colors.primaryInk,
	},
});
