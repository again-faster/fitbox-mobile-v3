import { createContext, useEffect, useMemo, useState } from 'react';
import { Keyboard, KeyboardStatic, ViewProps } from 'react-native';

type Context = {
	isKeyboardVisible: boolean;
	keyboard: KeyboardStatic;
};

export const KeyboardVisibilityContext = createContext<Context | undefined>(
	undefined,
);

const KeyboardVisibilityProvider = ({ children }: ViewProps) => {
	const [isKeyboardVisible, setKeyboardVisible] = useState<boolean>(false);

	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener(
			'keyboardDidShow',
			() => setKeyboardVisible(true),
		);
		const keyboardDidHideListener = Keyboard.addListener(
			'keyboardDidHide',
			() => setKeyboardVisible(false),
		);

		// Cleanup function
		return () => {
			keyboardDidShowListener.remove();
			keyboardDidHideListener.remove();
		};
	}, []);

	const value = useMemo(
		() => ({ isKeyboardVisible, keyboard: Keyboard }),
		[isKeyboardVisible, Keyboard],
	);

	return (
		<KeyboardVisibilityContext.Provider value={value}>
			{children}
		</KeyboardVisibilityContext.Provider>
	);
};

export default KeyboardVisibilityProvider;
