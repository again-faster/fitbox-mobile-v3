import Ionicons from "react-native-vector-icons/MaterialCommunityIcons";
import MainTabIcon from "./MainTabIcon";

jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "Icon");

describe("MainTabIcon", () => {
	it("renders the cart as a static icon without an animation wrapper", () => {
		const element = MainTabIcon({
			name: "cart",
			size: 24,
			color: "#fff",
		});

		expect(element.type).toBe(Ionicons);
	});
});
