import { memberTheme } from '@/theme/member';
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface MemberProgressRingProps extends PropsWithChildren {
	progress: number;
	size?: number;
	strokeWidth?: number;
	trackColor?: string;
	progressColor?: string;
}

const MemberProgressRing = ({
	progress,
	size = 150,
	strokeWidth = 12,
	trackColor = memberTheme.colors.surfaceSoft,
	progressColor = memberTheme.colors.primary,
	children,
}: MemberProgressRingProps) => {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const normalizedProgress = Math.min(Math.max(progress, 0), 1);

	return (
		<View style={{ width: size, height: size }}>
			<Svg width={size} height={size} style={styles.svg}>
				<Circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={trackColor}
					strokeWidth={strokeWidth}
					fill="none"
				/>
				<Circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					stroke={progressColor}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={`${circumference} ${circumference}`}
					strokeDashoffset={circumference * (1 - normalizedProgress)}
					fill="none"
				/>
			</Svg>
			<View style={styles.content}>{children}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	svg: {
		transform: [{ rotate: '-90deg' }],
	},
	content: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default MemberProgressRing;
