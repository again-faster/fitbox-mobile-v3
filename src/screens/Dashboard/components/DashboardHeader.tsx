import TeamAvatar from '@/components/atoms/TeamAvatar/TeamAvatar';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { ApplicationStackParamList } from '@/types/navigation';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { memo } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

const bannerAspectRatio = 1440 / 380;
const logoSize = 74;
const logoOverlap = logoSize / 2;
const logoRadius = 12;
const { fonts, colors } = config;

interface DashboardHeaderProps {
	banner?: string;
	logo?: string;
}

const DashboardHeader = ({ banner = '', logo = '' }: DashboardHeaderProps) => {
	const navigation: NavigationProp<ApplicationStackParamList> =
		useNavigation();

	const children = (
		<View testID="dashboard-logo" style={styles.logoContainer}>
			<View testID="dashboard-logo-inner" style={styles.logoInner}>
				<TeamAvatar
					logo={logo}
					size="md"
					onPress={() => navigation.navigate('SwitchGym')}
				/>
			</View>
		</View>
	);

	return (
		<View testID="dashboard-header" style={styles.wrapper}>
			{banner ? (
				<ImageBackground
					testID="dashboard-banner"
					source={{ uri: banner }}
					style={styles.banner}
					resizeMode="cover"
				>
					{children}
				</ImageBackground>
			) : (
				<View
					testID="dashboard-banner"
					style={[styles.banner, { backgroundColor: colors.brand }]}
				>
					{children}
				</View>
			)}
		</View>
	);
};

export default memo(DashboardHeader);

const styles = StyleSheet.create({
	wrapper: {
		width: '100%',
		overflow: 'visible',
		marginBottom: logoOverlap,
		zIndex: 1,
	},
	banner: {
		width: '100%',
		aspectRatio: bannerAspectRatio,
		justifyContent: 'space-between',
		alignItems: 'center',
		flexDirection: 'row',
		position: 'relative',
		overflow: 'visible',
		...layout.shadowLight,
		backgroundColor: colors.brand,
	},
	logoContainer: {
		position: 'absolute',
		bottom: -logoOverlap,
		left: 16,
		width: logoSize,
		height: logoSize,
		aspectRatio: 1,
		borderColor: fonts.colors.lightgrey,
		borderWidth: 1,
		...layout.shadowLight,
		backgroundColor: 'white',
		borderRadius: logoRadius,
		zIndex: 2,
	},
	logoInner: {
		width: logoSize,
		height: logoSize,
		aspectRatio: 1,
		borderRadius: logoRadius,
		overflow: 'hidden',
	},
});
