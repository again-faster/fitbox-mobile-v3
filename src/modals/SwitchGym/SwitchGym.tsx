import { Row, Text } from '@/components/atoms';
import { FlatList, Loader } from '@/components/molecules';
import { resetRoot } from '@/navigators/NavigationRef';
import queryClient from '@/query/queryClient';
import {
	getUserGymInfo,
	getUserGyms,
	updateUserProfile,
} from '@/services/users';
import { config } from '@/theme/_config';
import { memberTheme } from '@/theme/member';
import { ApplicationStackParamList } from '@/types/navigation';
import { Gym } from '@/types/schemas/gym';
import { LoginResponseSchemaType } from '@/types/schemas/response';
import { Say } from '@/utils';
import useStore from '@/zustand/Store';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { isArray } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import {
	ListRenderItemInfo,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import SelectGymItem from './components/SelectGymItem';

const SwitchGym = () => {
	const teamId = useStore(state => state.teamId);
	const navigation: NavigationProp<ApplicationStackParamList> =
		useNavigation();
	const clearClasses = useStore(state => state.clearClasses);
	const clearFilters = useStore(state => state.clearFilters);
	const clearStates = useStore(state => state.clearAppState);
	const { loggedInUser, setLoggedInUser, setAppState } = useStore(state => ({
		loggedInUser: state.loggedInUser,
		setLoggedInUser: state.setLoggedInUser,
		setAppState: state.setAppState,
	}));
	const [switching, setSwitching] = useState(false);

	const { data, isFetching, refetch, isSuccess } = useQuery({
		queryKey: ['getUserGyms'],
		queryFn: () => {
			return getUserGyms();
		},
	});

	const user = loggedInUser as LoginResponseSchemaType;

	const onSelectGym = useCallback(
		async (id: number) => {
			setSwitching(true);

			try {
				const res = await updateUserProfile({ default_team_id: id });
				if (res.error) {
					Say.err(res.message);
					return;
				}

				const gymInfoRes = await getUserGymInfo();
				if (gymInfoRes.error) {
					Say.err(gymInfoRes.message);
					return;
				}

				// Cached responses belong to the previous gym. Clear them
				// before rebuilding global state and resetting navigation.
				queryClient.clear();

				setLoggedInUser({
					...user,
					user_data: {
						...user.user_data,
						is_staff: res.user_data.is_staff as boolean,
						waiver_accepted: gymInfoRes.user_data.waiver_accepted,
						has_payment_details:
							user.user_data.has_payment_details === 'skipped'
								? 'skipped'
								: gymInfoRes.user_data.has_payment_details,
						has_waived_subscriptions:
							gymInfoRes.user_data.has_waived_subscriptions,
						show_subscription_form:
							!gymInfoRes.user_data.has_paid_subscriptions &&
							!gymInfoRes.user_data.has_waived_subscriptions,
						has_previous_subscriptions:
							gymInfoRes.user_data.has_previous_subscriptions,
					},
				});

				clearClasses();
				clearStates();
				clearFilters();

				if (res.user_data.is_new) {
					setAppState('fromAcceptInvite', true);
				}

				resetRoot();
			} catch {
				Say.err('Something went wrong');
			} finally {
				setSwitching(false);
			}
		},
		[
			clearClasses,
			clearFilters,
			clearStates,
			setAppState,
			setLoggedInUser,
			user,
		],
	);

	const renderItem = useCallback(
		({ item }: ListRenderItemInfo<Gym>) => {
			const { id, logo, name, status } = item;

			return (
				<SelectGymItem
					id={id}
					onPress={() => void onSelectGym(id)}
					image={logo}
					selected={teamId === id}
					text={name}
					isNew={status === 'pending'}
				/>
			);
		},
		[onSelectGym, teamId],
	);

	const renderAddGymFooter = () => {
		// TODO: linting error for navigation to signup
		return (
			<TouchableOpacity onPress={() => navigation.navigate('SignUp', {})}>
				<View style={styles.addGymCon}>
					<Row>
						<Icon
							name="plus"
							size={20}
							color={config.backgrounds.light}
						/>
						<Text style={styles.addGymText} color="light" bold>
							Add Gym
						</Text>
					</Row>
				</View>
			</TouchableOpacity>
		);
	};

	const sortedData = useMemo(() => {
		let useSortedData: Gym[] = [];

		if (isSuccess && isArray(data?.data)) {
			useSortedData = data?.data?.sort((a: Gym, b: Gym) => {
				if (a.name < b.name) {
					return -1;
				}
				if (a.name > b.name) {
					return 1;
				}
				return 0;
			});
		}

		return useSortedData;
	}, [data]);

	return (
		<View style={styles.container}>
			<View style={styles.introCard}>
				<View style={styles.introIcon}>
					<Icon
						name="home-city-outline"
						size={24}
						color={memberTheme.colors.primaryDeep}
					/>
				</View>
				<View style={styles.introCopy}>
					<Text bold style={styles.introTitle}>
						My gyms
					</Text>
					<Text style={styles.introText}>
						Choose the gym you want to use right now.
					</Text>
				</View>
			</View>
			<FlatList
				data={sortedData}
				refreshing={isFetching}
				renderItem={renderItem}
				loading={isFetching}
				onRefresh={() => void refetch()}
				useRefresh
			/>
			{renderAddGymFooter()}
			{switching && <Loader />}
		</View>
	);
};

export default SwitchGym;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: memberTheme.colors.background,
		paddingTop: memberTheme.spacing.md,
	},
	introCard: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: memberTheme.radius.lg,
		flexDirection: 'row',
		marginBottom: memberTheme.spacing.md,
		marginHorizontal: memberTheme.spacing.lg,
		padding: memberTheme.spacing.lg,
	},
	introIcon: {
		alignItems: 'center',
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.md,
		height: 48,
		justifyContent: 'center',
		width: 48,
	},
	introCopy: {
		flex: 1,
		marginLeft: memberTheme.spacing.md,
	},
	introTitle: {
		color: memberTheme.colors.ink,
		fontSize: 18,
	},
	introText: {
		color: memberTheme.colors.textMuted,
		fontSize: 13,
		marginTop: memberTheme.spacing.xs,
	},
	addGymCon: {
		height: 52,
		backgroundColor: memberTheme.colors.primaryDeep,
		borderRadius: memberTheme.radius.md,
		justifyContent: 'center',
		alignItems: 'center',
		margin: memberTheme.spacing.lg,
		...memberTheme.shadow,
	},
	addGymText: {
		fontSize: 15,
		marginHorizontal: config.metrics.xs,
	},
});
