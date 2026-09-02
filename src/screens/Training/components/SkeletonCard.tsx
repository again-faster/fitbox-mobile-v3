import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { trainingTheme } from '@/theme/training';

const SkeletonCard = () => {
	const opacity = useRef(new Animated.Value(0.3)).current;

	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, {
					toValue: 1,
					duration: 800,
					useNativeDriver: true,
				}),
				Animated.timing(opacity, {
					toValue: 0.3,
					duration: 800,
					useNativeDriver: true,
				}),
			]),
		).start();
	}, [opacity]);

	return (
		<Animated.View style={[styles.card, { opacity }]}>
			<View style={styles.line} />
			<View style={[styles.line, styles.short]} />
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	card: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.sm,
		gap: trainingTheme.spacing.sm,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
	},
	line: {
		height: 14,
		backgroundColor: trainingTheme.colors.surfaceMuted,
		borderRadius: 7,
	},
	short: {
		width: '60%',
	},
});

export default SkeletonCard;
