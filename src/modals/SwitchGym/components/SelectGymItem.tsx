import { Row, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
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
			<Icon name="check" style={styles.selectedIcon} />
		)}
	</TouchableOpacity>
);

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		paddingHorizontal: 15,
		paddingVertical: 10,
		borderColor: '#f2f2f2',
		justifyContent: 'space-between',
		alignItems: 'center',
		borderBottomWidth: 1,
	},
	textStyle: {
		maxWidth: '80%',
		fontSize: 15,
	},
	imageSize: {
		width: 50,
		height: 50,
	},
	imageStyle: {
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 10,
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
		fontSize: fonts.metrics.lg,
		color: fonts.colors.info,
	},
});

export default SelectGymItem;
