import { useWorkoutStudio } from '@/context/WorkoutStudioProvider';
import { navigate } from '@/navigators/NavigationRef';
import type { MemberFeature } from '@/services/workoutStudio/memberFeatures';
import type { PropsWithChildren } from 'react';
import TrainingState from './TrainingState';

type Props = PropsWithChildren<{
	feature: MemberFeature;
	allow?: boolean;
}>;

export const MemberFeatureGate = ({
	feature,
	allow = false,
	children,
}: Props) => {
	const { isEnabled } = useWorkoutStudio();

	if (allow || isEnabled(feature)) return <>{children}</>;

	return (
		<TrainingState
			kind="empty"
			title="Feature unavailable"
			message="Your gym hasn't enabled this feature for members."
			actionLabel="Back to Training"
			onAction={() =>
				navigate('Main', {
					screen: 'TrainingStack',
					params: { screen: 'TrainingToday' },
				})
			}
		/>
	);
};
