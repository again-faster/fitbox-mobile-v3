import React, { useEffect, useRef, useState } from 'react';
import {
	AccessibilityInfo,
	Animated,
	StyleSheet,
	Text,
	View,
} from 'react-native';

export const PRBadge = ({
	visible,
}: {
	visible: boolean;
}): React.JSX.Element => {
	const scale = useRef(new Animated.Value(0.5)).current;
	const [reduceMotion, setReduceMotion] = useState(false);

	useEffect(() => {
		AccessibilityInfo.isReduceMotionEnabled()
			.then(setReduceMotion)
			.catch(() => {});
	}, []);

	useEffect(() => {
		if (!visible) return;
		if (reduceMotion) {
			scale.setValue(1);
			return;
		}
		scale.setValue(0.5);
		Animated.spring(scale, {
			toValue: 1,
			useNativeDriver: true,
		}).start();
	}, [visible, reduceMotion, scale]);

	if (!visible) {
		return <View style={styles.hidden} />;
	}

	return (
		<Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
			<Text style={styles.text}>🏆 New PR</Text>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	hidden: { height: 0, overflow: 'hidden' },
	badge: {
		backgroundColor: '#3B82F6',
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 20,
		alignItems: 'center',
		marginTop: 8,
	},
	text: {
		color: '#FFFFFF',
		fontSize: 17,
		fontWeight: '700',
	},
});
