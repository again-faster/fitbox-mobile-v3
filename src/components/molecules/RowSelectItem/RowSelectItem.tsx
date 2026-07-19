import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Row from '../../atoms/Row/Row';
import Spacer from '../../atoms/Spacer/Spacer';
import Text from '../../atoms/Text/Text';

const { fonts } = config;

type SelectGymItemProps = {
	id: number;
	image: string;
	onPress: () => void;
	text: string;
	selected: boolean;
	subtitle?: string;
};

const RowSelectItem = ({
	id,
	image,
	onPress,
	text,
	selected,
	subtitle,
}: SelectGymItemProps) => (
	<TouchableOpacity
		key={id}
		style={styles.container}
		activeOpacity={0.6}
		onPress={onPress}
		accessibilityRole="button"
		accessibilityLabel={text}
		accessibilityHint="Switches to this profile"
	>
		<Row style={layout.flex_1} align="center">
			<View
				style={{
					backgroundColor: fonts.colors.gray,
					...styles.imageStyle,
					...styles.imageSize,
				}}
			>
				{image ? (
					<Image
						style={styles.imageSize}
						source={{
							uri: image,
							headers: {
								Pragma: 'no-cache',
							},
						}}
					/>
				) : (
					<Icon
						name="account-outline"
						size={fonts.metrics.xxl}
						color={memberTheme.colors.primaryDeep}
					/>
				)}
			</View>
			<Spacer horizontal size="sm" />
			<View style={styles.copyContainer}>
				<Text size="lg" bold style={styles.textStyle}>
					{text}
				</Text>
				{subtitle ? (
					<Text style={styles.subtitle}>{subtitle}</Text>
				) : null}
			</View>
		</Row>

		{selected && ( // show check if current gym
			<Icon name="check" style={styles.selectedIcon} />
		)}
		{!selected && <Icon name="chevron-right" style={styles.chevronIcon} />}
	</TouchableOpacity>
);

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		padding: memberTheme.spacing.md,
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderRadius: memberTheme.radius.md,
		borderWidth: 1,
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: memberTheme.spacing.sm,
		minHeight: 72,
	},
	copyContainer: { flex: 1 },
	textStyle: {
		maxWidth: '80%',
		fontSize: 15,
		color: memberTheme.colors.ink,
	},
	subtitle: {
		color: memberTheme.colors.textMuted,
		fontSize: 12,
		marginTop: memberTheme.spacing.xs,
	},
	imageSize: {
		width: 50,
		height: 50,
	},
	imageStyle: {
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: memberTheme.radius.sm,
		overflow: 'hidden',
	},
	badgeStyle: {
		position: 'absolute',
		right: 5,
		top: 5,
		backgroundColor: fonts.colors.danger,
		color: fonts.colors.light,
	},
	selectedIcon: {
		fontSize: fonts.metrics.lg,
		color: fonts.colors.info,
	},
	chevronIcon: { color: memberTheme.colors.textMuted, fontSize: 24 },
});

export default RowSelectItem;
