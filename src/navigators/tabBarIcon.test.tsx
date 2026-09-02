import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

import { tabBarIconRender } from './tabBarIcon';

describe('tab bar icons', () => {
	it('renders the Shop icon without an animation wrapper', () => {
		const icon = tabBarIconRender({
			route: 'Shop',
			color: '#ffffff',
			size: 24,
			loading: false,
		});

		expect(icon.type).toBe(Ionicons);
		expect(icon.props).toMatchObject({
			name: 'cart',
			size: 24,
			color: '#ffffff',
		});
	});
});
