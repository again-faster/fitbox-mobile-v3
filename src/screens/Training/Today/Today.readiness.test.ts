import type { ReadinessResult } from '@/services/workoutStudio/readiness';
import { useQuery } from '@tanstack/react-query';
import { createElement } from 'react';
import { render } from '@testing-library/react-native';
import Today, { readinessCopy } from './Today';

jest.mock('@/services/healthKit', () => ({ syncNow: jest.fn() }));
jest.mock('@/services/workoutStudio/api', () => ({ wsApi: jest.fn() }));
jest.mock('@/services/workoutStudio/auth', () => ({
	getStoredWSSession: jest.fn(() => null),
}));
jest.mock('@/services/workoutStudio/workouts', () => ({
	getMemberWorkouts: jest.fn(),
}));
jest.mock('@/storage', () => ({
	mmkvStorage: {
		getString: jest.fn(),
		set: jest.fn(),
		getAllKeys: jest.fn(() => []),
	},
}));
jest.mock('@react-navigation/native', () => ({
	useFocusEffect: jest.fn(),
	useNavigation: jest.fn(() => ({ navigate: jest.fn() })),
}));
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
jest.mock('@/context/WorkoutStudioProvider', () => ({
	useWorkoutStudio: jest.fn(() => ({
		features: { wearables: true },
		isEnabled: jest.fn(() => true),
	})),
}));
jest.mock('../hooks/useCustomWorkouts', () => ({
	useCustomWorkouts: jest.fn(() => ({ data: false })),
}));
jest.mock('../hooks/useTrainingConnectivity', () => ({
	useTrainingConnectivity: jest.fn(() => ({
		isOffline: false,
		refresh: jest.fn(),
	})),
}));
jest.mock('../Progress/progressFeatures', () => ({
	shouldShowTodayProgressCard: jest.fn(() => false),
}));
jest.mock('../components/SkeletonCard', () => 'SkeletonCard');
jest.mock('../components/SectionHeading', () => 'SectionHeading');
jest.mock('../components/OfflineBanner', () => 'OfflineBanner');
jest.mock('../components/TrainingState', () => 'TrainingState');
jest.mock('./components/ConsistencyCard', () => 'ConsistencyCard');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-safe-area-context', () => ({
	SafeAreaView: 'SafeAreaView',
}));

const mockedUseQuery = jest.mocked(useQuery);

const snapshot = {
	asOfDate: '2026-08-09',
	windowStart: '2026-08-06',
	windowEnd: '2026-08-09',
	hasConnection: null,
	metrics: [
		{
			provider: 'apple_health' as const,
			asOfDate: '2026-08-09',
			sleepMinutes: null,
			hrvMs: null,
			restingHr: null,
			nativeRecoveryScore: null,
			nativeReadinessScore: null,
		},
	],
};

describe('Today readiness state presentation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedUseQuery.mockImplementation(options => {
			const key = options.queryKey as readonly unknown[];
			if (key[0] === 'ws-member-readiness-today') {
				return {
					data: {
						status: 'ready',
						data: {
							...snapshot,
							hasConnection: true,
							metrics: [
								{
									...snapshot.metrics[0],
									nativeReadinessScore: 81,
								},
							],
						},
						error: null,
						asOfDate: snapshot.asOfDate,
					},
					isLoading: false,
					isRefetching: false,
					isError: false,
					refetch: jest.fn(),
				} as never;
			}
			return {
				data: [],
				isLoading: false,
				isRefetching: false,
				isError: false,
				refetch: jest.fn(),
			} as never;
		});
	});

	it.each([
		[
			'loading',
			{ status: 'loading', data: null, error: null, asOfDate: null },
		],
		[
			'ready',
			{
				status: 'ready',
				data: snapshot,
				error: null,
				asOfDate: snapshot.asOfDate,
			},
		],
		[
			'empty',
			{
				status: 'empty',
				data: { ...snapshot, metrics: [] },
				error: null,
				asOfDate: snapshot.asOfDate,
			},
		],
		[
			'baseline',
			{
				status: 'baseline',
				data: snapshot,
				error: null,
				asOfDate: snapshot.asOfDate,
			},
		],
		[
			'error',
			{
				status: 'error',
				data: null,
				error: {
					code: 'server',
					kind: 'server',
					message: 'Readiness is temporarily unavailable.',
				},
				asOfDate: null,
			},
		],
	] as const)(
		'renders the %s state without zero fallbacks',
		(_name, result) => {
			const copy = readinessCopy(result as ReadinessResult);
			expect(copy.score).not.toBe('0');
			if (result.status === 'baseline') {
				expect(copy.band).toBe('Baseline');
				expect(copy.confidence).toBe('Building');
			}
			if (result.status === 'error')
				expect(copy.detail).toBe(result.error.message);
		},
	);

	it('renders the readiness summary values and provider-native metrics', () => {
		const screen = render(createElement(Today));

		expect(screen.getByLabelText(/Score 81/)).toBeTruthy();
		expect(screen.getByText('Score 81')).toBeTruthy();
		expect(screen.getByText('Band Ready')).toBeTruthy();
		expect(screen.getByText('Confidence Measured')).toBeTruthy();
		expect(screen.getByText('As of 2026-08-09')).toBeTruthy();
		expect(
			screen.getByText(
				/Apple Health native · Sleep Not available · HRV Not available/,
			),
		).toBeTruthy();
		expect(screen.queryByText(/undefined/)).toBeNull();
	});
});
