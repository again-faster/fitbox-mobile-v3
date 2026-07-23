import { getStoredWSSession } from '@/services/workoutStudio/auth';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCustomWorkouts } from '../hooks/useCustomWorkouts';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingMore'>;
type Route = keyof TrainingStackParamList;
type Item = { label: string; description: string; icon: string; route: Route };

const TrainingMore = ({ navigation }: Props) => {
	const session = getStoredWSSession();
	const { data: hasCustomWorkouts } = useCustomWorkouts();
	const canBuild = session?.user.persona === 'solo' || hasCustomWorkouts;
	const groups: Array<{ title: string; items: Item[] }> = [
		{
			title: 'Training',
			items: [
				{
					label: 'Workouts',
					description: 'Assignments and benchmarks',
					icon: 'clipboard-text-outline',
					route: 'TrainingWorkouts',
				},
				{
					label: 'My Progress',
					description: 'Results, PRs, maxes and recap',
					icon: 'chart-line',
					route: 'TrainingProgress',
				},
				{
					label: 'Wellness',
					description: 'Check-ins, trends and injuries',
					icon: 'heart-pulse',
					route: 'TrainingWellness',
				},
			],
		},
		{
			title: 'Bookings',
			items: [
				{
					label: 'Book services',
					description: 'PT, treatments, resources and My Bookings',
					icon: 'calendar-check-outline',
					route: 'TrainingPT',
				},
			],
		},
		{
			title: 'Community',
			items: [
				{
					label: 'Coach Notes',
					description: 'Feedback from your coaches',
					icon: 'message-text-outline',
					route: 'TrainingCoachNotes',
				},
				{
					label: 'Gym Feed',
					description: 'Recent member results',
					icon: 'account-group-outline',
					route: 'TrainingGymFeed',
				},
			],
		},
		{
			title: 'My training',
			items: [
				{
					label: 'Training Profile',
					description: 'Scaling level and rep maxes',
					icon: 'account-cog-outline',
					route: 'TrainingProfile',
				},
				{
					label: 'Wearables',
					description: 'Connections, sync and readiness',
					icon: 'watch-variant',
					route: 'TrainingWearables',
				},
				...(canBuild
					? [
							{
								label: 'Custom Workouts',
								description: 'Build and schedule workouts',
								icon: 'pencil-ruler',
								route: 'TrainingBuildList' as Route,
							},
						]
					: []),
			],
		},
		{
			title: 'Preferences',
			items: [
				{
					label: 'Notifications',
					description: 'Training updates and activity',
					icon: 'bell-outline',
					route: 'TrainingNotifications',
				},
				{
					label: 'Settings',
					description: 'Units, timer, privacy and account',
					icon: 'cog-outline',
					route: 'TrainingSettings',
				},
			],
		},
	];

	const open = (route: Route) => navigation.navigate(route as never);

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
		>
			<View style={styles.header}>
				<View style={styles.avatar}>
					<Text style={styles.avatarText}>
						{session?.user.full_name?.charAt(0).toUpperCase() ??
							'M'}
					</Text>
				</View>
				<View style={styles.headerCopy}>
					<Text style={styles.eyebrow}>WORKOUT STUDIO</Text>
					<Text style={styles.title}>
						{session?.user.full_name ?? 'My Training'}
					</Text>
					<Text style={styles.subtitle}>
						{session?.user.persona === 'solo'
							? 'Solo athlete'
							: 'Member'}{' '}
						training experience
					</Text>
				</View>
			</View>

			{groups.map(group => (
				<View key={group.title} style={styles.group}>
					<Text style={styles.groupTitle}>{group.title}</Text>
					<View style={styles.card}>
						{group.items.map((item, index) => (
							<TouchableOpacity
								key={item.label}
								accessibilityRole="button"
								onPress={() => open(item.route)}
								style={[
									styles.row,
									index < group.items.length - 1 &&
										styles.rowBorder,
								]}
							>
								<View style={styles.icon}>
									<Ionicons
										name={item.icon}
										size={22}
										color={trainingTheme.colors.primary}
									/>
								</View>
								<View style={styles.copy}>
									<Text style={styles.label}>
										{item.label}
									</Text>
									<Text style={styles.description}>
										{item.description}
									</Text>
								</View>
								<Ionicons
									name="chevron-right"
									size={20}
									color={trainingTheme.colors.textMuted}
								/>
							</TouchableOpacity>
						))}
					</View>
				</View>
			))}

			<View style={styles.boundaryCard}>
				<Ionicons
					name="information-outline"
					size={18}
					color={trainingTheme.colors.textMuted}
				/>
				<Text style={styles.boundary}>
					Fitbox account and billing services remain available from
					the main app while Workout Studio integration continues.
				</Text>
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screen: { backgroundColor: trainingTheme.colors.background },
	container: {
		padding: trainingTheme.spacing.lg,
		paddingBottom: 48,
		gap: trainingTheme.spacing.xl,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		backgroundColor: trainingTheme.colors.primarySoft,
		...trainingTheme.shadow,
	},
	avatar: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primary,
	},
	avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
	headerCopy: { flex: 1 },
	eyebrow: {
		color: trainingTheme.colors.primary,
		fontSize: 10,
		fontWeight: '800',
		letterSpacing: 0.9,
		marginBottom: 3,
	},
	title: {
		color: trainingTheme.colors.text,
		fontSize: 22,
		fontWeight: '700',
	},
	subtitle: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		marginTop: 3,
	},
	group: { gap: trainingTheme.spacing.sm },
	groupTitle: {
		color: trainingTheme.colors.text,
		fontSize: 17,
		fontWeight: '700',
		marginLeft: 3,
	},
	card: {
		overflow: 'hidden',
		borderRadius: trainingTheme.radius.lg,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		backgroundColor: trainingTheme.colors.surface,
		...trainingTheme.shadow,
	},
	row: {
		minHeight: 76,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
		paddingHorizontal: trainingTheme.spacing.md,
	},
	rowBorder: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: trainingTheme.colors.border,
	},
	icon: {
		width: 44,
		height: 44,
		borderRadius: trainingTheme.radius.sm,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: trainingTheme.colors.primarySoft,
	},
	copy: { flex: 1 },
	label: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '700',
	},
	description: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 3,
	},
	boundaryCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: trainingTheme.spacing.sm,
		paddingHorizontal: trainingTheme.spacing.md,
	},
	boundary: {
		flex: 1,
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 18,
	},
});

export default TrainingMore;
