// import 'whatwg-fetch';
import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

require('react-native-reanimated').setUpTests();

jest.mock('react-native-blob-util', () => ({
	fs: {
		readFile: jest.fn(),
	},
	config: jest.fn(() => ({ fetch: jest.fn() })),
}));

jest.mock('react-native-webview', () => {
	const { View } = require('react-native');

	return {
		__esModule: true,
		default: View,
		WebView: View,
	};
});

jest.mock('react-native-device-info', () =>
	require(
		// @ts-expect-error -- the package's supported Jest mock has no declaration file.
		'react-native-device-info/jest/react-native-device-info-mock',
	),
);

jest.mock('react-native-simple-toast', () => ({
	show: jest.fn(),
	SHORT: 0,
	LONG: 1,
}));

jest.mock('react-native-vision-camera', () => {
	const { View } = require('react-native');

	return {
		Camera: View,
		useCameraDevice: jest.fn(() => null),
		useCodeScanner: jest.fn(options => options),
	};
});
