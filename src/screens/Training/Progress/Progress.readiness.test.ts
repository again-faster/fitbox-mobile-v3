import { createElement } from 'react';
import { render } from '@testing-library/react-native';
import type {
	ReadinessMetric,
	ReadinessResult,
	ReadinessSnapshot,
} from '@/services/workoutStudio/readiness';
import {
	ProgressReadinessHistory,
	formatNativeMetric,
	hasAuthenticatedProgressSession,
	progressActivityCopy,
	shouldEnableReadinessQuery,
	readinessHistoryCopy,
	summarizeProgress,
} from './Progress';

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

const metrics: ReadinessMetric[] = [
	{
		provider: 'apple_health',
		asOfDate: '2026-08-07',
		sleepMinutes: 420,
		hrvMs: null,
		restingHr: null,
		nativeRecoveryScore: null,
		nativeReadinessScore: 72,
	},
	{
		provider: 'whoop',
		asOfDate: '2026-08-08',
		sleepMinutes: null,
		hrvMs: null,
		restingHr: null,
		nativeRecoveryScore: null,
		nativeReadinessScore: null,
	},
	{
		provider: 'strava',
		asOfDate: '2026-08-09',
		sleepMinutes: null,
		hrvMs: null,
		restingHr: null,
		nativeRecoveryScore: null,
		nativeReadinessScore: 81,
	},
];

const snapshot: ReadinessSnapshot = {
	asOfDate: '2026-08-09',
	windowStart: '2026-08-03',
	windowEnd: '2026-08-09',
	hasConnection: true,
	metrics,
};

const resultFor = (status: ReadinessResult['status']): ReadinessResult => {
	if (status === 'loading')
		return { status, data: null, error: null, asOfDate: null };
	if (status === 'error')
		return {
			status,
			data: null,
			error: {
				code: 'server',
				kind: 'server',
				message: 'Readiness is temporarily unavailable.',
			},
			asOfDate: null,
		};
	if (status === 'empty')
		return {
			status,
			data: { ...snapshot, metrics: [] },
			error: null,
			asOfDate: snapshot.asOfDate,
		};
	if (status === 'baseline')
		return {
			status,
			data: {
				...snapshot,
				metrics: [
					{
						provider: 'apple_health',
						asOfDate: '2026-08-07',
						sleepMinutes: 420,
						hrvMs: null,
						restingHr: null,
						nativeRecoveryScore: null,
						nativeReadinessScore: null,
					},
				],
			},
			error: null,
			asOfDate: snapshot.asOfDate,
		};
	return {
		status,
		data: snapshot,
		error: null,
		asOfDate: snapshot.asOfDate,
	};
};

describe('Progress readiness history presentation', () => {
	it('does not enable the member readiness query for signed-out users', () => {
		expect(shouldEnableReadinessQuery(true, null)).toBe(false);
		expect(
			shouldEnableReadinessQuery(false, {
				user: { id: 'member-1', active_tenant_id: 'tenant-1' },
			} as never),
		).toBe(false);
		expect(
			shouldEnableReadinessQuery(true, {
				user: { id: 'member-1', active_tenant_id: 'tenant-1' },
			} as never),
		).toBe(true);
		expect(hasAuthenticatedProgressSession(null)).toBe(false);
		expect(
			hasAuthenticatedProgressSession({
				user: { id: 'member-1', active_tenant_id: 'tenant-1' },
			} as never),
		).toBe(true);
		expect(
			hasAuthenticatedProgressSession({
				user: { id: 'member-1', active_tenant_id: null },
			} as never),
		).toBe(false);
	});

	it('preserves missing totals and native values as unavailable', () => {
		const missing = {
			id: 'missing',
			workout_id: 'workout-1',
			completed_at: '2026-08-09T00:00:00Z',
			duration_seconds: null,
			total_volume_kg: undefined,
			workouts: null,
		};
		const present = {
			...missing,
			id: 'present',
			duration_seconds: 60,
			total_volume_kg: 5,
			workouts: { name: 'Lift' },
		};

		expect(summarizeProgress([missing, present], 0)).toMatchObject({
			workouts: 2,
			minutes: 1,
			volume: 5,
		});
		expect(summarizeProgress([missing], 0)).toMatchObject({
			minutes: null,
			volume: null,
		});
		expect(formatNativeMetric(null)).toBe('Not available');
		expect(formatNativeMetric(undefined)).toBe('Not available');
		expect(formatNativeMetric(72)).toBe('72');
	});

	it('uses a safe activity fallback and accessibility copy', () => {
		const copy = progressActivityCopy({
			completed_at: '2026-08-09T00:00:00Z',
			duration_seconds: undefined,
			workouts: undefined,
		});

		expect(copy.name).toBe('Workout');
		expect(copy.detail).toMatch(/Duration not available/);
		expect(copy.accessibilityLabel).toMatch(
			/Workout.*Duration not available/,
		);
		expect(copy.accessibilityLabel).not.toMatch(/undefined/);
	});

	it.each(['loading', 'ready', 'empty', 'baseline', 'error'] as const)(
		'keeps the %s state explicit and missing scores non-zero',
		status => {
			const copy = readinessHistoryCopy(resultFor(status));

			expect(copy.status).toBe(status);
			expect(
				copy.points.every(
					point => point.score === null || point.score !== 0,
				),
			).toBe(true);
		},
	);

	it('does not trend native-only scores as Fitbox readiness', () => {
		const copy = readinessHistoryCopy(resultFor('ready'));
		const screen = render(
			createElement(ProgressReadinessHistory, {
				result: resultFor('ready'),
			}),
		);

		expect(screen.getByText('Readiness trend')).toBeTruthy();
		expect(copy.points).toEqual([]);
		expect(copy.trend).toBe('Not available');
		expect(copy.title).toBe('Fitbox readiness unavailable');
		expect(copy.confidence).toBe('Not available');
		expect(screen.getByText('Fitbox readiness unavailable')).toBeTruthy();
		expect(screen.getByText('Trend Not available')).toBeTruthy();
		expect(screen.getByText('Freshness Not available')).toBeTruthy();
		expect(screen.getByText('Provider-native signals')).toBeTruthy();
		expect(screen.getByText(/Apple Health/)).toBeTruthy();
		expect(screen.getByText(/Strava/)).toBeTruthy();
		expect(screen.getByText(/Native readiness 72/)).toBeTruthy();
		expect(screen.getByText(/Native readiness 81/)).toBeTruthy();
		expect(screen.queryByText('Up 9')).toBeNull();
		expect(screen.queryByText(/Score 0/)).toBeNull();
		expect(
			screen.getByLabelText(/Readiness history.*Not available/),
		).toBeTruthy();
	});
});
