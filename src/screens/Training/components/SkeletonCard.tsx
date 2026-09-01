import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { MemberCard } from '@/components/member';
import { memberTheme } from '@/theme/member';

const AnimatedMemberCard = Animated.createAnimatedComponent(MemberCard);

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
		<AnimatedMemberCard style={[styles.card, { opacity }]} elevated={false}>
			<View style={styles.line} />
			<View style={[styles.line, styles.short]} />
		</AnimatedMemberCard>
	);
};

const styles = StyleSheet.create({
	card: { marginBottom: memberTheme.spacing.sm, gap: memberTheme.spacing.sm },
	line: {
		height: 14,
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderRadius: 7,
	},
	short: {
		width: '60%',
	},
});

export default SkeletonCard;
