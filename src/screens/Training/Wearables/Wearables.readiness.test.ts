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
		data:
			status === 'empty' ? { ...snapshot, metrics: [] } : snapshot,
		error: null,
		asOfDate: snapshot.asOfDate,
	};
};

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

	it('renders the Fitbox summary values and separate native status', () => {
		const summary = render(
			createElement(WearablesReadinessSummary, {
				result: resultFor('ready'),
			}),
		);
		const native = render(
			createElement(ProviderNativeStatus, {
				metric,
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
		expect(native.getByLabelText(/Provider-native status.*Native readiness 81/)).toBeTruthy();
	});
});
