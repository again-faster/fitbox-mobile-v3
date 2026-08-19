import { MemberCard, MemberScreen, MemberText } from '@/components/member';
import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import { memberTheme } from '@/theme/member';
import type { TrainingStackParamList } from '@/types/navigation';
import type { StackScreenProps } from '@react-navigation/stack';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import { wellbeingPolicy } from '../features/wellnessFeaturePolicy';
import { useCustomWorkouts } from '../hooks/useCustomWorkouts';
import { useTrainingTabAvailability } from '../Tabs/useTrainingTabAvailability';
import TrainingTabShell from '../Tabs/TrainingTabShell';
import {
	buildTrainingMoreGroups,
	filterTrainingMoreGroups,
} from './trainingMoreItems';

type Props = StackScreenProps<TrainingStackParamList, 'TrainingMore'>;
type Route = keyof TrainingStackParamList;

const TrainingMore = ({ navigation }: Props) => {
	const session = getStoredWSSession();
	const { data: hasCustomWorkouts } = useCustomWorkouts();
	const { features } = useWorkoutStudio();
	const availability = useTrainingTabAvailability();
	const wellbeing = wellbeingPolicy(features);
	const allGroups = buildTrainingMoreGroups(
		{
			...features,
			wellness: wellbeing.showWellness,
			pain_reports: wellbeing.showPainReports,
			wearables: wellbeing.showWearables,
		},
		hasCustomWorkouts === true,
	);
	const groups = filterTrainingMoreGroups(
		allGroups,
		availability.visibleTabs,
	);

	const open = (route: Route) => navigation.navigate(route as never);

	return (
		<MemberScreen contentContainerStyle={styles.screenContent}>
			<TrainingTabShell selectedTab="more" navigation={navigation} />
			<ScrollView contentContainerStyle={styles.container}>
				<MemberCard style={styles.header}>
					<View style={styles.avatar}>
						<MemberText role="display" style={styles.avatarText}>
							{session?.user.full_name?.charAt(0).toUpperCase() ??
								'M'}
						</MemberText>
					</View>
					<View style={styles.headerCopy}>
						<MemberText role="label" style={styles.eyebrow}>
							WORKOUT STUDIO
						</MemberText>
						<MemberText role="screenTitle">
							{session?.user.full_name ?? 'My Training'}
						</MemberText>
						<MemberText role="body" muted>
							{session?.user.persona === 'solo'
								? 'Solo athlete'
								: 'Member'}{' '}
							training experience
						</MemberText>
					</View>
				</MemberCard>

				{groups.map(group => (
					<View key={group.title} style={styles.group}>
						<MemberText role="sectionTitle">
							{group.title}
						</MemberText>
						<MemberCard elevated={false} style={styles.groupCard}>
							{group.items.map((item, index) => (
								<Pressable
									key={item.label}
									style={[
										styles.row,
										index < group.items.length - 1 &&
											styles.rowBorder,
									]}
									onPress={() => open(item.route)}
									accessibilityRole="button"
									accessibilityLabel={item.label}
								>
									<View style={styles.icon}>
										<Ionicons
											name={item.icon}
											size={22}
											color={memberTheme.colors.primary}
										/>
									</View>
									<View style={styles.copy}>
										<MemberText role="label">
											{item.label}
										</MemberText>
										<MemberText role="meta" muted>
											{item.description}
										</MemberText>
									</View>
									<Ionicons
										name="chevron-right"
										size={20}
										color={memberTheme.colors.textMuted}
									/>
								</Pressable>
							))}
						</MemberCard>
					</View>
				))}

				<MemberText role="meta" muted style={styles.boundary}>
					Fitbox account and billing services remain available from
					the main app while Workout Studio integration continues.
				</MemberText>
			</ScrollView>
		</MemberScreen>
	);
};

const styles = StyleSheet.create({
	screenContent: { paddingHorizontal: 0 },
	container: {
		padding: memberTheme.spacing.lg,
		paddingBottom: 48,
		gap: memberTheme.spacing.xl,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: memberTheme.spacing.md,
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	avatar: {
		width: 56,
		height: 56,
		borderRadius: memberTheme.radius.pill,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.primary,
	},
	avatarText: { color: memberTheme.colors.surface },
	headerCopy: { flex: 1 },
	eyebrow: { color: memberTheme.colors.primary, letterSpacing: 0.9 },
	group: { gap: memberTheme.spacing.sm },
	groupCard: { padding: 0, overflow: 'hidden' },
	row: {
		minHeight: 76,
		flexDirection: 'row',
		alignItems: 'center',
		gap: memberTheme.spacing.md,
		paddingHorizontal: memberTheme.spacing.md,
	},
	rowBorder: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: memberTheme.colors.border,
	},
	icon: {
		width: 44,
		height: 44,
		borderRadius: memberTheme.radius.sm,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	copy: { flex: 1 },
	boundary: { paddingHorizontal: memberTheme.spacing.md },
});

export default TrainingMore;
