import { fireEvent, render } from "@testing-library/react-native";
import { MMKV } from "react-native-mmkv";

import { ThemeProvider } from "@/theme";

import { DASHBOARD_EXPLORE_GRID_GAP } from "./DashboardExplore";
import DashboardActionGrid, {
	orderDashboardGridItems,
} from "./DashboardActionGrid";

const storage = new MMKV();

describe("DashboardActionGrid", () => {
	it("renders a stable two-column grid and invokes the selected tile", () => {
		const onPress = jest.fn();
		const { getByRole, getByTestId } = render(
			<ThemeProvider storage={storage}>
				<DashboardActionGrid
					availableWidth={320}
					actions={[
						{
							id: "personal-training",
							icon: "user-clock",
							text: "Personal Training",
							onPress,
						},
					]}
				/>
			</ThemeProvider>,
		);

		expect(getByTestId("dashboard-action-grid")).toHaveStyle({
			flexDirection: "row",
			flexWrap: "wrap",
			gap: DASHBOARD_EXPLORE_GRID_GAP,
		});
		expect(
			getByTestId("dashboard-action-cell-personal-training"),
		).toHaveStyle({
			width: (320 - DASHBOARD_EXPLORE_GRID_GAP) / 2,
			minWidth: 0,
		});

		fireEvent.press(getByRole("button", { name: "Personal Training" }));
		expect(onPress).toHaveBeenCalledTimes(1);
	});

	it("uses dense square tiles when five actions fit three columns", () => {
		const actions = Array.from({ length: 5 }, (_, index) => ({
			id: `action-${index}`,
			icon: "star",
			text: `Action ${index}`,
			onPress: jest.fn(),
		}));
		const { getAllByRole, getByTestId } = render(
			<ThemeProvider storage={storage}>
				<DashboardActionGrid actions={actions} availableWidth={320} />
			</ThemeProvider>,
		);

		expect(getByTestId("dashboard-action-cell-action-0")).toHaveStyle({
			width: (320 - DASHBOARD_EXPLORE_GRID_GAP * 2) / 3,
		});
		expect(getAllByRole("button")[0]).toHaveStyle({ aspectRatio: 1 });
	});

	it("places Leaderboard after the first configured action in two columns", () => {
		const actions = [
			{
				id: "leaderboard",
				icon: "trophy",
				text: "Leaderboard",
				onPress: jest.fn(),
			},
			{
				id: "class-filter-11",
				icon: "dumbbell",
				text: "Class 11",
				onPress: jest.fn(),
			},
			{
				id: "class-filter-12",
				icon: "dumbbell",
				text: "Class 12",
				onPress: jest.fn(),
			},
		] as const;

		expect(
			orderDashboardGridItems(actions, 2).map((action) => action.id),
		).toEqual(["class-filter-11", "leaderboard", "class-filter-12"]);
	});

	it("preserves ordinary non-Leaderboard order", () => {
		const actions = [
			{
				id: "class-filter-11",
				icon: "dumbbell",
				text: "Class 11",
				onPress: jest.fn(),
			},
			{
				id: "class-filter-12",
				icon: "dumbbell",
				text: "Class 12",
				onPress: jest.fn(),
			},
		] as const;

		expect(
			orderDashboardGridItems(actions, 2).map((action) => action.id),
		).toEqual(["class-filter-11", "class-filter-12"]);
	});

	it("places Leaderboard after two configured actions in three columns", () => {
		const actions = [
			{
				id: "leaderboard",
				icon: "trophy",
				text: "Leaderboard",
				onPress: jest.fn(),
			},
			{
				id: "class-filter-11",
				icon: "dumbbell",
				text: "Class 11",
				onPress: jest.fn(),
			},
			{
				id: "class-filter-12",
				icon: "dumbbell",
				text: "Class 12",
				onPress: jest.fn(),
			},
			{
				id: "class-filter-13",
				icon: "dumbbell",
				text: "Class 13",
				onPress: jest.fn(),
			},
		] as const;

		expect(
			orderDashboardGridItems(actions, 3).map((action) => action.id),
		).toEqual([
			"class-filter-11",
			"class-filter-12",
			"leaderboard",
			"class-filter-13",
		]);
	});

	it("aligns an only-Leaderboard cell to the right", () => {
		const { getByTestId } = render(
			<ThemeProvider storage={storage}>
				<DashboardActionGrid
					actions={[
						{
							id: "leaderboard",
							icon: "trophy",
							text: "Leaderboard",
							onPress: jest.fn(),
						},
					]}
				/>
			</ThemeProvider>,
		);

		expect(getByTestId("dashboard-action-cell-leaderboard")).toHaveStyle({
			marginLeft: "auto",
		});
	});
});
