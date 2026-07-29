jest.mock('./api', () => ({ wsApi: jest.fn() }));

import { wsApi } from './api';
import {
	calculateWorkoutVolumeKg,
	completeWorkoutResult,
	startWorkoutResult,
} from './workoutResults';

const mockWsApi = wsApi as jest.MockedFunction<typeof wsApi>;

describe('workout result lifecycle', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('starts or recovers a result using the stable client session id', async () => {
		const json = jest.fn().mockResolvedValue([{ id: 'result-1' }]);
		const post = jest.fn().mockReturnValue({ json });
		mockWsApi.mockReturnValue({ post } as never);

		await expect(
			startWorkoutResult({
				workoutId: 'workout-1',
				assignmentId: 'assignment-1',
				athleteId: 'athlete-1',
				tenantId: 'tenant-1',
				clientSessionId: 'session-1',
				scalingLevel: 'scaled',
				startedAt: '2026-07-29T05:00:00.000Z',
			}),
		).resolves.toBe('result-1');

		expect(post).toHaveBeenCalledWith('workout_results', {
			searchParams: { on_conflict: 'client_session_id' },
			json: {
				workout_id: 'workout-1',
				assignment_id: 'assignment-1',
				athlete_id: 'athlete-1',
				tenant_id: 'tenant-1',
				client_session_id: 'session-1',
				started_at: '2026-07-29T05:00:00.000Z',
				is_rx: false,
				scaling_level: 'scaled',
			},
			headers: {
				Prefer: 'resolution=merge-duplicates,return=representation',
			},
		});
	});

	it('completes without trying to parse an empty PostgREST response', async () => {
		const patch = jest.fn().mockResolvedValue(undefined);
		mockWsApi.mockReturnValue({ patch } as never);

		await completeWorkoutResult('result-1', {
			completedAt: '2026-07-29T05:45:00.000Z',
			durationSeconds: 2700,
			totalVolumeKg: 1250,
		});

		expect(patch).toHaveBeenCalledWith(
			'workout_results?id=eq.result-1',
			{
				json: {
					completed_at: '2026-07-29T05:45:00.000Z',
					duration_seconds: 2700,
					total_volume_kg: 1250,
				},
				headers: { Prefer: 'return=minimal' },
			},
		);
	});

	it('calculates volume from only completed sets with valid values', () => {
		expect(
			calculateWorkoutVolumeKg([
				{ completed: true, reps: '5', weight: '100' },
				{ completed: false, reps: '5', weight: '100' },
				{ completed: true, reps: '8', weight: '25.5' },
				{ completed: true, reps: '', weight: '40' },
			]),
		).toBe(704);
	});
});
