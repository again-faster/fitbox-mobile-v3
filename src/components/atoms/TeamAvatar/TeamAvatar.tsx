import { config } from '@/theme/_config';
import { TeamAvatarSize } from '@/utils/Enum';
import { Dimensions, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { fonts } = config;
const { height } = Dimensions.get('window');

interface TeamAvatarProps {
	logo?: string;
	rounded?: boolean;
	onPress?: () => void;
	size?: keyof typeof TeamAvatarSize;
}

const TeamAvatar = ({
	logo,
	rounded,
	size = 'md',
	onPress,
}: TeamAvatarProps) => {
	// Rounded style
	const roundedStyle = rounded ? { borderRadius: 50 } : {};

	// size 15 is the default size
	const avatarSize = {
		width: TeamAvatarSize[size] as number,
		height: TeamAvatarSize[size] as number,
	};

	return (
		<TouchableOpacity activeOpacity={0.8} onPress={onPress}>
			{logo && logo !== '' ? (
				<Image
					style={[avatarSize, roundedStyle]}
					source={{
						uri: logo,
						headers: {
							Pragma: 'no-cache',
						},
					}}
				/>
			) : (
				<Icon
					name="store-alt"
					style={[avatarSize, styles.headerIconImage]}
				/>
			)}
		</TouchableOpacity>
	);
};

TeamAvatar.defaultProps = {
	logo: '',
	onPress: () => {},
	rounded: false,
	size: 'md',
};

export default TeamAvatar;

const styles = StyleSheet.create({
	headerIconImage: {
		textAlign: 'center',
		paddingTop: '3%',
		backgroundColor: 'white',
		verticalAlign: 'middle',
		fontSize: height / 25,
		color: fonts.colors.darkgray,
	},
});
