import { TimeoutError } from 'ky';
import { Alert } from 'react-native';

export type ICatchError = Error | TimeoutError | string;

const some = (message: string, title = 'Alert') => {
	Alert.alert(title, message);
};

const ok = (message: string, title = 'Success') => {
	Alert.alert(title, message);
};

const okThen = (message: string, title = 'Success'): Promise<void> => {
	return new Promise<void>(resolve => {
		Alert.alert(title, message, [{ text: 'OK', onPress: () => resolve() }]);
	});
};

const warn = (message: string, title = 'Oops!') => {
	Alert.alert(title, message);
};

const err = (error: ICatchError, title = 'Error') => {
	if (error instanceof TimeoutError) {
		Alert.alert(
			title,
			'Request timed out. Please refresh the page or try again.',
		);
	} else {
		Alert.alert(title, error instanceof Error ? error.message : error);
	}
};

export default {
	some,
	ok,
	okThen,
	warn,
	err,
};
