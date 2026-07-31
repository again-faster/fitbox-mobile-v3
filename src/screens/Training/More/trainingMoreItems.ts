import type { MemberFeatureMap } from '@/services/workoutStudio/memberFeatures';
import type { TrainingStackParamList } from '@/types/navigation';
import {
	shouldShowBookingsHub,
	shouldShowProgressHub,
} from '../features/memberFeatureRoutes';

export type TrainingMoreItem = {
	label: string;
	description: string;
	icon: string;
	route: keyof TrainingStackParamList;
};

export type TrainingMoreGroup = {
	title: string;
	items: TrainingMoreItem[];
};

const definedItems = (
	items: Array<TrainingMoreItem | false>,
): TrainingMoreItem[] => items.filter((item): item is TrainingMoreItem => !!item);

export const buildTrainingMoreGroups = (
	features: MemberFeatureMap,
	hasCustomWorkouts: boolean,
): TrainingMoreGroup[] => {
	const groups: TrainingMoreGroup[] = [
		{
			title: 'Training',
			items: definedItems([
				{
					label: 'Workouts',
					description: 'Assignments and benchmarks',
					icon: 'clipboard-text-outline',
					route: 'TrainingWorkouts',
				},
				shouldShowProgressHub(features) && {
					label: 'My Progress',
					description: 'Results, PRs, maxes and recap',
					icon: 'chart-line',
					route: 'TrainingProgress',
				},
				features.wellness && {
					label: 'Wellness',
					description: 'Check-ins and trends',
					icon: 'heart-pulse',
					route: 'TrainingWellness',
				},
				features.pain_reports && {
					label: 'Pain & Injuries',
					description: 'Injury logs and daily updates',
					icon: 'bandage',
					route: 'TrainingInjuryList',
				},
			]),
		},
		{
			title: 'Bookings',
			items: definedItems([
				shouldShowBookingsHub(features) && {
					label: 'Book services',
					description: 'PT, treatments, resources and My Bookings',
					icon: 'calendar-check-outline',
					route: 'TrainingPT',
				},
			]),
		},
		{
			title: 'Community',
			items: definedItems([
				features.coach_notes && {
					label: 'Coach Notes',
					description: 'Feedback from your coaches',
					icon: 'message-text-outline',
					route: 'TrainingCoachNotes',
				},
				features.feed && {
					label: 'Gym Feed',
					description: 'Recent member results',
					icon: 'account-group-outline',
					route: 'TrainingGymFeed',
				},
			]),
		},
		{
			title: 'My training',
			items: definedItems([
				features.training_profile && {
					label: 'Training Profile',
					description: 'Scaling level and rep maxes',
					icon: 'account-cog-outline',
					route: 'TrainingProfile',
				},
				features.wearables && {
					label: 'Wearables',
					description: 'Connections, sync and readiness',
					icon: 'watch-variant',
					route: 'TrainingWearables',
				},
				(features.custom_workouts || hasCustomWorkouts) && {
					label: 'Custom Workouts',
					description: 'Build and schedule workouts',
					icon: 'pencil-ruler',
					route: 'TrainingBuildList',
				},
			]),
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

	return groups.filter(group => group.items.length > 0);
};
