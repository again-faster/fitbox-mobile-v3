import { Alert } from 'react-native';

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

const err = (error: string | Error, title = 'Error') => {
	Alert.alert(title, error instanceof Error ? error.message : error);
};

export default {
	some,
	ok,
	okThen,
	warn,
	err,
};
