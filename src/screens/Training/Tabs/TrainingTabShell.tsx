import { useEffect } from 'react';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { TrainingStackParamList } from '@/types/navigation';
import TrainingTabBar from './TrainingTabBar';
import {
	fallbackTrainingTab,
	visibleTabsDuringLoading,
	type TrainingTabKey,
} from './trainingTabs';
import { useTrainingTabAvailability } from './useTrainingTabAvailability';

type Navigation = Pick<StackNavigationProp<TrainingStackParamList>, 'replace'>;

type Props = {
	selectedTab: TrainingTabKey;
	navigation: Navigation;
};

const TrainingTabShell = ({ selectedTab, navigation }: Props) => {
	const availability = useTrainingTabAvailability();
	const visibleTabs =
		availability.status === 'loading'
			? visibleTabsDuringLoading(availability.visibleTabs, selectedTab)
			: availability.visibleTabs;
	const visibleSelectedTab = fallbackTrainingTab(selectedTab, visibleTabs);

	useEffect(() => {
		if (
			availability.status === 'ready' &&
			selectedTab !== 'today' &&
			visibleSelectedTab === 'today'
		) {
			navigation.replace('TrainingToday');
		}
	}, [availability.status, navigation, selectedTab, visibleSelectedTab]);

	return (
		<TrainingTabBar
			visibleTabs={visibleTabs}
			selectedTab={visibleSelectedTab}
			navigation={navigation}
		/>
	);
};

export default TrainingTabShell;
