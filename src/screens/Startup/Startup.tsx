import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Brand, Loader } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { useTheme } from '@/theme';

import useAuth from '@/auth/hooks/useAuth';
import { Spacer } from '@/components/atoms';
import { getApiToken } from '@/services/instance';
import type { ApplicationScreenProps } from '@/types/navigation';
import useStore from '@/zustand/Store';

const Startup = ({ navigation }: ApplicationScreenProps) => {
	const { layout, fonts } = useTheme();
	const { t } = useTranslation(['startup']);

	const { fromAcceptInvite } = useStore(state => ({
		fromAcceptInvite: state.fromAcceptInvite,
	}));

	const { isLoggedIn, user, signOut } = useAuth();

	const { isSuccess, isError } = useQuery({
		queryKey: ['startup'],
		queryFn: () => {
			return Promise.resolve(true);
		},
	});

	useEffect(() => {
		const checkToken = () => {
			const apiToken = getApiToken();
			if (isLoggedIn && apiToken) {
				if (user?.user_data) {
					// check if user has accepted EULA
					if (!user?.user_data.eula_accepted) {
						return navigation.reset({
							index: 0,
							routes: [{ name: 'Eula' }],
						});
					}

					if (!user.user_data.waiver_accepted) {
						return navigation.reset({
							index: 0,
							routes: [{ name: 'GymWaiver' }],
						});
					}

					if (
						user.user_data.show_billing_form &&
						!user.user_data.billing_agreement_accepted
					) {
						return navigation.reset({
							index: 0,
							routes: [{ name: 'BillingAgreement' }],
						});
					}

					if (
						user.user_data.last_login === null &&
						!user.user_data.is_health_captured
					) {
						return navigation.reset({
							index: 0,
							routes: [{ name: 'HealthCapture' }],
						});
					}

					if (
						user.user_data.show_subscription_form ||
						fromAcceptInvite
					) {
						return navigation.reset({
							index: 0,
							routes: [{ name: 'SubscriptionSetup' }],
						});
					}

					// if (
					// 	((user.user_data.show_payment_form &&
					// 		!user.user_data.has_payment_details &&
					// 		!user.user_data.has_waived_subscriptions) ||
					// 		fromAcceptInvite) &&
					// 	user?.user_data?.parent_id === 0
					// ) {
					// 	return navigation.reset({
					// 		index: 0,
					// 		routes: [
					// 			{
					// 				name: 'PaymentSetup',
					// 				params: { setup: true },
					// 			},
					// 		],
					// 	});
					// }

					// Note: Additional conditions here.
				}

				return navigation.reset({
					index: 0,
					routes: [{ name: 'Main' }],
				});
			}

			// perform signout
			signOut();

			return navigation.reset({
				index: 0,
				routes: [{ name: 'Landing' }],
			});
		};

		setTimeout(() => {
			void checkToken();
		}, 1000);
	}, [isSuccess, user?.user_data.waiver_accepted]);

	return (
		<SafeScreen>
			<View
				style={[
					layout.flex_1,
					layout.col,
					layout.itemsCenter,
					layout.justifyCenter,
				]}
			>
				<Brand />

				<Spacer size="lg" />

				<Loader size="xxl" />

				{isError && (
					<Text style={[fonts.size_16, fonts.red500]}>
						{t('startup:error')}
					</Text>
				)}
			</View>
		</SafeScreen>
	);
};

export default Startup;
