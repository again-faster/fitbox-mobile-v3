import { Button, Spacer, Text } from '@/components/atoms';
import { Modal } from '@/components/molecules';
import { navigate } from '@/navigators/NavigationRef';
import { config } from '@/theme/_config';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const StripeSuccess = () => {
	return (
		<Modal visible>
			<View style={styles.container}>
				<Icon
					name="check-circle"
					color={config.colors.oceanGreen}
					size={config.metrics.xl * 2}
				/>
				<Text size="xl" bold color="oceanGreen">
					Successfully setup payment
				</Text>
				<Spacer size="lg" />
				<Button
					buttonColor={config.colors.info}
					labelStyle={styles.returnBtn}
					title="Return to home"
					onPress={() => navigate('Startup')}
				/>
			</View>
		</Modal>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: config.metrics.lg,
	},
	returnBtn: {
		lineHeight: 30,
	},
});

export default StripeSuccess;
