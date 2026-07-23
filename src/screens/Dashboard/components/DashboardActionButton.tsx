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
	const stringHasOneWord = text.split(' ').length === 1;
	return (
		<TouchableRipple onPress={onPress} style={styles.container}>
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
						numberOfLines={stringHasOneWord ? 1 : 2}
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
		width: '48%',
		borderWidth: 1,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surface,
		flexWrap: 'wrap',
		padding: memberTheme.spacing.sm,
		borderRadius: memberTheme.radius.md,
		justifyContent: 'center',
		minHeight: 72,
		marginBottom: memberTheme.spacing.md,
		...memberTheme.shadow,
	},
	tileTextContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	tileIconContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: memberTheme.spacing.sm,
		width: 40,
		height: 40,
		borderRadius: memberTheme.radius.sm,
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	tileContainer: {
		flexDirection: 'row',
	},
	tileText: {
		flex: 1,
		textAlign: 'left',
		color: memberTheme.colors.primaryInk,
	},
});
