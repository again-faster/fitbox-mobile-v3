jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "Icon");
jest.mock("@/services/workoutStudio/notifications", () => ({
	getMemberNotifications: jest.fn(),
	markAllNotificationsRead: jest.fn(),
	markNotificationRead: jest.fn(),
}));
jest.mock("@/services/workoutStudio/auth", () => ({
	getStoredWSSession: jest.fn(),
}));
jest.mock("@tanstack/react-query", () => ({
	useMutation: jest.fn(),
	useQuery: jest.fn(),
	useQueryClient: jest.fn(),
}));

import { createElement } from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StackScreenProps } from "@react-navigation/stack";
import { getStoredWSSession } from "@/services/workoutStudio/auth";
import type { MemberNotification } from "@/services/workoutStudio/notifications";
import type { TrainingStackParamList } from "@/types/navigation";
import NotificationsInbox, {
	hasMemberNotificationSession,
	notificationInboxStateCopy,
	notificationInboxViewState,
	notificationAccessibilityLabel,
	shouldEnableNotificationQuery,
} from "./NotificationsInbox";

const mockedUseMutation = jest.mocked(useMutation);
const mockedUseQuery = jest.mocked(useQuery);
const mockedUseQueryClient = jest.mocked(useQueryClient);
const mockedGetStoredWSSession = jest.mocked(getStoredWSSession);

const memberSession = {
	user: {
		id: "member-1",
		persona: "member" as const,
		active_tenant_id: "tenant-1",
	},
};

const notificationsRoute: StackScreenProps<
	TrainingStackParamList,
	"TrainingNotifications"
>["route"] = {
	key: "NotificationsTest",
	name: "TrainingNotifications",
	params: undefined,
};

const notifications: MemberNotification[] = [
	{
		id: "notification-1",
		title: "New workout",
		body: "A new workout is ready.",
		kind: "assignment",
		entity_id: "workout-1",
		link: "https://internal.example/workout-1",
		read_at: null,
		created_at: "2026-08-09T00:00:00.000Z",
	},
	{
		id: "notification-2",
		title: "Coach follow-up",
		body: "Your coach left a note.",
		kind: "coach_note",
		entity_id: null,
		link: null,
		read_at: "2026-08-08T00:00:00.000Z",
		created_at: "2026-08-08T00:00:00.000Z",
	},
];

const weeklyRecapNotification: MemberNotification = {
	id: "notification-recap-1",
	title: "Your weekly recap is ready",
	body: "See how your training week came together.",
	kind: "weekly_recap",
	entity_id: null,
	link: null,
	read_at: null,
	created_at: "2026-08-10T00:00:00.000Z",
};

const markReadMutation = {
	mutate: jest.fn(),
	isPending: false,
	isError: false,
};
const markAllMutation = {
	mutate: jest.fn(),
	isPending: false,
	isError: false,
};

const queryResult = (data: MemberNotification[] = notifications) => ({
	data,
	isLoading: false,
	isRefetching: false,
	isError: false,
	refetch: jest.fn(),
});

describe("Notifications Inbox", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetStoredWSSession.mockReturnValue(memberSession as never);
		mockedUseQuery.mockReturnValue(queryResult() as never);
		mockedUseMutation
			.mockReturnValueOnce(markReadMutation as never)
			.mockReturnValueOnce(markAllMutation as never);
		mockedUseQueryClient.mockReturnValue({
			invalidateQueries: jest.fn(),
		} as never);
	});

	it("requires an authenticated member session for the inbox query", () => {
		expect(hasMemberNotificationSession(null)).toBe(false);
		expect(
			hasMemberNotificationSession({
				user: {
					id: "solo-1",
					persona: "solo",
					active_tenant_id: "tenant-1",
				},
			} as never),
		).toBe(false);
		expect(hasMemberNotificationSession(memberSession as never)).toBe(true);
		expect(shouldEnableNotificationQuery(null)).toBe(false);
		expect(shouldEnableNotificationQuery(memberSession as never)).toBe(
			true,
		);
	});

	it.each(["loading", "error", "empty", "ready"] as const)(
		"keeps the %s state explicit and privacy-safe",
		(state) => {
			const copy = notificationInboxStateCopy(state);
			expect(copy.state).toBe(state);
			expect(copy.title).toBeTruthy();
			expect(copy.detail).toBeTruthy();
			expect(copy.detail).not.toMatch(/backend|payload|secret/i);
		},
	);

	it("maps query conditions to typed inbox states", () => {
		expect(notificationInboxViewState(false, false, false, [])).toBe(
			"empty",
		);
		expect(notificationInboxViewState(true, true, false, undefined)).toBe(
			"loading",
		);
		expect(notificationInboxViewState(true, false, true, undefined)).toBe(
			"error",
		);
		expect(notificationInboxViewState(true, false, false, [])).toBe(
			"empty",
		);
		expect(
			notificationInboxViewState(true, false, false, notifications),
		).toBe("ready");
	});

	it("renders unread and read presentation without exposing links or ids", () => {
		const screen = render(
			createElement(NotificationsInbox, {
				navigation: { navigate: jest.fn(), goBack: jest.fn() } as never,
				route: notificationsRoute,
			}),
		);

		expect(screen.getByText("YOUR UPDATES")).toBeTruthy();
		expect(screen.getByText("1 unread notification")).toBeTruthy();
		expect(screen.getByText("New workout")).toBeTruthy();
		expect(screen.getByText("Coach follow-up")).toBeTruthy();
		expect(
			screen.getByLabelText(
				/Unread notification.*New workout.*A new workout/,
			),
		).toBeTruthy();
		expect(
			screen.getByLabelText(/Read notification.*Coach follow-up/),
		).toBeTruthy();
		expect(screen.queryByText(/internal\.example|workout-1/)).toBeNull();
		expect(notificationAccessibilityLabel(notifications[0]!)).not.toMatch(
			/internal\.example|workout-1/,
		);
	});

	it("marks only unread items and supports mark-all safely", () => {
		const screen = render(
			createElement(NotificationsInbox, {
				navigation: { navigate: jest.fn(), goBack: jest.fn() } as never,
				route: notificationsRoute,
			}),
		);

		fireEvent.press(
			screen.getByLabelText(/Unread notification.*New workout/),
		);
		expect(markReadMutation.mutate).toHaveBeenCalledWith("notification-1");

		fireEvent.press(screen.getByLabelText("Mark all notifications read"));
		expect(markAllMutation.mutate).toHaveBeenCalledTimes(1);
	});

	it("opens the weekly recap from a server-generated notification", () => {
		const navigation = { navigate: jest.fn(), goBack: jest.fn() };
		mockedUseQuery.mockReturnValue(
			queryResult([weeklyRecapNotification]) as never,
		);

		const screen = render(
			createElement(NotificationsInbox, {
				navigation: navigation as never,
				route: notificationsRoute,
			}),
		);

		fireEvent.press(
			screen.getByLabelText(/Unread notification.*weekly recap/i),
		);
		expect(navigation.navigate).toHaveBeenCalledWith("TrainingWeeklyRecap");
	});

	it("does not enable or invoke notification access when signed out", () => {
		mockedGetStoredWSSession.mockReturnValue(null);

		const screen = render(
			createElement(NotificationsInbox, {
				navigation: { navigate: jest.fn(), goBack: jest.fn() } as never,
				route: notificationsRoute,
			}),
		);

		expect(mockedUseQuery.mock.calls[0]?.[0].enabled).toBe(false);
		expect(screen.getByText("Notifications unavailable")).toBeTruthy();
		expect(markReadMutation.mutate).not.toHaveBeenCalled();
		expect(markAllMutation.mutate).not.toHaveBeenCalled();
	});
});
