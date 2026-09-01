import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { MMKV } from "react-native-mmkv";

import getAttendanceGraph from "@/services/leaderboards/getAttendanceGraph";
import { ThemeProvider } from "@/theme";
import useStore from "@/zustand/Store";

import AttendanceScreen, {
	AttendanceGraphError,
	isAttendanceGraphError,
} from "./AttendanceScreen";

jest.mock("@/services/leaderboards/getAttendanceGraph", () => ({
	__esModule: true,
	default: jest.fn(),
}));

jest.mock("@/utils", () => ({
	Say: { err: jest.fn() },
}));

jest.mock("@/zustand/Store", () => ({
	__esModule: true,
	default: jest.fn(),
}));

jest.mock("./components/AttendanceHeader", () => {
	const mockReactNative =
		jest.requireActual<typeof import("react-native")>("react-native");
	const MockView = mockReactNative.View;
	return () => <MockView testID="attendance-header-mock" />;
});

jest.mock("./MonthlyAttendanceGoal", () => {
	const mockReactNative =
		jest.requireActual<typeof import("react-native")>("react-native");
	const MockView = mockReactNative.View;
	return () => <MockView testID="monthly-attendance-goal-mock" />;
});

jest.mock("react-native-dropdown-picker", () => {
	const mockReactNative =
		jest.requireActual<typeof import("react-native")>("react-native");
	const { Text, TouchableOpacity } = mockReactNative;

	return ({
		items,
		setValue,
	}: {
		items: { value: string }[];
		setValue: (value: string) => void;
	}) => (
		<TouchableOpacity
			accessibilityRole="button"
			accessibilityLabel="Change attendance year"
			onPress={() => {
				const firstItem = items[0];
				if (firstItem) {
					setValue(firstItem.value);
				}
			}}
		>
			<Text>Change attendance year</Text>
		</TouchableOpacity>
	);
});

jest.mock("react-native-safe-area-context", () => {
	const mockReactNative =
		jest.requireActual<typeof import("react-native")>("react-native");
	const MockView = mockReactNative.View;

	return {
		SafeAreaView: ({ children }: { children: ReactNode }) => (
			<MockView>{children}</MockView>
		),
	};
});

jest.mock("react-native-svg", () => ({
	Line: () => null,
}));

jest.mock("react-native-svg-charts", () => {
	const mockReactNative =
		jest.requireActual<typeof import("react-native")>("react-native");
	const { Text, View } = mockReactNative;

	const BarChart = ({ data }: { data: number[] }) => (
		<View testID="attendance-chart">
			<Text testID="attendance-chart-values">{data.join(",")}</Text>
		</View>
	);

	return { BarChart, XAxis: View, YAxis: View };
});

const mockedGetAttendanceGraph = getAttendanceGraph as jest.Mock;
const mockedUseStore = useStore as unknown as jest.Mock;
const currentYear = new Date().getFullYear().toString();
const previousYear = (Number(currentYear) - 1).toString();

const storeState = {
	attendanceReportState: {
		historicalAttendance: 0,
		lastMonth: 0,
		lastWeek: 0,
		lifetime: 0,
		lifetimeFitbox: 0,
		monthToDate: 0,
		weekToDate: 0,
		yearToDate: 0,
	},
	teamId: 1,
	loggedInUser: { user_data: { user_id: 2 } },
};

type GraphResponse = {
	data: { label: string; value: number }[];
	message: string;
	error: boolean;
};

const graphResponse = (
	data: GraphResponse["data"],
	error = false,
	message = "",
): GraphResponse => ({ data, message, error });

const deferred = <T,>() => {
	let resolve: (value: T) => void = () => undefined;
	const promise = new Promise<T>((resolvePromise) => {
		resolve = resolvePromise;
	});

	return { promise, resolve };
};

const renderAttendanceScreen = () =>
	render(
		<ThemeProvider storage={new MMKV()}>
			<AttendanceScreen
				navigation={{ goBack: jest.fn() } as never}
				route={{ key: "Attendance-test", name: "Attendance" } as never}
			/>
		</ThemeProvider>,
	);

beforeEach(() => {
	jest.clearAllMocks();
	mockedUseStore.mockImplementation(
		(selector: (state: typeof storeState) => unknown) =>
			selector(storeState),
	);
});

describe("AttendanceScreen graph loading", () => {
	it("renders a visible retry action for an HTTP-200 month graph error", async () => {
		mockedGetAttendanceGraph.mockImplementation((period: string) =>
			period === "year"
				? Promise.resolve(
						graphResponse([{ label: currentYear, value: 3 }]),
					)
				: Promise.resolve(
						graphResponse([], true, "Monthly graph unavailable"),
					),
		);

		const screen = renderAttendanceScreen();
		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});

		await waitFor(() =>
			expect(
				screen.getByText(
					"We couldn't load your monthly attendance chart.",
				),
			).toBeTruthy(),
		);

		const retry = screen.getByRole("button", { name: "Retry" });
		expect(retry).toBeTruthy();

		await act(async () => {
			fireEvent.press(retry);
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(mockedGetAttendanceGraph).toHaveBeenLastCalledWith(
			"month",
			currentYear,
		);
	});

	it("ignores an older month response after changing the year filter", async () => {
		const firstMonthResponse = deferred<GraphResponse>();
		const currentMonthResponse = deferred<GraphResponse>();

		mockedGetAttendanceGraph.mockImplementation(
			(period: string, year: string) => {
				if (period === "year") {
					return Promise.resolve(
						graphResponse([
							{ label: currentYear, value: 3 },
							{ label: previousYear, value: 4 },
						]),
					);
				}

				return year === currentYear
					? firstMonthResponse.promise
					: currentMonthResponse.promise;
			},
		);

		const screen = renderAttendanceScreen();

		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Change attendance year" }),
			).toBeTruthy(),
		);

		fireEvent.press(
			screen.getByRole("button", { name: "Change attendance year" }),
		);

		await waitFor(() =>
			expect(mockedGetAttendanceGraph).toHaveBeenCalledWith(
				"month",
				previousYear,
			),
		);

		act(() => {
			firstMonthResponse.resolve(
				graphResponse([{ label: "January", value: 99 }]),
			);
		});

		expect(screen.queryByTestId("attendance-chart")).toBeNull();
		expect(screen.queryByTestId("attendance-chart-values")).toBeNull();
		expect(screen.queryByText("99")).toBeNull();

		act(() => {
			currentMonthResponse.resolve(
				graphResponse([{ label: "January", value: 7 }]),
			);
		});

		await waitFor(() =>
			expect(
				screen.getByTestId("attendance-chart-values"),
			).toHaveTextContent("7"),
		);
		expect(
			screen.getByTestId("attendance-chart-values"),
		).not.toHaveTextContent("99");
	});

	it("clears the previous month summary while a new year is loading", async () => {
		const firstMonthResponse = deferred<GraphResponse>();
		const currentMonthResponse = deferred<GraphResponse>();

		mockedGetAttendanceGraph.mockImplementation(
			(period: string, year: string) => {
				if (period === "year") {
					return Promise.resolve(
						graphResponse([
							{ label: currentYear, value: 3 },
							{ label: previousYear, value: 4 },
						]),
					);
				}

				return year === currentYear
					? firstMonthResponse.promise
					: currentMonthResponse.promise;
			},
		);

		const screen = renderAttendanceScreen();

		await waitFor(() =>
			expect(
				screen.getByRole("button", { name: "Change attendance year" }),
			).toBeTruthy(),
		);

		await act(async () => {
			firstMonthResponse.resolve(
				graphResponse([{ label: "January", value: 11 }]),
			);
		});

		await waitFor(() =>
			expect(screen.getAllByText("11").length).toBeGreaterThan(0),
		);

		fireEvent.press(
			screen.getByRole("button", { name: "Change attendance year" }),
		);

		await waitFor(() =>
			expect(mockedGetAttendanceGraph).toHaveBeenCalledWith(
				"month",
				previousYear,
			),
		);

		expect(screen.queryAllByText("11")).toHaveLength(0);

		await act(async () => {
			currentMonthResponse.resolve(
				graphResponse([{ label: "January", value: 7 }]),
			);
		});

		await waitFor(() =>
			expect(screen.getAllByText("7").length).toBeGreaterThan(0),
		);
	});
});

describe("isAttendanceGraphError", () => {
	it("recognizes an HTTP-200 error response", () => {
		expect(
			isAttendanceGraphError({
				data: [],
				message: "Attendance graph unavailable",
				error: true,
			}),
		).toBe(true);
		expect(
			isAttendanceGraphError({
				data: [],
				message: "",
				error: false,
			}),
		).toBe(false);
	});
});

describe("AttendanceGraphError", () => {
	it("shows a visible yearly error and retries the requested graph", () => {
		const onRetry = jest.fn();
		const { getByRole, getByText } = render(
			<ThemeProvider storage={new MMKV()}>
				<AttendanceGraphError period="year" onRetry={onRetry} />
			</ThemeProvider>,
		);

		expect(
			getByText("We couldn't load your yearly attendance chart."),
		).toBeTruthy();

		fireEvent.press(getByRole("button", { name: "Retry" }));

		expect(onRetry).toHaveBeenCalledTimes(1);
	});
});
