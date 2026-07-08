import { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

const COLORS = [
	'#3B82F6',
	'#F59E0B',
	'#10B981',
	'#EF4444',
	'#8B5CF6',
	'#F97316',
	'#EC4899',
];

type PieceConfig = {
	id: number;
	startX: number;
	w: number;
	h: number;
	color: string;
	delay: number;
	duration: number;
	driftX: number;
	totalRotation: number;
};

const makePieces = (): PieceConfig[] =>
	Array.from({ length: 55 }, (_, i) => {
		const size = 7 + Math.random() * 7;
		return {
			id: i,
			startX: Math.random() * W,
			w: size,
			h: size * (0.4 + Math.random() * 0.4),
			color:
				COLORS[Math.floor(Math.random() * COLORS.length)] ?? '#3B82F6',
			delay: Math.random() * 600,
			duration: 1400 + Math.random() * 900,
			driftX: (Math.random() - 0.5) * 120,
			totalRotation: (3 + Math.random() * 5) * Math.PI * 2,
		};
	});

const rm = { reduceMotion: ReduceMotion.System } as const;

const ConfettiPiece = ({ c }: { c: PieceConfig }): React.JSX.Element => {
	const y = useSharedValue(-20);
	const x = useSharedValue(0);
	const opacity = useSharedValue(1);
	const rotate = useSharedValue(0);

	useEffect(() => {
		y.value = withDelay(
			c.delay,
			withTiming(H + 20, { duration: c.duration, ...rm }),
		);
		x.value = withDelay(
			c.delay,
			withTiming(c.driftX, { duration: c.duration, ...rm }),
		);
		rotate.value = withDelay(
			c.delay,
			withTiming(c.totalRotation, { duration: c.duration, ...rm }),
		);
		opacity.value = withDelay(
			c.delay + c.duration * 0.65,
			withTiming(0, { duration: c.duration * 0.35, ...rm }),
		);
		// shared values are stable refs — safe to omit from deps
	}, []);

	const animStyle = useAnimatedStyle(() => ({
		transform: [
			{ translateY: y.value },
			{ translateX: x.value },
			{ rotate: `${rotate.value}rad` },
		],
		opacity: opacity.value,
	}));

	return (
		<Animated.View
			style={[
				styles.piece,
				{
					left: c.startX,
					width: c.w,
					height: c.h,
					backgroundColor: c.color,
				},
				animStyle,
			]}
		/>
	);
};

const Confetti = (): React.JSX.Element => {
	const pieces = useMemo(makePieces, []);

	return (
		<View style={StyleSheet.absoluteFill} pointerEvents="none">
			{pieces.map(c => (
				<ConfettiPiece key={c.id} c={c} />
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	piece: {
		position: 'absolute',
		top: 0,
		borderRadius: 2,
	},
});

export default Confetti;
