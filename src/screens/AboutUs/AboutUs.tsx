import { ImageVariant, ScrollView, Spacer, Text } from '@/components/atoms';
import LogoImage from '@/theme/assets/images/logo_with_name.png';
import { memberTheme } from '@/theme/member';
import { MenuStackNavigatorProps } from '@/types/navigation';
import { useLayoutEffect } from 'react';
import {
	Dimensions,
	ImageProps,
	ImageSourcePropType,
	Linking,
	StyleProp,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AboutUs = ({ navigation }: MenuStackNavigatorProps) => {
	const { width: deviceWidth } = Dimensions.get('screen');

	useLayoutEffect(() => {
		navigation.setOptions({ title: 'About fitbox' });
	}, [navigation]);

	const imageStyles: StyleProp<ImageProps> = {
		width: deviceWidth / 2,
		height: deviceWidth / 4,
	};

	const onPressURL = () => {
		void Linking.openURL(process.env.FITBOX_WEBSITE || '');
	};

	return (
		<View style={styles.container}>
			<View style={styles.heroCard}>
				<ImageVariant
					source={LogoImage as ImageSourcePropType}
					style={{ ...imageStyles, ...styles.image }}
				/>
				<Text bold style={styles.heroTitle}>
					Built for stronger communities
				</Text>
				<Text center style={styles.heroText}>
					Fitness, technology and a better member experience—all in
					one place.
				</Text>
			</View>

			<ScrollView contentContainerStyle={styles.contentCard}>
				<Text size="md" style={styles.bodyText}>
					At fitbox we dream of a healthier and happier community.
					Everything we do is designed to help gyms and members
					succeed.
				</Text>
				<Spacer />
				<Text size="md" style={styles.bodyText}>
					Our team is passionate about fitness, technology and having
					fun. Our founders are from the gym industry and saw an
					opportunity to empower the community. We strive to do that
					every day with integrity, respect, teamwork and an inclusive
					attitude.
				</Text>
				<Spacer />
				<Text size="md" style={styles.bodyText}>
					We build innovative gym management software to elevate the
					member experience. Whether it’s booking or tracking
					workouts, providing tailored insights or engaging the
					community, our app helps you succeed.
				</Text>
				<Spacer />
				<Text size="sm" style={styles.linkLabel}>
					Find out more
				</Text>
				<TouchableOpacity
					style={styles.websiteButton}
					onPress={onPressURL}
				>
					<Text bold style={styles.websiteText}>
						{process.env.FITBOX_WEBSITE?.replace('https://', '')}
					</Text>
					<Icon
						name="open-in-new"
						size={18}
						color={memberTheme.colors.primaryDeep}
					/>
				</TouchableOpacity>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: memberTheme.colors.background,
		flex: 1,
		padding: memberTheme.spacing.lg,
	},
	heroCard: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.lg,
		padding: memberTheme.spacing.lg,
	},
	image: { resizeMode: 'contain' },
	heroTitle: {
		color: memberTheme.colors.ink,
		fontSize: 19,
		marginTop: memberTheme.spacing.sm,
	},
	heroText: {
		color: memberTheme.colors.textMuted,
		fontSize: 13,
		lineHeight: 19,
		marginTop: memberTheme.spacing.xs,
	},
	contentCard: {
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderRadius: memberTheme.radius.lg,
		borderWidth: 1,
		marginTop: memberTheme.spacing.md,
		padding: memberTheme.spacing.lg,
	},
	bodyText: {
		color: memberTheme.colors.text,
		fontFamily: 'Alata-Regular',
		lineHeight: 22,
	},
	linkLabel: {
		color: memberTheme.colors.textMuted,
		marginBottom: memberTheme.spacing.sm,
	},
	websiteButton: {
		alignItems: 'center',
		alignSelf: 'flex-start',
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.pill,
		flexDirection: 'row',
		gap: memberTheme.spacing.sm,
		paddingHorizontal: memberTheme.spacing.md,
		paddingVertical: memberTheme.spacing.sm,
	},
	websiteText: { color: memberTheme.colors.primaryDeep, fontSize: 15 },
});

export default AboutUs;
