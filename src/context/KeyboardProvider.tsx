import { createContext, useEffect, useMemo, useState } from 'react';
import { Keyboard, ViewProps } from 'react-native';

type Context = {
	isKeyboardVisible: boolean;
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

	const value = useMemo(() => ({ isKeyboardVisible }), [isKeyboardVisible]);

	return (
		<KeyboardVisibilityContext.Provider value={value}>
			{children}
		</KeyboardVisibilityContext.Provider>
	);
};

export default KeyboardVisibilityProvider;
