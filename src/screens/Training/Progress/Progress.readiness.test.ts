jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

import { createElement } from 'react';
import { render } from '@testing-library/react-native';
import type {
	ReadinessMetric,
	ReadinessResult,
	ReadinessSnapshot,
} from '@/services/workoutStudio/readiness';
import {
	ProgressReadinessHistory,
	shouldEnableReadinessQuery,
	readinessHistoryCopy,
} from './Progress';

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
						...metrics[0],
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
	});

	it.each(['loading', 'ready', 'empty', 'baseline', 'error'] as const)(
		'keeps the %s state explicit and missing scores non-zero',
		status => {
			const copy = readinessHistoryCopy(resultFor(status));

			expect(copy.status).toBe(status);
			expect(copy.points.every(point => point.score === null || point.score !== 0)).toBe(
				true,
			);
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
		expect(screen.getByLabelText(/Readiness history.*Not available/)).toBeTruthy();
	});
});
