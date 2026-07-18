import NetInfo, { useNetInfo } from '@react-native-community/netinfo';

export const useTrainingConnectivity = () => {
	const state = useNetInfo();
	const isOffline =
		state.isConnected === false || state.isInternetReachable === false;
	const isChecking =
		state.isConnected == null || state.isInternetReachable == null;

	return {
		isOffline,
		isChecking,
		refresh: () => NetInfo.refresh(),
	};
};
