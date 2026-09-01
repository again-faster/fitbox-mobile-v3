import { memberTheme } from '@/theme/member';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, {
	Defs,
	LinearGradient,
	Rect,
	Stop,
} from 'react-native-svg';

interface AttendanceHeaderProps {
	onBack: () => void;
}

const AttendanceHeader = ({ onBack }: AttendanceHeaderProps) => (
	<View style={styles.header}>
		<Svg
			style={StyleSheet.absoluteFillObject}
			pointerEvents="none"
			testID="attendance-header-gradient"
		>
			<Defs>
				<LinearGradient
					id="attendance-header-gradient-fill"
					x1="0"
					y1="0"
					x2="1"
					y2="1"
				>
					<Stop
						offset="0%"
						stopColor={memberTheme.colors.primary}
						stopOpacity="1"
					/>
					<Stop
						offset="100%"
						stopColor="#4F9CEB"
						stopOpacity="1"
					/>
				</LinearGradient>
			</Defs>
			<Rect
				x="0"
				y="0"
				width="100%"
				height="100%"
				fill="url(#attendance-header-gradient-fill)"
			/>
		</Svg>
		<TouchableOpacity
			style={styles.backButton}
			onPress={onBack}
			activeOpacity={0.8}
			accessibilityRole="button"
			accessibilityLabel="Go back"
		>
			<Icon name="arrow-left" size={24} color="#FFFFFF" />
		</TouchableOpacity>
		<View style={styles.copy}>
			<Text style={styles.title}>Attendance</Text>
			<Text style={styles.subtitle}>
				Track your visits and build consistency.
			</Text>
		</View>
	</View>
);

const styles = StyleSheet.create({
	header: {
		backgroundColor: memberTheme.colors.primary,
		overflow: 'hidden',
		paddingHorizontal: memberTheme.spacing.lg,
		paddingTop: memberTheme.spacing.md,
		paddingBottom: memberTheme.spacing.xl,
	},
	backButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(255,255,255,0.16)',
	},
	copy: {
		marginTop: memberTheme.spacing.lg,
	},
	title: {
		fontSize: 30,
		lineHeight: 36,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	subtitle: {
		fontSize: 14,
		lineHeight: 21,
		color: 'rgba(255,255,255,0.82)',
		marginTop: memberTheme.spacing.xs,
	},
});

export default AttendanceHeader;
