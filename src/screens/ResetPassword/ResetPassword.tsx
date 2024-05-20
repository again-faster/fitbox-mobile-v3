import { Button, Spacer, Text } from '@/components/atoms';
import { resetPassword } from '@/services/auth';
import { config } from '@/theme/_config';
import { Say } from '@/utils';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';

const ResetPassword = () => {
	const [email, setEmail] = useState<string>('');
	const [processing, setProcessing] = useState<boolean>(false);

	const handleChangeEmail = (userEmail: string) => setEmail(userEmail);

	const handleSubmit = async () => {
		try {
			if (processing) return false;

			setProcessing(true);

			const userEmail = email.trim();
			if (!userEmail) {
				return Say.warn('Please enter your email adddress');
			}
			const res = await resetPassword(userEmail);
			setProcessing(false);
			return Say.some(res.message);
		} catch (e) {
			setProcessing(false);
			return Say.err(e as string);
		}
	};

	return (
		<SafeAreaView>
			<View style={{ padding: config.metrics.lg }}>
				<Text center color="darkgray">
					To reset your password, enter the email address you use to
					Log In
				</Text>
				<Spacer />
				<TextInput
					label="Email"
					mode="flat"
					value={email}
					onChangeText={handleChangeEmail}
					autoComplete="off"
					style={styles.input}
					autoCapitalize="none"
					keyboardType="email-address"
					underlineColor="transparent"
				/>
				<Spacer size="lg" />
				<Button
					title="Submit"
					style={styles.submitButton}
					buttonColor={config.colors.brand}
					onPress={() => void handleSubmit()}
				/>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	input: {
		borderWidth: 1,
		borderRadius: 4,
		borderColor: '#f2f2f2',
		backgroundColor: 'transparent',
	},
	submitButton: {
		width: '47%',
		alignSelf: 'center',
	},
});

export default ResetPassword;
