import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import {
	Dimensions,
	Image,
	ImageBackground,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const { width, height } = Dimensions.get('window');
const headerRatio = 380 / 1440;
const { fonts, colors } = config;

interface DashboardHeaderProps {
	banner?: string;
	logo?: string;
	onLogoPress?: () => void;
}

const DashboardHeader = ({
	banner,
	logo,
	onLogoPress,
}: DashboardHeaderProps) => {
	const children = (
		<View style={styles.headerImageContainer}>
			<TouchableOpacity activeOpacity={0.8} onPress={onLogoPress}>
				{logo ? (
					<Image
						style={styles.headerImageStyle}
						source={{
							uri: logo,
							headers: {
								Pragma: 'no-cache',
							},
						}}
					/>
				) : (
					<Icon
						onPress={onLogoPress}
						name="store-alt"
						style={styles.headerIconImage}
					/>
				)}
			</TouchableOpacity>
		</View>
	);

	return banner ? (
		<ImageBackground
			source={{ uri: banner }}
			style={styles.container}
			resizeMode="stretch"
		>
			{children}
		</ImageBackground>
	) : (
		<View style={[styles.container, { backgroundColor: colors.brand }]}>
			{children}
		</View>
	);
};

DashboardHeader.defaultProps = {
	banner: '',
	logo: '',
	onLogoPress: () => {},
};

export default DashboardHeader;

const styles = StyleSheet.create({
	container: {
		height: headerRatio * width,
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		padding: 12,
		position: 'relative',
		...layout.shadowLight,
	},
	headerImageContainer: {
		position: 'absolute',
		bottom: '-25%',
		left: 18,
		borderColor: fonts.colors.lightgrey,
		borderWidth: 1,
		...layout.shadowLight,
	},
	headerImageStyle: {
		width: 74,
		height: 74,
	},
	headerIconImage: {
		height: 74,
		width: 74,
		textAlign: 'center',
		paddingTop: '3%',
		backgroundColor: 'white',
		verticalAlign: 'middle',
		fontSize: height / 25,
		color: fonts.colors.darkgray,
	},
});
