import { Platform } from 'react-native';
import AppleHealthKit, {
	AnchoredQueryResults,
	HealthKitPermissions,
	HealthValue,
} from 'react-native-health';
import { getValidWSToken } from '@/services/workoutStudio/auth';
import { mmkvStorage } from '@/storage';

const STORAGE_KEY = 'healthkit.lastSyncedAt';
const INGEST_URL =
	'https://studio.fitbox.iq/api/public/wearables/apple-health/native-ingest';

type MetricType =
	| 'hrv_sdnn'
	| 'resting_heart_rate'
	| 'sleep_hours'
	| 'active_energy_kcal'
	| 'vo2_max'
	| 'body_mass_kg'
	| 'step_count';

type MetricPayload = {
	date: string;
	type: MetricType;
	value: number;
	source: 'com.apple.health';
};

type WorkoutPayload = {
	external_id: string;
	workout_type: string;
	started_at: string;
	ended_at: string;
	duration_seconds: number;
	active_energy_kcal: number;
	distance_meters: number;
	source: 'com.apple.health';
};

// Sleep samples are typed as HealthValue (value: number) but at runtime
// return string category values like 'ASLEEP', 'IN_BED', etc.
type SleepSample = { value: string; startDate: string; endDate: string };

const PERMISSIONS: HealthKitPermissions = {
	permissions: {
		read: [
			AppleHealthKit.Constants.Permissions.HeartRateVariability,
			AppleHealthKit.Constants.Permissions.RestingHeartRate,
			AppleHealthKit.Constants.Permissions.SleepAnalysis,
			AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
			AppleHealthKit.Constants.Permissions.Vo2Max,
			AppleHealthKit.Constants.Permissions.Weight,
			AppleHealthKit.Constants.Permissions.StepCount,
			AppleHealthKit.Constants.Permissions.Workout,
		],
		write: [],
	},
};

const makeOptions = (startDate: string, endDate: string) => ({
	startDate,
	endDate,
});

const promisifyMetric = (
	fn: (
		opts: { startDate: string; endDate: string },
		cb: (err: string, results: HealthValue[]) => void,
	) => void,
	opts: { startDate: string; endDate: string },
): Promise<HealthValue[]> =>
	new Promise<HealthValue[]>((resolve, reject) => {
		fn(opts, (err, results) => {
			if (err) {
				reject(new Error(err));
			} else {
				resolve(results);
			}
		});
	});

const chunkArray = <T>(arr: T[], size: number): T[][] =>
	arr.reduce<T[][]>((acc, _item, i) => {
		if (i % size === 0) {
			acc.push(arr.slice(i, i + size));
		}
		return acc;
	}, []);

const toDateStr = (iso: string): string => iso.slice(0, 10);

export const authorize = async (): Promise<boolean> => {
	if (Platform.OS !== 'ios') return false;
	return new Promise<boolean>(resolve => {
		AppleHealthKit.initHealthKit(PERMISSIONS, err => {
			if (err) {
				// eslint-disable-next-line no-console
				console.error('[HealthKit] initHealthKit error', err);
				resolve(false);
			} else {
				resolve(true);
			}
		});
	});
};

export const syncNow = async (): Promise<void> => {
	if (Platform.OS !== 'ios') return;

	const token = await getValidWSToken();
	if (!token) return;

	const stored = mmkvStorage.getString(STORAGE_KEY);
	const startDate =
		stored ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
	const endDate = new Date().toISOString();
	const opts = makeOptions(startDate, endDate);

	const postBatch = async (
		metrics: MetricPayload[],
		workouts: WorkoutPayload[],
	): Promise<void> => {
		const res = await fetch(INGEST_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ metrics, workouts }),
		});
		if (!res.ok) {
			throw new Error(
				`[HealthSync] ingest failed with status ${res.status}`,
			);
		}
	};

	try {
		const [
			hrvRaw,
			rhrRaw,
			sleepRaw,
			energyRaw,
			vo2Raw,
			weightRaw,
			stepsRaw,
			workoutsResult,
		] = await Promise.all([
			promisifyMetric(
				(o, cb) => AppleHealthKit.getHeartRateVariabilitySamples(o, cb),
				opts,
			),
			promisifyMetric(
				(o, cb) => AppleHealthKit.getRestingHeartRateSamples(o, cb),
				opts,
			),
			promisifyMetric(
				(o, cb) => AppleHealthKit.getSleepSamples(o, cb),
				opts,
			),
			promisifyMetric(
				(o, cb) => AppleHealthKit.getActiveEnergyBurned(o, cb),
				opts,
			),
			promisifyMetric(
				(o, cb) => AppleHealthKit.getVo2MaxSamples(o, cb),
				opts,
			),
			promisifyMetric(
				(o, cb) => AppleHealthKit.getWeightSamples(o, cb),
				opts,
			),
			promisifyMetric(
				(o, cb) => AppleHealthKit.getDailyStepCountSamples(o, cb),
				opts,
			),
			new Promise<AnchoredQueryResults>((resolve, reject) => {
				AppleHealthKit.getAnchoredWorkouts(opts, (err, results) => {
					if (err?.message) {
						reject(new Error(err.message));
					} else {
						resolve(results);
					}
				});
			}),
		]);

		// --- Metric payloads ---

		const hrvMetrics: MetricPayload[] = hrvRaw.map(s => ({
			date: toDateStr(s.startDate),
			type: 'hrv_sdnn',
			value: s.value,
			source: 'com.apple.health',
		}));

		const rhrMetrics: MetricPayload[] = rhrRaw.map(s => ({
			date: toDateStr(s.startDate),
			type: 'resting_heart_rate',
			value: s.value,
			source: 'com.apple.health',
		}));

		// Sleep: cast to SleepSample[] since the runtime value is a string category
		const sleepCasted = sleepRaw as unknown as SleepSample[];
		const sleepByDay = sleepCasted.reduce<Record<string, number>>(
			(acc, sample) => {
				if (sample.value !== 'ASLEEP') return acc;
				const date = toDateStr(sample.startDate);
				const startMs = new Date(sample.startDate).getTime();
				const endMs = new Date(sample.endDate).getTime();
				const minutes = (endMs - startMs) / 60000;
				return { ...acc, [date]: (acc[date] ?? 0) + minutes };
			},
			{},
		);
		const sleepMetrics: MetricPayload[] = Object.entries(sleepByDay).map(
			([date, minutes]) => ({
				date,
				type: 'sleep_hours' as MetricType,
				value: minutes / 60,
				source: 'com.apple.health',
			}),
		);

		// Active energy: aggregate daily sum
		const energyByDay = energyRaw.reduce<Record<string, number>>(
			(acc, sample) => {
				const date = toDateStr(sample.startDate);
				return { ...acc, [date]: (acc[date] ?? 0) + sample.value };
			},
			{},
		);
		const energyMetrics: MetricPayload[] = Object.entries(energyByDay).map(
			([date, value]) => ({
				date,
				type: 'active_energy_kcal' as MetricType,
				value,
				source: 'com.apple.health',
			}),
		);

		const vo2Metrics: MetricPayload[] = vo2Raw.map(s => ({
			date: toDateStr(s.startDate),
			type: 'vo2_max' as MetricType,
			value: s.value,
			source: 'com.apple.health',
		}));

		const weightMetrics: MetricPayload[] = weightRaw.map(s => ({
			date: toDateStr(s.startDate),
			type: 'body_mass_kg' as MetricType,
			value: s.value,
			source: 'com.apple.health',
		}));

		const stepMetrics: MetricPayload[] = stepsRaw.map(s => ({
			date: toDateStr(s.startDate),
			type: 'step_count' as MetricType,
			value: s.value,
			source: 'com.apple.health',
		}));

		const allMetrics: MetricPayload[] = [
			...hrvMetrics,
			...rhrMetrics,
			...sleepMetrics,
			...energyMetrics,
			...vo2Metrics,
			...weightMetrics,
			...stepMetrics,
		];

		// --- Workout payloads ---

		const allWorkouts: WorkoutPayload[] = workoutsResult.data.map(w => ({
			external_id: w.id,
			workout_type: w.activityName,
			started_at: w.start,
			ended_at: w.end,
			duration_seconds: w.duration,
			active_energy_kcal: w.calories,
			distance_meters: w.distance,
			source: 'com.apple.health',
		}));

		// --- Batched POST ---

		const metricChunks = chunkArray(allMetrics, 400);
		const workoutChunks = chunkArray(allWorkouts, 200);

		await metricChunks.reduce<Promise<void>>(async (prev, chunk) => {
			await prev;
			await postBatch(chunk, []);
		}, Promise.resolve());

		await workoutChunks.reduce<Promise<void>>(async (prev, chunk) => {
			await prev;
			await postBatch([], chunk);
		}, Promise.resolve());

		mmkvStorage.set(STORAGE_KEY, endDate);
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('[HealthSync] syncNow error', err);
		throw err;
	}
};
