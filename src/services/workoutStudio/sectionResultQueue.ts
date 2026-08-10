import * as Keychain from 'react-native-keychain';
import { WSApiError } from './errors';
import {
	logSectionResultAtomic,
	type AtomicSectionResultInput,
} from './scoreable';

const SERVICE = 'com.fitbox.workout-studio.section-result-queue';

export type QueuedSectionResult = {
	id: string;
	userId: string;
	tenantId: string;
	input: AtomicSectionResultInput;
	queuedAt: string;
};

const isInput = (value: unknown): value is AtomicSectionResultInput => {
	if (!value || typeof value !== 'object') return false;
	const input = value as Partial<AtomicSectionResultInput>;
	return (
		typeof input.sectionId === 'string' &&
		typeof input.sessionSubmissionId === 'string' &&
		typeof input.sectionSubmissionId === 'string'
	);
};

const isEntry = (value: unknown): value is QueuedSectionResult => {
	if (!value || typeof value !== 'object') return false;
	const entry = value as Partial<QueuedSectionResult>;
	return (
		typeof entry.id === 'string' &&
		typeof entry.userId === 'string' &&
		typeof entry.tenantId === 'string' &&
		typeof entry.queuedAt === 'string' &&
		isInput(entry.input)
	);
};

export const loadSectionResultQueue = async (): Promise<
	QueuedSectionResult[]
> => {
	const stored = await Keychain.getGenericPassword({ service: SERVICE });
	if (!stored) return [];
	try {
		const parsed: unknown = JSON.parse(stored.password);
		return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
	} catch {
		await Keychain.resetGenericPassword({ service: SERVICE });
		return [];
	}
};

const saveQueue = async (items: QueuedSectionResult[]) => {
	if (items.length === 0) {
		await Keychain.resetGenericPassword({ service: SERVICE });
		return;
	}
	await Keychain.setGenericPassword(
		'section-result-queue',
		JSON.stringify(items),
		{
			service: SERVICE,
			accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
		},
	);
};

export const queueSectionResult = async (entry: QueuedSectionResult) => {
	const current = await loadSectionResultQueue();
	const next = current.filter(item => item.id !== entry.id);
	next.push(entry);
	await saveQueue(next);
	return next;
};

export const isRetryableSectionResultError = (error: unknown) =>
	error instanceof WSApiError &&
	['network', 'timeout', 'server', 'rate_limited'].includes(error.kind);

export const flushSectionResultQueue = async (
	userId: string,
	tenantId: string,
) => {
	const current = await loadSectionResultQueue();
	const matching = current.filter(
		item => item.userId === userId && item.tenantId === tenantId,
	);
	const syncedIds = new Set<string>();
	const syncAt = async (index: number): Promise<void> => {
		const item = matching[index];
		if (!item) return;
		try {
			await logSectionResultAtomic(item.input);
			syncedIds.add(item.id);
		} catch (error) {
			// Keep every failure visible for explicit retry/support rather than
			// silently deleting performance data. A transient failure stops this
			// pass so later entries retain their original ordering.
			if (isRetryableSectionResultError(error)) return;
		}
		await syncAt(index + 1);
	};
	await syncAt(0);

	const next = current.filter(item => !syncedIds.has(item.id));
	if (syncedIds.size > 0) await saveQueue(next);
	return {
		synced: syncedIds.size,
		remaining: next.filter(
			item => item.userId === userId && item.tenantId === tenantId,
		).length,
	};
};
