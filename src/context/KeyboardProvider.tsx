import { createContext, useEffect, useMemo, useState } from 'react';
import { ViewProps } from 'react-native';
import { KeyboardEvents } from 'react-native-keyboard-controller';

type Context = {
	isKeyboardVisible: boolean;
};

export const KeyboardVisibilityContext = createContext<Context | undefined>(
	undefined,
);

const KeyboardVisibilityProvider = ({ children }: ViewProps) => {
	const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);

	useEffect(() => {
		const keyboardWillShowListener = KeyboardEvents.addListener(
			'keyboardWillShow',
			() => setKeyboardVisible(true),
		);
		const keyboardWillHideListener = KeyboardEvents.addListener(
			'keyboardWillHide',
			() => setKeyboardVisible(false),
		);

		// Cleanup function
		return () => {
			keyboardWillShowListener.remove();
			keyboardWillHideListener.remove();
		};
	}, []);

	const value = useMemo(() => ({ isKeyboardVisible }), [isKeyboardVisible]);

	return (
		<KeyboardVisibilityContext.Provider value={value}>
			{children}
		</KeyboardVisibilityContext.Provider>
	);
};

export default KeyboardVisibilityProvider;
