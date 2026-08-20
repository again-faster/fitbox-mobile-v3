jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

import { createElement } from 'react';
import { render } from '@testing-library/react-native';
import type {
	ReadinessMetric,
	ReadinessResult,
	ReadinessSnapshot,
} from '@/services/workoutStudio/readiness';
import {
	ProviderNativeStatus,
	WearablesReadinessSummary,
	wearablesReadinessCopy,
} from './Wearables';

const metric: ReadinessMetric = {
	provider: 'apple_health',
	asOfDate: '2026-08-09',
	sleepMinutes: null,
	hrvMs: null,
	restingHr: null,
	nativeRecoveryScore: null,
	nativeReadinessScore: 81,
};

const recoveryOnlyMetric: ReadinessMetric = {
	...metric,
	nativeRecoveryScore: 72,
	nativeReadinessScore: null,
};

const snapshot: ReadinessSnapshot = {
	asOfDate: '2026-08-09',
	windowStart: '2026-08-03',
	windowEnd: '2026-08-09',
	hasConnection: true,
	metrics: [metric],
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
	return {
		status,
		data: status === 'empty' ? { ...snapshot, metrics: [] } : snapshot,
		error: null,
		asOfDate: snapshot.asOfDate,
	};
};

const resultWithMetrics = (metrics: ReadinessMetric[]): ReadinessResult => ({
	status: 'ready',
	data: { ...snapshot, metrics },
	error: null,
	asOfDate: snapshot.asOfDate,
});

describe('Wearables readiness presentation', () => {
	it.each(['loading', 'ready', 'empty', 'baseline', 'error'] as const)(
		'renders an explicit %s copy without zero fallbacks',
		status => {
			const copy = wearablesReadinessCopy(resultFor(status));

			expect(copy.status).toBe(status);
			expect(copy.score).not.toBe('0');
			expect(copy.band).not.toBe('0');
			expect(copy.confidence).not.toBe('0');
		},
	);

	it('does not present recovery-only data as a scored readiness result', () => {
		const copy = wearablesReadinessCopy(
			resultWithMetrics([recoveryOnlyMetric]),
		);
		const summary = render(
			createElement(WearablesReadinessSummary, {
				result: resultWithMetrics([recoveryOnlyMetric]),
			}),
		);

		expect(copy.status).toBe('recovery');
		expect(copy.statusLabel).toBe('Recovery available');
		expect(copy.title).toBe('Recovery data available');
		expect(copy.score).toBe('Not available');
		expect(copy.band).toBe('Recovery available');
		expect(copy.confidence).toBe('Score not available');
		expect(copy.detail).toMatch(/readiness score is not available/);
		expect(summary.getByText('Recovery data available')).toBeTruthy();
		expect(summary.getByText('Score Not available')).toBeTruthy();
		expect(summary.queryByText('Readiness is ready')).toBeNull();
	});

	it('keeps the latest useful value when a newer metric row is all null', () => {
		const newerEmptyMetric: ReadinessMetric = {
			...metric,
			asOfDate: '2026-08-09',
			nativeReadinessScore: null,
		};
		const olderScoredMetric: ReadinessMetric = {
			...metric,
			asOfDate: '2026-08-08',
		};
		const copy = wearablesReadinessCopy(
			resultWithMetrics([olderScoredMetric, newerEmptyMetric]),
		);

		expect(copy.score).toBe('81');
		expect(copy.metric?.nativeReadinessScore).toBe(81);
		expect(copy.metric?.asOfDate).toBe('2026-08-08');
		expect(copy.freshness).toBe('As of 2026-08-08');
	});

	it('keeps mixed-provider metrics separate and preserves the selected row source', () => {
		const appleSleepMetric: ReadinessMetric = {
			...metric,
			asOfDate: '2026-08-09',
			nativeReadinessScore: null,
			sleepMinutes: 420,
		};
		const whoopScoreMetric: ReadinessMetric = {
			...metric,
			provider: 'whoop',
			asOfDate: '2026-08-08',
			nativeReadinessScore: 85,
		};
		const copy = wearablesReadinessCopy(
			resultWithMetrics([appleSleepMetric, whoopScoreMetric]),
		);
		const native = render(
			createElement(ProviderNativeStatus, {
				metrics: copy.metrics,
				connectionStatus: 'Provider connections available',
			}),
		);

		expect(copy.metric?.provider).toBe('whoop');
		expect(copy.metric?.nativeReadinessScore).toBe(85);
		expect(copy.metric?.sleepMinutes).toBeNull();
		expect(copy.freshness).toBe('As of 2026-08-08');
		expect(native.getByText(/Apple Health native metrics/)).toBeTruthy();
		expect(native.getByText(/WHOOP native metrics/)).toBeTruthy();
		expect(
			native.getByLabelText(
				/Apple Health native metrics.*WHOOP native metrics/,
			),
		).toBeTruthy();
	});

	it('renders the Fitbox summary values and separate native status', () => {
		const summary = render(
			createElement(WearablesReadinessSummary, {
				result: resultFor('ready'),
			}),
		);
		const native = render(
			createElement(ProviderNativeStatus, {
				metrics: [metric],
				connectionStatus: 'Apple Health connected',
			}),
		);

		expect(summary.getByText('Score 81')).toBeTruthy();
		expect(summary.getByText('Band Ready')).toBeTruthy();
		expect(summary.getByText('Confidence Measured')).toBeTruthy();
		expect(summary.getByText('As of 2026-08-09')).toBeTruthy();
		expect(
			summary.getByLabelText(
				/Score 81.*Band Ready.*Confidence Measured.*As of 2026-08-09/,
			),
		).toBeTruthy();
		expect(native.getByText('Apple Health connected')).toBeTruthy();
		expect(native.getByText(/Native readiness 81/)).toBeTruthy();
		expect(
			native.getByLabelText(
				/Provider-native status.*Native readiness 81/,
			),
		).toBeTruthy();
	});
});
