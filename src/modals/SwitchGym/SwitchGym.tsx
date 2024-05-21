import { FlatList, Loader } from '@/components/molecules';
import { resetRoot } from '@/navigators/NavigationRef';
import { getUserGyms, updateUserProfile } from '@/services/users';
import { Gym } from '@/types/schemas/gym';
import { Say } from '@/utils';
import useStore from '@/zustand/Store';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import SelectGymItem from './components/SelectGymItem';

const SwitchGym = () => {
	const teamId = useStore(state => state.teamId);
	const clearClasses = useStore(state => state.clearClasses);
	const clearFilters = useStore(state => state.clearFilters);
	const clearStates = useStore(state => state.clearAppState);
	const [switching, setSwitching] = useState(false);

	const { data, isFetching, refetch } = useQuery({
		queryKey: ['startup'],
		queryFn: () => {
			return getUserGyms();
		},
	});

	const onSelectGym = useCallback((id: number) => {
		setSwitching(true);

		// update default_team_id using updateProfileData method
		updateUserProfile({ default_team_id: id })
			.then(res => {
				if (!res.error) {
					// clear calendar state
					clearClasses();

					// clear global state
					clearStates();

					// clear filter state
					clearFilters();

					// reset navigation to home
					resetRoot();
				} else {
					// Or return error
					Say.err(res.message);
				}
			})
			.finally(() => {
				setSwitching(false);
			});
	}, []);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const renderItem = useCallback(({ item }: any) => {
		const { id, logo, name } = item as Gym;

		return (
			<SelectGymItem
				id={id}
				onPress={() => onSelectGym(id)}
				image={logo}
				selected={teamId === id}
				text={name}
			/>
		);
	}, []);

	const sortedData = useMemo(() => {
		let useSortedData: Gym[] = [];

		if (data?.data) {
			useSortedData = data?.data.sort((a: Gym, b: Gym) => {
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
			<FlatList
				data={sortedData}
				refreshing={isFetching}
				renderItem={renderItem}
				loading={isFetching}
				onRefresh={() => void refetch()}
				useRefresh
			/>

			{switching && <Loader />}
		</View>
	);
};

export default SwitchGym;

const styles = StyleSheet.create({
	container: {},
});
