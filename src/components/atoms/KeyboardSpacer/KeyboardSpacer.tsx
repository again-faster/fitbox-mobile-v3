import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, View } from 'react-native';

const KeyboardSpacer = () => {
	const [keyboardHeight, setKeyboardHeight] = useState<number>(0);

	const onKeyboardShow = (event: KeyboardEvent) => {
		setKeyboardHeight(event.endCoordinates.height - 70);
	};

	const onKeyboardHide = () => {
		setKeyboardHeight(0);
	};

	useEffect(() => {
		const onShow = Keyboard.addListener('keyboardDidShow', onKeyboardShow);
		const onHide = Keyboard.addListener('keyboardDidHide', onKeyboardHide);

		return () => {
			onShow.remove();
			onHide.remove();
		};
	}, []);
	return <View style={{ marginBottom: keyboardHeight }} />;
};

export default KeyboardSpacer;
