import type { StackNavigationProp } from '@react-navigation/stack';
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackParamList } from '@/types/navigation';
import { tabRouteForKey, type TrainingTabKey } from './trainingTabs';

type Navigation = Pick<StackNavigationProp<TrainingStackParamList>, 'replace'>;

type Props = {
	visibleTabs: readonly TrainingTabKey[];
	selectedTab: TrainingTabKey;
	navigation: Navigation;
};

const TAB_LABELS: Record<TrainingTabKey, string> = {
	today: 'Today',
	progress: 'Progress',
	readiness: 'Readiness',
	wellness: 'Wellness',
	more: 'More',
};

const TrainingTabBar = ({ visibleTabs, selectedTab, navigation }: Props) => {
	if (visibleTabs.length <= 1) return null;

	return (
		<View style={styles.container} accessibilityRole="tablist">
			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.content}
				accessibilityLabel="Training sections"
			>
				{visibleTabs.map(tab => {
					const selected = tab === selectedTab;
					return (
						<TouchableOpacity
							key={tab}
							accessibilityRole="tab"
							accessibilityState={{ selected }}
							onPress={() =>
								navigation.replace(tabRouteForKey(tab))
							}
							style={[styles.tab, selected && styles.selectedTab]}
						>
							<Text
								style={[
									styles.label,
									selected && styles.selectedLabel,
								]}
							>
								{TAB_LABELS[tab]}
							</Text>
						</TouchableOpacity>
					);
				})}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingVertical: trainingTheme.spacing.sm,
	},
	content: {
		gap: trainingTheme.spacing.xs,
		paddingHorizontal: trainingTheme.spacing.lg,
	},
	tab: {
		minHeight: 40,
		paddingHorizontal: trainingTheme.spacing.md,
		borderRadius: trainingTheme.radius.pill,
		alignItems: 'center',
		justifyContent: 'center',
	},
	selectedTab: {
		backgroundColor: trainingTheme.colors.primary,
	},
	label: {
		color: trainingTheme.colors.textMuted,
		fontSize: 14,
		fontWeight: '600',
	},
	selectedLabel: {
		color: trainingTheme.colors.surface,
	},
});

export default TrainingTabBar;
