import { Button, Spacer, Text } from '@/components/atoms';
import { config } from '@/theme/_config';
import { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const LoginNotification = () => {
	// Use type assertion to bypass TypeScript error for navigation
	// const navigation = useNavigation();

	const [showNotification, setShowNotification] = useState<boolean>(true);

	// const { setAppState } = useStore(state => ({
	// 	setAppState: state.setAppState,
	// }));

	const navigateToScreen = (screen: string) => {
		setShowNotification(false);
		switch (screen) {
			// case 'shop':
			// 	navigation.navigate('Shop');
			// 	break;
			// case 'profile':
			// 	navigation.navigate('MyDetails');
			// 	break;
			// case 'membership':
			// 	navigation.navigate('Subscription');
			// 	break;
			// case 'payment':
			// 	navigation.navigate('MenuTab', {
			// 		screen: 'PaymentInformation',
			// 	});
			// 	break;
			// case 'performance':
			// 	navigation.navigate('MenuTab', {
			// 		screen: 'PerformanceSummaryStack',
			// 		params: {
			// 			screen: 'PastPerformance',
			// 		},
			// 	});
			// 	break;
			// Add more cases as needed for other screens
			default:
				break;
		}
	};

	return (
		<Modal visible={showNotification} transparent animationType="fade">
			<View style={styles.container}>
				<View style={styles.cardContainer}>
					<ScrollView showsVerticalScrollIndicator>
						<Icon
							name="close-outline"
							size={config.metrics.lg}
							style={styles.closeIcon}
							onPress={() => setShowNotification(false)}
						/>
						<Text size="md" bold center>
							New In-App Store is Live!
						</Text>
						<Spacer />
						<Image
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							source={require('../../../theme/images/new-store.png')}
							style={styles.image}
						/>
						<Spacer size={config.metrics.lg} />
						<Text size="rg" center>
							Explore the new store for exclusive member discounts
							with TWL, ATP Science, Frog Grips and all the gym
							accessories you need.
						</Text>
						<Spacer />
					</ScrollView>

					<Button
						sm
						buttonColor={config.colors.brand}
						labelStyle={{ color: config.backgrounds.light }}
						onPress={() => navigateToScreen('performance')}
						title="View"
					/>
				</View>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'rgba(0,0,0,0.5)',
		flex: 1,
		paddingHorizontal: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
	touchableClose: {
		flex: 0.3,
	},
	card: {
		width: '100%',
		alignSelf: 'center',
		backgroundColor: config.backgrounds.light,
	},
	image: {
		width: '100%',
		height: 300,
		resizeMode: 'cover',
	},
	closeIcon: {
		paddingBottom: config.metrics.sm,
		alignSelf: 'flex-end',
	},
	cardContainer: {
		width: '100%',
		maxHeight: '80%', // This applies correctly
		backgroundColor: config.backgrounds.light,
		padding: 15,
	},
});

export default LoginNotification;
