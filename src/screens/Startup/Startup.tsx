import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { Brand } from '@/components/molecules';
import { SafeScreen } from '@/components/template';
import { useTheme } from '@/theme';

import useAuth from '@/auth/hooks/useAuth';
import type { ApplicationScreenProps } from '@/types/navigation';

const Startup = ({ navigation }: ApplicationScreenProps) => {
	const { layout, gutters, fonts } = useTheme();
	const {
		// getToken,
		isLoggedIn,
		user,
	} = useAuth();
	const { t } = useTranslation(['startup']);

	const { isSuccess, isFetching, isError } = useQuery({
		queryKey: ['startup'],
		queryFn: () => {
			return Promise.resolve(true);
		},
	});

	useEffect(() => {
		const checkToken = () => {
			if (isLoggedIn()) {
				if (!user?.user_data.eula_accepted) {
					navigation.reset({
						index: 0,
						routes: [{ name: 'Eula' }],
					});
				} else {
					navigation.reset({
						index: 0,
						routes: [{ name: 'Main' }],
					});
				}
			} else {
				navigation.reset({
					index: 0,
					routes: [{ name: 'Landing' }],
				});
			}
		};

		void checkToken();
	}, [isSuccess]);

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
				{isFetching && (
					<ActivityIndicator
						size="large"
						style={[gutters.marginVertical_24]}
					/>
				)}
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
