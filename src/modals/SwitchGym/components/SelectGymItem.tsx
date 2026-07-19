import { Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { fonts } = config;

type SelectGymItemProps = {
	id: number;
	image: string;
	onPress: () => void;
	text: string;
	selected: boolean;
	isNew: boolean;
};

const SelectGymItem = ({
	id,
	image,
	onPress,
	text,
	selected,
	isNew,
}: SelectGymItemProps) => (
	<TouchableOpacity
		key={id}
		style={styles.container}
		activeOpacity={0.6}
		onPress={onPress}
		accessibilityRole="button"
		accessibilityLabel={`${text}${selected ? ', current gym' : ''}`}
		accessibilityHint={
			selected ? 'This is your current gym' : 'Switches to this gym'
		}
	>
		<Row style={layout.flex_1} align="center">
			<View
				style={{
					backgroundColor: fonts.colors.gray,
					...styles.imageStyle,
					...styles.imageSize,
				}}
			>
				{image && image !== '' ? (
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
					<Icon name="home" size={fonts.metrics.xxl} />
				)}
			</View>
			<Spacer horizontal size="sm" />
			<Text size="lg" style={styles.textStyle}>
				{text}
			</Text>
		</Row>
		<View style={styles.badgeContainer}>
			{isNew && (
				<Text style={styles.badgeStyle} size="xs" color="light" bold>
					New
				</Text>
			)}
		</View>

		{selected && ( // show check if current gym
			<View style={styles.currentBadge}>
				<Text bold style={styles.currentText}>
					Current
				</Text>
				<Icon name="check-circle" style={styles.selectedIcon} />
			</View>
		)}
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
		marginHorizontal: memberTheme.spacing.lg,
		minHeight: 72,
	},
	textStyle: {
		maxWidth: '80%',
		fontSize: 15,
		color: memberTheme.colors.ink,
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
		paddingHorizontal: 2,
		backgroundColor: fonts.colors.info,
		color: fonts.colors.light,
	},
	badgeContainer: {
		alignSelf: 'flex-end',
	},
	selectedIcon: {
		fontSize: 20,
		color: memberTheme.colors.success,
		marginLeft: memberTheme.spacing.xs,
	},
	currentBadge: {
		alignItems: 'center',
		backgroundColor: '#EAF6EC',
		borderRadius: memberTheme.radius.pill,
		flexDirection: 'row',
		paddingHorizontal: memberTheme.spacing.sm,
		paddingVertical: 6,
	},
	currentText: {
		color: memberTheme.colors.success,
		fontSize: 11,
	},
});

export default SelectGymItem;
