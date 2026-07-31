/* eslint-disable no-restricted-syntax, no-continue, no-await-in-loop */

import * as Keychain from 'react-native-keychain';
import { wsApi } from './api';

const SERVICE = 'com.fitbox.workout-studio.workout-result-cleanup-queue';

export type WorkoutResultCleanupEntry = {
	id: string;
	workoutResultId: string;
	userId: string;
	tenantId: string;
	queuedAt: string;
};

export type WorkoutResultCleanupQueueDependencies = {
	load: () => Promise<WorkoutResultCleanupEntry[]>;
	save: (entries: WorkoutResultCleanupEntry[]) => Promise<void>;
	removeResult: (workoutResultId: string) => Promise<void>;
};

const isEntry = (value: unknown): value is WorkoutResultCleanupEntry => {
	if (!value || typeof value !== 'object') return false;
	const entry = value as Partial<WorkoutResultCleanupEntry>;
	return (
		typeof entry.id === 'string' &&
		typeof entry.workoutResultId === 'string' &&
		typeof entry.userId === 'string' &&
		typeof entry.tenantId === 'string' &&
		typeof entry.queuedAt === 'string'
	);
};

const load = async (): Promise<WorkoutResultCleanupEntry[]> => {
	const stored = await Keychain.getGenericPassword({ service: SERVICE });
	if (!stored) return [];
	try {
		const parsed: unknown = JSON.parse(stored.password);
		return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
	} catch {
		return [];
	}
};

const save = async (entries: WorkoutResultCleanupEntry[]) => {
	if (entries.length === 0) {
		await Keychain.resetGenericPassword({ service: SERVICE });
		return;
	}
	await Keychain.setGenericPassword(
		'workout-result-cleanup-queue',
		JSON.stringify(entries),
		{
			service: SERVICE,
			accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
		},
	);
};

const defaultDependencies: WorkoutResultCleanupQueueDependencies = {
	load,
	save,
	removeResult: async workoutResultId => {
		await wsApi().delete(`workout_results?id=eq.${workoutResultId}`);
	},
};

export const queueWorkoutResultCleanup = async (
	entry: WorkoutResultCleanupEntry,
	deps: WorkoutResultCleanupQueueDependencies = defaultDependencies,
) => {
	const current = await deps.load();
	const next = current.filter(item => item.id !== entry.id);
	next.push(entry);
	await deps.save(next);
};

export const flushWorkoutResultCleanupQueue = async (
	userId: string,
	tenantId: string,
	deps: WorkoutResultCleanupQueueDependencies = defaultDependencies,
) => {
	const current = await deps.load();
	const removedIds = new Set<string>();
	for (const entry of current) {
		if (entry.userId !== userId || entry.tenantId !== tenantId) continue;
		try {
			await deps.removeResult(entry.workoutResultId);
			removedIds.add(entry.id);
		} catch {
			// Retain failed cleanups for the next reconnect or screen mount.
		}
	}
	const next = current.filter(entry => !removedIds.has(entry.id));
	await deps.save(next);
	return {
		removed: removedIds.size,
		remaining: next.filter(
			entry => entry.userId === userId && entry.tenantId === tenantId,
		).length,
	};
};
