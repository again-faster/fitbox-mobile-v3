import { SafeScreen } from '@/components/template';
import useStore from '@/zustand/Store';
import WebView from 'react-native-webview';

const Shop = () => {
	const shopUrl = useStore(state => state.shopUrl);

	return (
		<SafeScreen>
			<WebView source={{ uri: shopUrl }} />
		</SafeScreen>
	);
};

export default Shop;
