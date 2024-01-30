import { ScrollView, Spacer } from '@/components/atoms';
import { MenuOption } from '@/components/molecules';
import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import { Alert, StyleSheet, Text, View } from 'react-native';

const menuOptions = [
	{
		id: 'profile',
		name: 'My Profile',
		icon: 'person',
		context: 'any',
		role: 'any',
	},
	{
		id: 'gym',
		name: 'My Gyms',
		icon: 'dumbbell',
		fontAwesome: true,
		context: 'any',
		role: 'any',
	},
	{
		id: 'performance',
		name: 'Performance',
		icon: 'chart-line',
		fontAwesome: true,
		context: 'member',
		role: 'member',
	},
	{
		id: 'notification',
		name: 'Notifications',
		icon: 'notifications',
		context: 'any',
		role: 'any',
	},
	// {
	// 	id: 'member',
	// 	name: 'Member Account',
	// 	icon: 'swap',
	// 	context: 'member',
	// 	role: 'coach',
	// },
	// {
	// 	id: 'coach',
	// 	name: 'Coach Account',
	// 	icon: 'swap',
	// 	context: 'coach',
	// 	role: 'coach',
	// },
	{
		id: 'about',
		name: 'About fitbox',
		icon: 'information-circle-outline',
		context: 'any',
		role: 'any',
	},
	{
		id: 'waivers',
		name: 'Waivers',
		icon: 'document-text-outline',
		context: 'any',
		role: 'any',
	},
	{
		id: 'help',
		name: 'Help',
		icon: 'help-circle-outline',
		context: 'any',
		role: 'any',
	},
	{
		id: 'clear-cache',
		name: 'Clear Cache',
		icon: 'trash',
		context: 'any',
		role: 'any',
	},
	{
		id: 'theme',
		name: 'Dark Mode',
		icon: 'moon',
		context: 'any',
		role: 'any',
	},
	{
		id: 'logout',
		name: 'Logout',
		icon: 'log-out',
		context: 'any',
		role: 'any',
	},
];

const Menu = () => {
	const { variant, changeTheme } = useTheme();

	const onClick = (id: string) => {
		switch (id) {
			case 'theme':
				changeTheme(variant === 'default' ? 'dark' : 'default');
				break;
			default:
				Alert.alert('Error', 'Something went wrong');
				break;
		}
	};

	return (
		<ScrollView>
			<Spacer />

			{menuOptions.map(({ id, name, icon, fontAwesome }) => (
				<MenuOption
					key={id}
					name={name}
					icon={icon}
					onPress={() => onClick(id)}
					fontAwesome={fontAwesome}
				/>
			))}

			<View style={styles.versionContainer}>
				<Text>{`App Version ${menuOptions ? '3.2' : ''}`}</Text>
				{/* {Consts.env !== 'prod' && (
					<Text danger sm style={{ marginTop: Metrics.sm }}>
						Development Mode ({Consts.baseURL})
					</Text>
				)} */}
			</View>
		</ScrollView>
	);
};

export default Menu;

const styles = StyleSheet.create({
	versionContainer: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: config.metrics.lg,
	},
});
