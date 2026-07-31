import { getStoredWSSession } from '@/services/workoutStudio/auth';
import {
	flushSectionResultQueue,
	loadSectionResultQueue,
} from '@/services/workoutStudio/sectionResultQueue';
import { act, render, waitFor } from '@testing-library/react-native';
import { useSectionResultQueue } from './useSectionResultQueue';
import { useTrainingConnectivity } from './useTrainingConnectivity';

jest.mock('@/services/workoutStudio/auth');
jest.mock('@/services/workoutStudio/sectionResultQueue');
jest.mock('./useTrainingConnectivity', () => ({
	useTrainingConnectivity: jest.fn(),
}));

const mockedGetStoredWSSession = jest.mocked(getStoredWSSession);
const mockedLoadSectionResultQueue = jest.mocked(loadSectionResultQueue);
const mockedFlushSectionResultQueue = jest.mocked(flushSectionResultQueue);
const mockedUseTrainingConnectivity = jest.mocked(useTrainingConnectivity);

const QueueProbe = ({ enabled }: { enabled: boolean }) => {
	useSectionResultQueue(enabled);
	return null;
};

describe('useSectionResultQueue', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockedGetStoredWSSession.mockReturnValue({
			user: {
				id: 'user-1',
				active_tenant_id: 'tenant-1',
			},
		} as ReturnType<typeof getStoredWSSession>);
		mockedUseTrainingConnectivity.mockReturnValue({
			isOffline: false,
		} as ReturnType<typeof useTrainingConnectivity>);
		mockedLoadSectionResultQueue.mockResolvedValue([
			{
				id: 'queued-1',
				userId: 'user-1',
				tenantId: 'tenant-1',
			},
		] as Awaited<ReturnType<typeof loadSectionResultQueue>>);
		mockedFlushSectionResultQueue.mockResolvedValue({
			synced: 1,
			remaining: 0,
		});
	});

	it('does not flush while disabled and resumes flushing when re-enabled', async () => {
		const view = render(<QueueProbe enabled={false} />);

		await act(async () => {
			await Promise.resolve();
			await Promise.resolve();
		});

		expect(mockedLoadSectionResultQueue).not.toHaveBeenCalled();
		expect(mockedFlushSectionResultQueue).not.toHaveBeenCalled();

		view.rerender(<QueueProbe enabled />);

		await waitFor(() => {
			expect(mockedFlushSectionResultQueue).toHaveBeenCalledTimes(1);
			expect(mockedFlushSectionResultQueue).toHaveBeenLastCalledWith(
				'user-1',
				'tenant-1',
			);
		});
	});
});
