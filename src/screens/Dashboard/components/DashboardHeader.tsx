import TeamAvatar from '@/components/atoms/TeamAvatar/TeamAvatar';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ApplicationStackParamList } from '@/types/navigation';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { memo } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

const bannerAspectRatio = 1440 / 380;
const { fonts, colors } = config;

interface DashboardHeaderProps {
	banner?: string;
	logo?: string;
}

const DashboardHeader = ({ banner = '', logo = '' }: DashboardHeaderProps) => {
	const navigation: NavigationProp<ApplicationStackParamList> =
		useNavigation();

	const children = (
		<View style={styles.headerImageContainer}>
			<TeamAvatar
				logo={logo}
				onPress={() => navigation.navigate('SwitchGym')}
			/>
		</View>
	);

	return banner ? (
		<ImageBackground
			source={{ uri: banner }}
			style={styles.container}
			resizeMode="cover"
		>
			{children}
		</ImageBackground>
	) : (
		<View style={[styles.container, { backgroundColor: colors.brand }]}>
			{children}
		</View>
	);
};

export default memo(DashboardHeader);

const styles = StyleSheet.create({
	container: {
		width: '100%',
		aspectRatio: bannerAspectRatio,
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		padding: 12,
		position: 'relative',
		...layout.shadowLight,
		backgroundColor: colors.brand,
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
});
