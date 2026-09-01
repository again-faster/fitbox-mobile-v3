import { StyleSheet, View } from 'react-native';

import { memberTheme } from '@/theme/member';

import DashboardActionButton from './DashboardActionButton';

export type DashboardExploreDestination =
	| { tab: 'Calendar' | 'Shop' }
	| {
			tab: 'TrainingStack';
			screen: 'TrainingPT' | 'TrainingResults';
	  };

export interface DashboardExploreAction {
	id: string;
	icon: string;
	text: string;
	destination: DashboardExploreDestination;
}

export type DashboardExploreNavigation =
	| { screen: 'Calendar' | 'Shop' }
	| {
			screen: 'TrainingStack';
			params: { screen: 'TrainingPT' | 'TrainingResults' };
	  };

export interface DashboardActionGridItem {
	id: string | number;
	icon: string;
	text: string;
	onPress: () => void;
}

const groupClassesAction: DashboardExploreAction = {
	id: 'group-classes',
	icon: 'users',
	text: 'Group Classes',
	destination: { tab: 'Calendar' },
};

const personalTrainingAction: DashboardExploreAction = {
	id: 'personal-training',
	icon: 'user-clock',
	text: 'Personal Training',
	destination: { tab: 'TrainingStack', screen: 'TrainingPT' },
};

const leaderboardAction: DashboardExploreAction = {
	id: 'leaderboard',
	icon: 'trophy',
	text: 'Leaderboard',
	destination: { tab: 'TrainingStack', screen: 'TrainingResults' },
};

const extrasAction: DashboardExploreAction = {
	id: 'extras',
	icon: 'shopping-bag',
	text: 'Extras',
	destination: { tab: 'Shop' },
};

const allClassesAction: DashboardExploreAction = {
	id: 'all-classes',
	icon: 'calendar-alt',
	text: 'All classes',
	destination: { tab: 'Calendar' },
};

export const getDashboardExploreActions = (
	hasShop: boolean,
	classesAvailable = true,
	bookingsAvailable = true,
	resultsAvailable = true,
): DashboardExploreAction[] => [
	...(classesAvailable ? [groupClassesAction] : []),
	...(bookingsAvailable ? [personalTrainingAction] : []),
	...(resultsAvailable ? [leaderboardAction] : []),
	...(hasShop ? [extrasAction] : []),
	...(classesAvailable ? [allClassesAction] : []),
];

export const getDashboardExploreNavigation = (
	destination: DashboardExploreDestination,
): DashboardExploreNavigation =>
	destination.tab === 'TrainingStack'
		? {
				screen: 'TrainingStack',
				params: { screen: destination.screen },
			}
		: { screen: destination.tab };

interface DashboardActionGridProps {
	actions: readonly DashboardActionGridItem[];
}

const DashboardActionGrid = ({ actions }: DashboardActionGridProps) => (
	<View testID="dashboard-action-grid" style={styles.grid}>
		{actions.map(action => (
			<View
				key={action.id}
				testID={`dashboard-action-cell-${action.id}`}
				style={styles.cell}
			>
				<DashboardActionButton
					icon={action.icon}
					text={action.text}
					onPress={action.onPress}
				/>
			</View>
		))}
	</View>
);

const styles = StyleSheet.create({
	grid: {
		width: '100%',
		minWidth: 0,
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
	},
	cell: {
		width: '48%',
		minWidth: 0,
		marginBottom: memberTheme.spacing.md,
	},
});

export default DashboardActionGrid;
