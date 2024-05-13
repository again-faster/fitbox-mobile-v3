import { Row, Spacer, Text } from '@/components/atoms';
import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { StyleSheet, View } from 'react-native';
import { Card } from 'react-native-paper';

import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface MenuOptionProps {
	name: string;
	icon: string;
	fontAwesome?: boolean;
	onPress: () => void;
	showOptionBadge?: boolean;
	hide?: boolean;
}

const MenuOption = ({
	name,
	icon,
	onPress,
	fontAwesome,
	showOptionBadge,
	hide,
}: MenuOptionProps) => {
	const { fonts } = useTheme();

	const useColor = String(fonts.gray400.color);
	return (
		<Card
			onPress={onPress}
			style={[
				styles.optionContainer,
				{ backgroundColor: fonts.light.color },
				hide && layout.hide,
			]}
		>
			<Row
				spacing="space-between"
				style={[layout.itemsCenter, styles.optionMainContainer]}
			>
				<Row style={layout.itemsCenter}>
					<View style={styles.optionIconContainer}>
						{fontAwesome ? ( // Check if using FontAwesome5 Icon
							<FontAwesomeIcon
								name={icon}
								color={useColor}
								style={styles.optionIcon}
								size={25}
							/>
						) : (
							<Ionicons
								name={icon}
								color={useColor}
								style={styles.optionIcon}
								size={30}
							/>
						)}
					</View>
					<Spacer horizontal size="sm" />
					<Text size="lg" color="black">
						{name}
					</Text>
				</Row>

				<Ionicons
					name="chevron-forward-outline"
					color={useColor}
					size={config.fonts.metrics.sm}
				/>
			</Row>

			{/* {showOptionBadge && <BadgeNumber offset={7} />} */}
			{showOptionBadge && <Text>Badge</Text>}
		</Card>
	);
};

MenuOption.defaultProps = {
	fontAwesome: false,
	showOptionBadge: false,
	hide: false,
};

export default MenuOption;

const styles = StyleSheet.create({
	optionMainContainer: {
		padding: 10,
	},
	optionContainer: {
		margin: config.metrics.md,
		marginBottom: 0,
	},
	optionIconContainer: {
		height: config.fonts.metrics.md,
		justifyContent: 'center',
	},
	optionIcon: {
		width: 32,
		height: 32,
		textAlign: 'center',
		verticalAlign: 'middle',
	},
});
