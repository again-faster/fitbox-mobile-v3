import { MemberCard, MemberScreen } from '@/components/member';
import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';
import { memberTheme } from '@/theme/member';
import type { TrainingStackScreenProps } from '@/types/navigation';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';
import TrainingTabShell from '../Tabs/TrainingTabShell';
import { wellbeingPolicy } from '../features/wellnessFeaturePolicy';

type Props = TrainingStackScreenProps<'TrainingWellnessHub'>;

type Action = {
	label: string;
	description: string;
	icon: string;
	onPress: () => void;
};

const WellnessHub = ({ navigation }: Props) => {
	const { features } = useWorkoutStudio();
	const wellbeing = wellbeingPolicy(features);
	const actions: Action[] = [];

	if (wellbeing.showWellness) {
		actions.push({
			label: 'Wellness check-in',
			description: 'Log how you are feeling and spot patterns over time.',
			icon: 'heart-pulse',
			onPress: () => navigation.navigate('TrainingWellness'),
		});
	}

	if (wellbeing.showPainReports) {
		actions.push({
			label: 'Pain & injuries',
			description: 'Track symptoms, recovery, and training updates.',
			icon: 'bandage',
			onPress: () => navigation.navigate('TrainingInjuryList'),
		});
	}

	return (
		<MemberScreen contentContainerStyle={styles.screenContent}>
			<TrainingTabShell selectedTab="wellness" navigation={navigation} />
			<ScrollView contentContainerStyle={styles.container}>
				<MemberCard style={styles.hero}>
					<View style={styles.heroIcon}>
						<Ionicons
							name="heart-pulse"
							size={28}
							color={memberTheme.colors.primary}
						/>
					</View>
					<View style={styles.heroCopy}>
						<Text style={styles.heroTitle}>Wellbeing</Text>
						<Text style={styles.heroBody}>
							Choose how you want to care for your body today.
						</Text>
					</View>
				</MemberCard>

				<View style={styles.actionGroup}>
					<Text style={styles.sectionTitle}>
						Your wellbeing tools
					</Text>
					<MemberCard elevated={false} style={styles.actionCard}>
						{actions.map((action, index) => (
							<Pressable
								key={action.label}
								style={[
									styles.actionRow,
									index > 0 && styles.actionBorder,
								]}
								onPress={action.onPress}
								accessibilityRole="button"
								accessibilityLabel={action.label}
							>
								<View style={styles.actionIcon}>
									<Ionicons
										name={action.icon}
										size={22}
										color={memberTheme.colors.primary}
									/>
								</View>
								<View style={styles.actionCopy}>
									<Text style={styles.actionLabel}>
										{action.label}
									</Text>
									<Text style={styles.actionMeta}>
										{action.description}
									</Text>
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
	hero: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: memberTheme.spacing.md,
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	heroIcon: {
		width: 56,
		height: 56,
		borderRadius: memberTheme.radius.pill,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.surface,
	},
	heroCopy: { flex: 1, gap: memberTheme.spacing.xs },
	heroTitle: {
		...memberTheme.typography.sectionTitle,
		color: memberTheme.colors.text,
	},
	heroBody: {
		...memberTheme.typography.body,
		color: memberTheme.colors.textMuted,
	},
	sectionTitle: {
		...memberTheme.typography.sectionTitle,
		color: memberTheme.colors.text,
	},
	actionGroup: { gap: memberTheme.spacing.sm },
	actionCard: { padding: 0, overflow: 'hidden' },
	actionRow: {
		minHeight: 76,
		flexDirection: 'row',
		alignItems: 'center',
		gap: memberTheme.spacing.md,
		paddingHorizontal: memberTheme.spacing.md,
	},
	actionBorder: {
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: memberTheme.colors.border,
	},
	actionIcon: {
		width: 44,
		height: 44,
		borderRadius: memberTheme.radius.md,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	actionCopy: { flex: 1, gap: memberTheme.spacing.xs },
	actionLabel: {
		...memberTheme.typography.label,
		color: memberTheme.colors.text,
	},
	actionMeta: {
		...memberTheme.typography.meta,
		color: memberTheme.colors.textMuted,
	},
});

export default WellnessHub;
