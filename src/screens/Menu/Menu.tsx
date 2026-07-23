import useAuth from '@/auth/hooks/useAuth';
import { ScrollView, Text } from '@/components/atoms';
import useSwitchableUsers from '@/hooks/useSwitchableUsers';
import { navigate, resetRoot } from '@/navigators/NavigationRef';
import { useTheme } from '@/theme';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { MenuStackParamList } from '@/types/navigation';
import { Constant } from '@/utils';
import useStore from '@/zustand/Store';
import { StackScreenProps } from '@react-navigation/stack';
import { useQueryClient } from '@tanstack/react-query';
import { isEmpty } from 'lodash';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { Badge, List } from 'react-native-paper';
import SimpleToast from 'react-native-simple-toast';
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
				id: 'child-account',
				name: 'Child Account',
				icon: 'people-outline',
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

type MenuScreenProps = StackScreenProps<MenuStackParamList, 'Menu'>;

const Menu = ({ navigation }: MenuScreenProps) => {
	const queryClient = useQueryClient();

	const { variant, changeTheme } = useTheme();
	const { signOut, getApiUrl, user } = useAuth();
	const { hasSwitchableUsers } = useSwitchableUsers();
	const {
		shopUrl,
		clearStates,
		emptyRequiredFields,
		storeSignature,
		storeSignatureExpiry,
		teamId,
	} = useStore(state => ({
		shopUrl: state.shopUrl,
		clearStates: () => {
			state.clearClasses();
			state.clearAppState();
			state.clearFilters();
		},
		emptyRequiredFields: state.emptyRequiredFields,
		storeSignature: state.storeSignature,
		storeSignatureExpiry: state.storeSignatureExpiry,
		teamId: state.teamId,
	}));

	const version = DeviceInfo.getVersion();
	const build = DeviceInfo.getBuildNumber();

	const storeUrl = `${shopUrl}?fb_email=${user?.user_data.email}&fb_first=${user?.user_data.first_name}&fb_last=${user?.user_data.last_name}&fb_sig=${storeSignature}&fb_expiry=${storeSignatureExpiry}&fb_gym=${teamId}`;

	const handleClearCache = () => {
		// clear zustand state
		clearStates();

		// clear workout list
		void queryClient.invalidateQueries({ queryKey: ['getWorkouts'] });
	};

	const onClick = (id: string) => {
		switch (id) {
			case 'information':
				navigate('MyDetails');
				break;
			case 'child-account':
				navigation.navigate('SwitchUser');
				break;
			case 'subscription':
				navigate('Subscription');
				break;
			case 'payments':
				navigation.navigate('PaymentInformation');
				break;
			case 'performance':
				navigation.navigate('PerformanceSummary');
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
				void Linking.openURL(storeUrl);
				break;
			case 'logout': {
				signOut();
				navigation.getParent()?.reset({
					index: 0,
					routes: [{ name: 'Landing' }],
				});

				break;
			}
			case 'about': {
				navigation.navigate('AboutUs');
				break;
			}
			case 'notification': {
				navigation.navigate('Notifications');
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
			case 'clear-cache': {
				// Show success message
				Alert.alert(
					'Clear Cache',
					'Are you sure to clear data?',
					[
						{
							text: 'Ok',
							onPress: () => {
								// trigger clear states
								handleClearCache();

								// say success alert
								SimpleToast.show(
									'Succesfully cleared cache',
									SimpleToast.SHORT,
								);

								// navigate to dashboard and reset navigation stack
								// if the user has calendar active, it will reset to dashboard
								resetRoot();
							},
						},
						{ text: 'Cancel', style: 'cancel' },
					],
					{ cancelable: true },
				);
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
		let useIcon;

		if (item.fontAwesome) {
			useIcon = (
				<FontAwesomeIcon
					name={item.icon}
					style={styles.menuOptionIcon}
					color={memberTheme.colors.primaryDeep}
					size={15}
				/>
			);
		} else {
			useIcon = (
				<Ionicons
					name={item.icon}
					style={[styles.menuOptionIcon, styles.menuOptionIonic]}
					color={memberTheme.colors.primaryDeep}
					size={21}
				/>
			);
		}

		return <View style={styles.iconContainer}>{useIcon}</View>;
	};

	const renderRightIcon = (badge: boolean) => (
		<>
			<List.Icon
				icon="chevron-right"
				color={memberTheme.colors.textMuted}
				style={styles.menuOptionRightIcon}
			/>
			{badge && (
				<Badge
					visible
					style={styles.badgeStyle}
					size={14}
					allowFontScaling={false}
				/>
			)}
		</>
	);

	const getOptionBadge = (id: string) => {
		if (id === 'information' && !isEmpty(emptyRequiredFields)) {
			return true;
		}
		return false;
	};

	const apiUrl = getApiUrl();

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<View style={styles.heroCard}>
				<View style={styles.heroIcon}>
					<Ionicons
						name="options-outline"
						size={26}
						color={memberTheme.colors.primaryDeep}
					/>
				</View>
				<View style={layout.flex_1}>
					<Text bold style={styles.heroTitle}>
						Your fitbox
					</Text>
					<Text style={styles.heroText}>
						Manage your profile, gym, memberships and app
						preferences.
					</Text>
				</View>
			</View>
			{menuOptions.map((op, i) => {
				const options = op.items.map(item => {
					const showBadge = getOptionBadge(item.id);
					const hideItem =
						item.id === 'child-account' && !hasSwitchableUsers;

					if (hideItem) return null;

					return (
						<List.Item
							key={item.id}
							style={styles.menuOption}
							title={item.name}
							titleStyle={[
								layout.fontMontserratRegular,
								styles.menuOptionTitle,
							]}
							onPress={() => onClick(item.id)}
							accessibilityRole="button"
							accessibilityLabel={item.name}
							accessibilityHint={`Opens ${item.name}`}
							left={() => renderLeftIcon(item)}
							right={() => renderRightIcon(showBadge)}
						/>
					);
				});

				if (!op?.hideTitle) {
					return (
						<List.Section
							key={i}
							style={styles.menuOptionContainer}
						>
							<List.Subheader
								style={[
									layout.fontMontserratRegular,
									styles.sectionTitle,
								]}
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
				<Text style={styles.versionText}>{`App Version ${
					menuOptions ? `${version} (${build})` : ''
				}`}</Text>
				{[
					Constant.API_BASE_URLS.DEV,
					Constant.API_BASE_URLS.STAGING,
				].includes(apiUrl) && (
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
		backgroundColor: memberTheme.colors.background,
		flexGrow: 1,
		padding: memberTheme.spacing.lg,
	},
	heroCard: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.lg,
		flexDirection: 'row',
		marginBottom: memberTheme.spacing.md,
		padding: memberTheme.spacing.lg,
	},
	heroIcon: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.md,
		height: 50,
		justifyContent: 'center',
		marginRight: memberTheme.spacing.md,
		width: 50,
	},
	heroTitle: { color: memberTheme.colors.ink, fontSize: 19 },
	heroText: {
		color: memberTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 17,
		marginTop: 4,
	},
	iconContainer: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.sm,
		height: 40,
		justifyContent: 'center',
		marginLeft: memberTheme.spacing.sm,
		width: 40,
	},
	menuOptionContainer: {
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderRadius: memberTheme.radius.lg,
		borderWidth: 1,
		overflow: 'hidden',
	},
	menuOption: {
		backgroundColor: memberTheme.colors.surface,
		borderTopColor: memberTheme.colors.border,
		borderTopWidth: 1,
		minHeight: 60,
	},
	menuOptionTitle: { color: memberTheme.colors.text, fontSize: 15 },
	sectionTitle: {
		color: memberTheme.colors.textMuted,
		fontSize: 12,
		letterSpacing: 0.8,
		textTransform: 'uppercase',
	},
	menuOptionIcon: {
		width: 23,
		height: 23,
		textAlign: 'center',
		verticalAlign: 'middle',
		marginLeft: 13,
	},
	menuOptionIonic: {
		marginTop: 1,
	},
	menuOptionRightIcon: {
		marginRight: -config.metrics.md,
	},
	versionContainer: {
		width: '100%',
		alignItems: 'center',
		paddingVertical: config.metrics.lg,
	},
	versionText: { color: memberTheme.colors.textMuted, fontSize: 12 },
	environment: {
		marginTop: config.metrics.lg,
		color: config.colors.danger,
	},

	badgeStyle: {
		position: 'absolute',
		top: -16,
		right: -22,
		backgroundColor: config.colors.brand,
	},
});
