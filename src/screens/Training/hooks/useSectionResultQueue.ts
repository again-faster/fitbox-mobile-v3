import { getStoredWSSession } from '@/services/workoutStudio/auth';
import {
	flushSectionResultQueue,
	loadSectionResultQueue,
} from '@/services/workoutStudio/sectionResultQueue';
import { useCallback, useEffect, useState } from 'react';
import { useTrainingConnectivity } from './useTrainingConnectivity';

export const useSectionResultQueue = (enabled = true) => {
	const session = getStoredWSSession();
	const userId = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const { isOffline } = useTrainingConnectivity();
	const [pendingCount, setPendingCount] = useState(0);
	const [isSyncing, setIsSyncing] = useState(false);

	const refresh = useCallback(async () => {
		if (!enabled || !userId || !tenantId) {
			setPendingCount(0);
			return;
		}
		const queue = await loadSectionResultQueue();
		setPendingCount(
			queue.filter(
				item => item.userId === userId && item.tenantId === tenantId,
			).length,
		);
	}, [enabled, tenantId, userId]);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	useEffect(() => {
		if (
			!enabled ||
			isOffline ||
			!userId ||
			!tenantId ||
			isSyncing ||
			pendingCount === 0
		)
			return;
		setIsSyncing(true);
		void flushSectionResultQueue(userId, tenantId)
			.then(result => setPendingCount(result.remaining))
			.finally(() => setIsSyncing(false));
	}, [enabled, isOffline, isSyncing, pendingCount, tenantId, userId]);

	return { isOffline, isSyncing, pendingCount, refresh };
};
