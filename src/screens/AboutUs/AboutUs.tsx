import { ImageVariant, ScrollView, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import LogoImage from '@/theme/assets/images/logo_with_name.png';
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

const AboutUs = ({ navigation }: MenuStackNavigatorProps) => {
	const { width: DEVICE_WIDTH } = Dimensions.get('screen');

	useLayoutEffect(() => {
		navigation.setOptions({
			title: 'About fitbox',
		});
	}, [navigation]);

	const imageStyles: StyleProp<ImageProps> = {
		width: DEVICE_WIDTH / 2,
		height: DEVICE_WIDTH / 3,
	};

	const onPressURL = () => {
		void Linking.openURL(
			process.env.FITBOX_WEBSITE ? process.env.FITBOX_WEBSITE : '',
		);
	};

	return (
		<View style={styles.aboutContainer}>
			<View style={styles.imageContainer}>
				<ImageVariant
					source={LogoImage as ImageSourcePropType}
					style={{ ...imageStyles, ...styles.image }}
				/>
			</View>
			<View style={styles.textContainer}>
				<ScrollView>
					<Spacer />
					<Text size="md" color="black" style={styles.text}>
						At fitbox we dream of a healthier and happier community.
						Everything we do is designed to help gyms and members
						succeed.
					</Text>
					<Spacer />
					<Text size="md" color="black" style={styles.text}>
						Our team is passionate about fitness, technology and
						having fun. Our founders are from the gym industry and
						saw an opportunity to empower the community and we
						strive to achieve that every day. We do this with
						integrity, respect, teamwork and an inclusive attitude.
					</Text>
					<Spacer />
					<Text size="md" color="black" style={styles.text}>
						We build innovative gym management software to elevate
						the member experience. Whether it’s booking or tracking
						workouts, providing tailored insights or engaging the
						community, our app helps you succeed.
					</Text>
					<Spacer size={config.metrics.lg} />
					<Text size="md" color="black" style={styles.text}>
						Find out more at:
					</Text>
					<TouchableOpacity onPress={onPressURL}>
						<Text color="brand" size="lg">
							{process.env.FITBOX_WEBSITE?.replace(
								'https://',
								'',
							)}
						</Text>
					</TouchableOpacity>
				</ScrollView>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	aboutContainer: {
		flex: 1,
		padding: config.metrics.xl,
	},
	imageContainer: {
		alignItems: 'center',
	},
	image: {
		resizeMode: 'contain',
	},
	text: {
		textAlign: 'justify',
		fontFamily: 'Alata-Regular',
	},
	textContainer: {
		flex: 1,
	},
});

export default AboutUs;
