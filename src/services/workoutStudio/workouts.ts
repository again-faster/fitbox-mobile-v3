import { getApiToken, getApiUrl } from '@/services/instance';
import { Constant } from '@/utils';
import { getValidWSToken } from './auth';
import type { WorkoutAssignment } from './types';

type Envelope<T> =
	| { ok: true; data: T }
	| { ok: false; error: { code: string; message: string } };

export const getMemberWorkouts = async (
	tenantId: string,
	from: string,
	to: string,
): Promise<WorkoutAssignment[]> => {
	const [wsToken, fitboxApiKey] = await Promise.all([
		getValidWSToken(),
		Promise.resolve(getApiToken()),
	]);
	const fitboxApiBase = getApiUrl() || Constant.API_URL;
	if (!wsToken) throw new Error('Your Training session has expired.');
	if (!fitboxApiKey || !fitboxApiBase)
		throw new Error('Your Fitbox session has expired.');

	const query = new URLSearchParams({ tenantId, from, to }).toString();
	const response = await fetch(
		`${Constant.WS_MOBILE_API_URL}/workouts?${query}`,
		{
			headers: {
				Authorization: `Bearer ${wsToken}`,
				Accept: 'application/json',
				'x-fitbox-api-key': fitboxApiKey,
				'x-fitbox-api-base': fitboxApiBase,
			},
		},
	);
	const envelope = (await response.json()) as Envelope<WorkoutAssignment[]>;
	if (!response.ok || !envelope.ok) {
		throw new Error(
			envelope.ok ? 'Unable to load workouts.' : envelope.error.message,
		);
	}
	return envelope.data;
};
