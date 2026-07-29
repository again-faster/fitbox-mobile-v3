import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { MMKV } from 'react-native-mmkv';

import type { ClassSessionSummary } from '@/services/workoutStudio/classSessionSummary';
import { ThemeProvider } from '@/theme';

import TodaySessionCard from './TodaySessionCard';

const summary: ClassSessionSummary = {
	workoutId: 'workout-1',
	workoutName: 'Wednesday Conditioning',
	sections: [
		{
			id: 'section-1',
			name: 'Main Set',
			details: ['3 rounds'],
			movements: ['200 m Run', '10 x Air Squat'],
			remainingMovementCount: 2,
		},
	],
};

const storage = new MMKV();
const renderCard = (card: React.ReactElement) =>
	render(<ThemeProvider storage={storage}>{card}</ThemeProvider>);

describe('TodaySessionCard', () => {
	it('omits the card when there is no summary to show', () => {
		renderCard(<TodaySessionCard isLoading={false} summary={null} />);

		expect(screen.queryByText('Today’s session')).toBeNull();
	});

	it('shows a loading state when the summary is loading', () => {
		renderCard(<TodaySessionCard isLoading summary={null} />);

		expect(screen.getByText('Today’s session')).toBeTruthy();
		expect(screen.getByText('Loading session…')).toBeTruthy();
	});

	it('renders the workout and its ordered section summary', () => {
		renderCard(<TodaySessionCard isLoading={false} summary={summary} />);

		expect(screen.getByText('Wednesday Conditioning')).toBeTruthy();
		expect(screen.getByText('Main Set')).toBeTruthy();
		expect(
			screen.getByText(
				'3 rounds · 200 m Run · 10 x Air Squat · +2 more',
			),
		).toBeTruthy();
	});

	it('keeps cached summary content visible while refreshing', () => {
		renderCard(<TodaySessionCard isLoading summary={summary} />);

		expect(screen.getByText('Wednesday Conditioning')).toBeTruthy();
		expect(screen.queryByText('Loading session…')).toBeNull();
	});
});
