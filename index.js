// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/**
 * @format
 */

import { AppRegistry, Text } from 'react-native';
import 'react-native-gesture-handler';
import { name as appName } from './app.json';
import App from './src/App';

// AbortSignal.throwIfAborted is not available in JSC on Android < 13.
// ky calls it; patch it so requests don't throw.
if (
	typeof AbortSignal !== 'undefined' &&
	!AbortSignal.prototype.throwIfAborted
) {
	AbortSignal.prototype.throwIfAborted = function throwIfAborted() {
		if (this.aborted) {
			throw (
				this.reason ??
				new DOMException(
					'signal is aborted without reason',
					'AbortError',
				)
			);
		}
	};
}

if (Text.defaultProps == null) {
	Text.defaultProps = {};
	// @typescript-eslint/no-unsafe-member-access
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	Text.defaultProps.allowFontScaling = false;
}
AppRegistry.registerComponent(appName, () => App);
