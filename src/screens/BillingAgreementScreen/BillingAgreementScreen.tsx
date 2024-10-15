import useAuth from '@/auth/hooks/useAuth';
import { Button, Spacer, Text } from '@/components/atoms';
import { acceptBillingAgreement } from '@/services/billing';
import { config } from '@/theme/_config';
import { ApplicationScreenProps } from '@/types/navigation';
import { Say } from '@/utils';
import { ICatchError } from '@/utils/Say';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

const BillingAgreementScreen = ({ navigation }: ApplicationScreenProps) => {
	const [processing, setProcessing] = useState<boolean>(false);
	const { user, signOut, updateUser } = useAuth();

	const handleCancel = () => {
		signOut();
		navigation.reset({
			index: 0,
			routes: [{ name: 'Landing' }],
		});
	};

	const handleAccept = async () => {
		try {
			if (processing) return false;
			const userData = user?.user_data;

			setProcessing(true);
			const res = await acceptBillingAgreement();
			if (res.error) Say.warn(res.message);
			if (userData) {
				userData.billing_agreement_accepted = true;
				updateUser(userData);
				navigation.navigate('Startup');
			}
			return true;
		} catch (e) {
			Say.err(e as ICatchError);
			return false;
		}
	};

	return (
		<SafeAreaView>
			<View style={{ padding: config.metrics.rg }}>
				<Text size="md" style={styles.justifyText}>
					{'\u00A0\u00A0\u00A0\u00A0'}By accepting, you agree to this
					Direct Debit Request and the Direct Debit Request service
					agreement, and authorise Stripe Payments Australia Pty Ltd
					ACN 160 180 343 Direct Debit User ID number 507156
					(&quot;Stripe&quot;) to debit your account through the Bulk
					Electronic Clearing System (BECS) on behalf of fitbox IQ and
					your gym (the &quot;Merchant&quot;) for any amounts
					separately communicated to you by the Merchant. You certify
					that you are either an account holder or an authorised
					signatory on the account provided to your Gym or fitbox IQ
					by you and your Gym is authorised to enter those details
					into fitbox on your behalf.
				</Text>
				<Spacer />
				<Text style={styles.centerText}>
					Please contact us fitbox IQ, or your gym with any questions
					regarding this agreement.
				</Text>
				<Spacer />
				<Text style={styles.centerText}>
					fitbox is a service mark of Again Faster Pty Ltd.
				</Text>
				<Spacer />
				<Text size="md" style={styles.centerText}>
					I HAVE READ THIS AGREEMENT AND AGREE TO ALL OF THE
					PROVISIONS CONTAINED ABOVE
				</Text>
			</View>
			<Spacer />
			<View style={styles.buttonContainer}>
				<Button
					title="Accept"
					onPress={() => void handleAccept()}
					loading={processing}
				/>
				<Spacer size="xs" />
				<Button
					title="Cancel"
					style={{ backgroundColor: config.backgrounds.dark }}
					onPress={handleCancel}
				/>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	centerText: {
		textAlign: 'center',
	},
	justifyText: {
		textAlign: 'justify',
	},
	buttonContainer: {
		paddingTop: config.metrics.xs,
		paddingHorizontal: config.metrics.lg,
		paddingBottom: config.metrics.lg,
	},
});

export default BillingAgreementScreen;
