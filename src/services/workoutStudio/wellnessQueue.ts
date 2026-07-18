import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.fitbox.workout-studio.wellness-queue';

export type QueuedWellnessCheckin = {
	id: string;
	userId: string;
	tenantId: string;
	recordedFor: string;
	scores: Record<string, number>;
	queuedAt: string;
};

const isEntry = (value: unknown): value is QueuedWellnessCheckin => {
	if (!value || typeof value !== 'object') return false;
	const item = value as Partial<QueuedWellnessCheckin>;
	return (
		typeof item.id === 'string' &&
		typeof item.userId === 'string' &&
		typeof item.tenantId === 'string' &&
		typeof item.recordedFor === 'string' &&
		typeof item.queuedAt === 'string' &&
		!!item.scores &&
		typeof item.scores === 'object'
	);
};

export const loadWellnessQueue = async (): Promise<QueuedWellnessCheckin[]> => {
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

const saveQueue = async (items: QueuedWellnessCheckin[]) => {
	if (items.length === 0) {
		await Keychain.resetGenericPassword({ service: SERVICE });
		return;
	}
	await Keychain.setGenericPassword('wellness-queue', JSON.stringify(items), {
		service: SERVICE,
		accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
	});
};

export const queueWellnessCheckin = async (entry: QueuedWellnessCheckin) => {
	const current = await loadWellnessQueue();
	// One authoritative pending value per member, tenant and day.
	const next = current.filter(item => item.id !== entry.id);
	next.push(entry);
	await saveQueue(next);
	return next;
};

export const removeQueuedWellnessCheckin = async (id: string) => {
	const current = await loadWellnessQueue();
	const next = current.filter(item => item.id !== id);
	await saveQueue(next);
	return next;
};
