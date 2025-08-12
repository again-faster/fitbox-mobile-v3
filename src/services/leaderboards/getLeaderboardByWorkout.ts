import { ApiRoutes } from '@/constants';
import { securedInstance } from '@/services/instance';
import { GetLeaderboardByWorkoutResponseSchema } from '@/types/schemas/response';

export default async (leaderboard_section_id: number) => {
	const response = await securedInstance()
		.get(ApiRoutes.getLeaderboardByWorkout, {
			searchParams: {
				leaderboard_section_id,
			},
		})
		.json();

	return GetLeaderboardByWorkoutResponseSchema.parse(response);
};
