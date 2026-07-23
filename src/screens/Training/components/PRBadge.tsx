import React, { useEffect, useRef, useState } from 'react';
import {
	AccessibilityInfo,
	Animated,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { trainingTheme } from '@/theme/training';

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
		<Animated.View
			style={[styles.badge, { transform: [{ scale }] }]}
			accessibilityRole="text"
			accessibilityLabel="New personal record"
		>
			<Ionicons
				name="trophy"
				size={20}
				color={trainingTheme.colors.surface}
			/>
			<Text style={styles.text}>New PR</Text>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	hidden: { height: 0, overflow: 'hidden' },
	badge: {
		backgroundColor: trainingTheme.colors.primary,
		borderRadius: trainingTheme.radius.md,
		paddingVertical: trainingTheme.spacing.md,
		paddingHorizontal: trainingTheme.spacing.lg,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		gap: trainingTheme.spacing.sm,
		marginTop: trainingTheme.spacing.sm,
	},
	text: {
		color: trainingTheme.colors.surface,
		fontSize: 17,
		fontWeight: '700',
	},
});
