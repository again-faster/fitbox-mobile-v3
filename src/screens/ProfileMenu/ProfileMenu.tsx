import { ScrollView } from '@/components/atoms';
import { MenuOption } from '@/components/molecules';
import { config } from '@/theme/_config';
import { MenuStackNavigatorProps } from '@/types/navigation';
import { useLayoutEffect } from 'react';
import { Alert, StyleSheet } from 'react-native';

const menuOptions = [
	{
		id: 'information',
		name: 'My Details',
		icon: 'person',
		context: 'any',
		role: 'any',
	},
	{
		id: 'payments',
		name: 'Payments',
		icon: 'card-outline',
		context: 'any',
		role: 'any',
	},
	{
		id: 'subscription',
		name: 'Memberships',
		icon: 'file-invoice-dollar',
		context: 'any',
		role: 'any',
		fontAwesome: true,
	},
	{
		id: 'health-info',
		name: 'Update Health Info',
		icon: 'medkit',
		context: 'any',
		role: 'any',
	},
];

const ProfileMenu = ({ navigation }: MenuStackNavigatorProps) => {
	useLayoutEffect(() => {
		navigation.setOptions({
			title: 'Profile',
		});
	}, []);

	const onClick = (id: string) => {
		switch (id) {
			case 'information':
				navigation.navigate('MyDetails');
				break;
			case 'subscription':
				navigation.navigate('Subscription');
				break;
			case 'payments':
				navigation.navigate('PaymentInformation');
				break;
			case 'health-info':
				navigation.navigate('HealthCapture', { fromMenu: true });
				break;
			default:
				Alert.alert('Oops!', 'Coming soon');
				break;
		}
	};

	return (
		<ScrollView contentContainerStyle={styles.container}>
			{menuOptions.map(({ id, name, icon, fontAwesome }) => (
				<MenuOption
					key={id}
					name={name}
					icon={icon}
					fontAwesome={fontAwesome}
					onPress={() => onClick(id)}
				/>
			))}
		</ScrollView>
	);
};

export default ProfileMenu;

const styles = StyleSheet.create({
	container: {
		paddingVertical: config.metrics.rg,
	},
});
