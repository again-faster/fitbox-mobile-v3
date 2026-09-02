import { StyleSheet, View, useWindowDimensions } from "react-native";

import { memberTheme } from "@/theme/member";

import {
	DASHBOARD_EXPLORE_GRID_GAP,
	getDashboardExploreColumnCount,
	orderDashboardExploreItems,
} from "./DashboardExplore";
import DashboardActionButton from "./DashboardActionButton";

export interface DashboardActionGridItem {
	id: string | number;
	icon: string;
	text: string;
	onPress: () => void;
}

export const orderDashboardGridItems = (
	actions: readonly DashboardActionGridItem[],
	columns: 2 | 3,
): DashboardActionGridItem[] =>
	orderDashboardExploreItems(
		actions,
		columns,
		(action) => action.id === "leaderboard",
	);

interface DashboardActionGridProps {
	actions: readonly DashboardActionGridItem[];
	availableWidth?: number;
}

const DashboardActionGrid = ({
	actions,
	availableWidth,
}: DashboardActionGridProps) => {
	const { width: windowWidth } = useWindowDimensions();
	const contentWidth =
		availableWidth ?? windowWidth - memberTheme.spacing.lg * 2;
	const columns = getDashboardExploreColumnCount(
		actions.length,
		contentWidth,
	);
	const orderedActions = orderDashboardGridItems(actions, columns);
	const tileWidth =
		(contentWidth - DASHBOARD_EXPLORE_GRID_GAP * (columns - 1)) / columns;

	return (
		<View testID="dashboard-action-grid" style={styles.grid}>
			{orderedActions.map((action) => (
				<View
					key={action.id}
					testID={`dashboard-action-cell-${action.id}`}
					style={[
						styles.cell,
						{ width: tileWidth },
						action.id === "leaderboard" &&
						orderedActions.length === 1
							? styles.onlyLeaderboardCell
							: undefined,
					]}
				>
					<DashboardActionButton
						icon={action.icon}
						text={action.text}
						onPress={action.onPress}
						compact={columns === 3}
					/>
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	grid: {
		width: "100%",
		minWidth: 0,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: DASHBOARD_EXPLORE_GRID_GAP,
	},
	cell: {
		minWidth: 0,
	},
	onlyLeaderboardCell: {
		marginLeft: "auto",
	},
});

export default DashboardActionGrid;
