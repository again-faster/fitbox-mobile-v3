import { getStoredWSSession } from '@/services/workoutStudio/auth';
import { flushWorkoutResultCleanupQueue } from '@/services/workoutStudio/workoutResultCleanupQueue';
import { useEffect } from 'react';
import { useTrainingConnectivity } from './useTrainingConnectivity';

export const useWorkoutResultCleanupQueue = () => {
	const session = getStoredWSSession();
	const userId = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const { isOffline } = useTrainingConnectivity();

	useEffect(() => {
		if (isOffline || !userId || !tenantId) return;
		void flushWorkoutResultCleanupQueue(userId, tenantId);
	}, [isOffline, tenantId, userId]);
};
