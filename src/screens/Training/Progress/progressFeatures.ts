import type {
	MemberFeature,
	MemberFeatureMap,
} from '@/services/workoutStudio/memberFeatures';
import { shouldShowProgressHub } from '../features/memberFeatureRoutes';

export type ProgressRoute =
	| 'TrainingResults'
	| 'TrainingPRs'
	| 'TrainingMaxes'
	| 'TrainingBenchmarks'
	| 'TrainingWeeklyRecap';

export type ProgressLink = {
	label: string;
	detail: string;
	icon: string;
	route: ProgressRoute;
};

export type ProgressContent = {
	links: ProgressLink[];
	showKpis: boolean;
	showRecentActivity: boolean;
	needsResultQuery: boolean;
	needsRMQuery: boolean;
	showProgressHub: boolean;
};

export const shouldRenderProgressScreen = (features: MemberFeatureMap) =>
	shouldShowProgressHub(features);

export const shouldShowTodayProgressCard = (features: MemberFeatureMap) =>
	shouldShowProgressHub(features);

const LINK_DEFINITIONS: ReadonlyArray<
	ProgressLink & { feature: MemberFeature }
> = [
	{
		feature: 'results',
		label: 'My Results',
		detail: 'Scores and completed workouts',
		icon: 'chart-timeline-variant',
		route: 'TrainingResults',
	},
	{
		feature: 'prs',
		label: 'My PRs',
		detail: 'Recent personal records',
		icon: 'trophy-outline',
		route: 'TrainingPRs',
	},
	{
		feature: 'my_maxes',
		label: 'My Maxes',
		detail: '1RM, 3RM and 5RM ladder',
		icon: 'weight-lifter',
		route: 'TrainingMaxes',
	},
	{
		feature: 'benchmarks',
		label: 'Benchmarks',
		detail: 'Repeatable workout history',
		icon: 'medal-outline',
		route: 'TrainingBenchmarks',
	},
	{
		feature: 'digest',
		label: 'Weekly Recap',
		detail: 'This week compared with last week',
		icon: 'calendar-check-outline',
		route: 'TrainingWeeklyRecap',
	},
];

export const buildProgressContent = (
	features: MemberFeatureMap,
): ProgressContent => {
	const showKpis = features.progress;
	const showRecentActivity = features.results;
	return {
		links: LINK_DEFINITIONS.filter(item => features[item.feature]).map(
			({ feature: _feature, ...link }) => link,
		),
		showKpis,
		showRecentActivity,
		needsResultQuery: showKpis || showRecentActivity,
		needsRMQuery: showKpis,
		showProgressHub: shouldShowProgressHub(features),
	};
};
