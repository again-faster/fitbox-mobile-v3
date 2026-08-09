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

	it('renders a compact provider-neutral trend and separate native metrics', () => {
		const screen = render(
			createElement(ProgressReadinessHistory, {
				result: resultFor('ready'),
			}),
		);

		expect(screen.getByText('Readiness trend')).toBeTruthy();
		expect(screen.getByText('Up 9')).toBeTruthy();
		expect(screen.getByText('Score 72')).toBeTruthy();
		expect(screen.getByText('Score not available')).toBeTruthy();
		expect(screen.getByText('Score 81')).toBeTruthy();
		expect(screen.getByText('Freshness As of 2026-08-09')).toBeTruthy();
		expect(screen.getByText('Provider-native signals')).toBeTruthy();
		expect(screen.getByText(/Apple Health/)).toBeTruthy();
		expect(screen.getByText(/Strava/)).toBeTruthy();
		expect(screen.queryByText(/Score 0/)).toBeNull();
		expect(screen.getByLabelText(/Readiness history.*Up 9/)).toBeTruthy();
	});
});
