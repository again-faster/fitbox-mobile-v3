import useAuth from '@/auth/hooks/useAuth';
import { ScrollView, Text } from '@/components/atoms';
import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { MainTabScreenProps } from '@/types/navigation';
import { Constant } from '@/utils';
import useStore from '@/zustand/Store';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { List } from 'react-native-paper';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';

const menuOptions = [
	{
		title: 'Account',
		items: [
			{
				id: 'information',
				name: 'My Details',
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
				id: 'health-info',
				name: 'Update Health Info',
				icon: 'medkit',
				context: 'any',
				role: 'any',
			},
			{
				id: 'performance',
				name: 'Past Performance',
				icon: 'chart-line',
				fontAwesome: true,
				context: 'member',
				role: 'member',
			},
		],
	},
	{
		title: 'Gym',
		items: [
			// {
			// 	id: 'shop',
			// 	name: 'Visit Shop',
			// 	icon: 'cart',
			// 	context: 'member',
			// 	role: 'member',
			// },
			{
				id: 'subscription',
				name: 'Memberships',
				icon: 'file-invoice-dollar',
				context: 'any',
				role: 'any',
				fontAwesome: true,
			},
			{
				id: 'payments',
				name: 'Payment Details',
				icon: 'card-outline',
				context: 'any',
				role: 'any',
			},
			{
				id: 'waivers',
				name: 'Accepted Waivers',
				icon: 'document-text-outline',
				context: 'any',
				role: 'any',
			},
		],
	},
	{
		title: 'App',
		items: [
			{
				id: 'notification',
				name: 'Notifications',
				icon: 'notifications',
				context: 'any',
				role: 'any',
			},
			{
				id: 'about',
				name: 'About fitbox',
				icon: 'information-circle-outline',
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
				id: 'logout',
				name: 'Logout',
				icon: 'log-out',
				context: 'any',
				role: 'any',
			},
		],
	},
	{
		title: 'Others',
		hideTitle: true,
		items: [
			// add in more items here to hide the title header
		],
	},
];

const Menu = ({ navigation }: MainTabScreenProps) => {
	const { variant, changeTheme } = useTheme();
	const { signOut, getApiUrl } = useAuth();
	const shopUrl = useStore(state => state.shopUrl);

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
			case 'gym':
				navigation.navigate('SwitchGym');
				break;
			case 'theme':
				changeTheme(variant === 'default' ? 'dark' : 'default');
				break;
			case 'shop':
				void Linking.openURL(shopUrl);
				break;
			case 'logout': {
				signOut();

				navigation.reset({
					index: 0,
					routes: [{ name: 'Landing' }],
				});
				break;
			}
			case 'about': {
				navigation.navigate('AboutUs');
				break;
			}
			case 'waivers': {
				navigation.navigate('AcceptedWaivers');
				break;
			}
			case 'help': {
				navigation.navigate('HelpScreen');
				break;
			}
			default:
				Alert.alert('Oops!', 'Coming soon');
				break;
		}
	};

	const renderLeftIcon = (item: {
		id: string;
		icon: string;
		fontAwesome?: boolean;
	}) => {
		if (item.fontAwesome) {
			return (
				<FontAwesomeIcon
					name={item.icon}
					style={styles.menuOptionIcon}
					color="#777"
					size={15}
				/>
			);
		}

		return (
			<Ionicons
				name={item.icon}
				style={styles.menuOptionIcon}
				color="#777"
				size={20}
			/>
		);
	};

	const renderRightIcon = () => (
		<List.Icon
			icon="chevron-right"
			color="#777"
			style={styles.menuOptionRightIcon}
		/>
	);

	const apiUrl = getApiUrl();

	return (
		<ScrollView contentContainerStyle={styles.container}>
			{menuOptions.map((op, i) => {
				const options = op.items.map(item => (
					<List.Item
						key={item.id}
						style={styles.menuOption}
						title={item.name}
						titleStyle={layout.fontMontserratRegular}
						onPress={() => onClick(item.id)}
						left={() => renderLeftIcon(item)}
						right={renderRightIcon}
					/>
				));

				if (!op?.hideTitle) {
					return (
						<List.Section
							key={i}
							style={styles.menuOptionContainer}
						>
							<List.Subheader
								style={layout.fontMontserratRegular}
							>
								{op.title}
							</List.Subheader>
							{options}
						</List.Section>
					);
				}

				return options;
			})}

			<View style={styles.versionContainer}>
				<Text>{`App Version ${menuOptions ? '3.2' : ''}`}</Text>
				{apiUrl !== Constant.API_BASE_URLS.DEV && (
					<Text size="sm" style={styles.environment}>
						Development Mode ({apiUrl})
					</Text>
				)}
			</View>
		</ScrollView>
	);
};

export default Menu;

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#F4F4F4',
	},
	menuOptionContainer: {
		gap: 1,
	},
	menuOption: {
		backgroundColor: 'white',
	},
	menuOptionIcon: {
		width: 23,
		height: 23,
		textAlign: 'center',
		verticalAlign: 'middle',
		marginLeft: 13,
	},
	menuOptionRightIcon: {
		marginRight: -config.metrics.md,
	},
	versionContainer: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: config.metrics.lg,
	},
	environment: {
		marginTop: config.metrics.lg,
		color: config.colors.danger,
	},
});
