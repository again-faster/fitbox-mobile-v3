import {
	ALL_MEMBER_FEATURES_DISABLED,
	ALL_MEMBER_FEATURES_ENABLED,
	MemberFeatureMap,
	saveCachedMemberFeatures,
} from '@/services/workoutStudio/memberFeatures';
import { WSSession, WSSessionResult } from '@/services/workoutStudio/auth';
import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { useWSAuth } from '@/screens/Training/hooks/useWSAuth';
import {
	WorkoutStudioProvider,
	useWorkoutStudio,
} from './WorkoutStudioProvider';

let mockAuthUser: {
	user_data: {
		email: string;
		user_id: number;
		onboarding_gym_ids?: number[];
		first_name: string;
		last_name: string;
	};
} | null;

jest.mock('@/auth/hooks/useAuth', () => ({
	__esModule: true,
	default: () => ({ user: mockAuthUser }),
}));

const createStorage = () => {
	const values = new Map<string, string>();
	return {
		values,
		storage: {
			getString: (key: string) => values.get(key),
			set: (key: string, value: string) => values.set(key, value),
		},
	};
};

const createSession = (
	tenantId: string,
	persona: WSSession['user']['persona'] = 'member',
): WSSession => ({
	access_token: `access-${tenantId}`,
	refresh_token: `refresh-${tenantId}`,
	expires_at: Math.floor(Date.now() / 1000) + 3600,
	user: {
		id: `user-${tenantId}`,
		email: 'member@example.com',
		full_name: 'Member Example',
		persona,
		active_tenant_id: tenantId,
		tenant_role: persona,
	},
});

const features = (
	overrides: Partial<MemberFeatureMap>,
): MemberFeatureMap => ({
	...ALL_MEMBER_FEATURES_DISABLED,
	...overrides,
});

const Consumer = () => {
	const studio = useWorkoutStudio();
	return (
		<>
			<Text testID="status">{studio.state.status}</Text>
			<Text testID="tenant">{studio.tenantId ?? 'none'}</Text>
			<Text testID="source">{studio.featureSource}</Text>
			<Text testID="classes">
				{String(studio.isEnabled('classes'))}
			</Text>
			<Text testID="results">
				{String(studio.isEnabled('results'))}
			</Text>
		</>
	);
};

describe('WorkoutStudioProvider', () => {
	beforeEach(() => {
		mockAuthUser = {
			user_data: {
				email: 'member@example.com',
				user_id: 42,
				onboarding_gym_ids: [10],
				first_name: 'Member',
				last_name: 'Example',
			},
		};
	});

	it('renders cached member flags before replacing them with a persisted network refresh', async () => {
		const { storage, values } = createStorage();
		saveCachedMemberFeatures(storage, 'tenant-a', features({ classes: false }));
		let resolveFeatures:
			| ((value: MemberFeatureMap) => void)
			| undefined;
		const networkFeatures = new Promise<MemberFeatureMap>(resolve => {
			resolveFeatures = resolve;
		});
		const fetchMemberFeatures = jest.fn(() => networkFeatures);

		const screen = render(
			<WorkoutStudioProvider
				storage={storage}
				services={{
					ensureWSSession: async () => ({
						session: createSession('tenant-a'),
					}),
					fetchMemberFeatures,
				}}
			>
				<Consumer />
			</WorkoutStudioProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId('status')).toHaveTextContent(
				'authenticated',
			);
			expect(screen.getByTestId('source')).toHaveTextContent('cache');
			expect(screen.getByTestId('classes')).toHaveTextContent('false');
		});

		await act(async () => {
			resolveFeatures?.(features({ classes: true }));
			await networkFeatures;
		});

		await waitFor(() => {
			expect(screen.getByTestId('source')).toHaveTextContent('network');
			expect(screen.getByTestId('classes')).toHaveTextContent('true');
		});
		expect(fetchMemberFeatures).toHaveBeenCalledWith('tenant-a');
		expect(
			Array.from(values.values()).some(value =>
				value.includes('"classes":true'),
			),
		).toBe(true);
	});

	it('never exposes the previous tenant flags after the auth gym changes', async () => {
		const { storage } = createStorage();
		saveCachedMemberFeatures(storage, 'tenant-a', features({ classes: false }));
		saveCachedMemberFeatures(storage, 'tenant-b', features({ classes: true }));
		const ensureWSSession = jest.fn(
			async ({
				fitbox_gym_id: gymId,
			}: {
				fitbox_gym_id?: string;
			}): Promise<WSSessionResult> => ({
				session: createSession(
					gymId === '20' ? 'tenant-b' : 'tenant-a',
				),
			}),
		);
		const observed: string[] = [];
		const ObservingConsumer = () => {
			const studio = useWorkoutStudio();
			observed.push(
				`${studio.tenantId}:${studio.isEnabled('classes')}`,
			);
			return <Consumer />;
		};
		const services = {
			ensureWSSession,
			fetchMemberFeatures: jest.fn().mockRejectedValue(new Error('offline')),
		};

		const screen = render(
			<WorkoutStudioProvider storage={storage} services={services}>
				<ObservingConsumer />
			</WorkoutStudioProvider>,
		);
		await waitFor(() => {
			expect(screen.getByTestId('tenant')).toHaveTextContent('tenant-a');
			expect(screen.getByTestId('classes')).toHaveTextContent('false');
		});

		mockAuthUser = {
			...mockAuthUser!,
			user_data: {
				...mockAuthUser!.user_data,
				onboarding_gym_ids: [20],
			},
		};
		screen.rerender(
			<WorkoutStudioProvider storage={storage} services={services}>
				<ObservingConsumer />
			</WorkoutStudioProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId('tenant')).toHaveTextContent('tenant-b');
			expect(screen.getByTestId('classes')).toHaveTextContent('true');
		});
		expect(observed).not.toContain('tenant-b:false');
	});

	it('fails open on the first member load when the network is offline', async () => {
		const { storage } = createStorage();
		const screen = render(
			<WorkoutStudioProvider
				storage={storage}
				services={{
					ensureWSSession: async () => ({
						session: createSession('tenant-a'),
					}),
					fetchMemberFeatures: async () => {
						throw new Error('offline');
					},
				}}
			>
				<Consumer />
			</WorkoutStudioProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId('status')).toHaveTextContent(
				'authenticated',
			);
			expect(screen.getByTestId('source')).toHaveTextContent(
				'first-load',
			);
			expect(screen.getByTestId('classes')).toHaveTextContent('true');
			expect(screen.getByTestId('results')).toHaveTextContent('true');
		});
	});

	it.each(['coach', 'gym_admin', 'solo'] as const)(
		'enables every member feature for the %s persona without fetching flags',
		async persona => {
			const { storage } = createStorage();
			const fetchMemberFeatures = jest.fn();
			const screen = render(
				<WorkoutStudioProvider
					storage={storage}
					services={{
						ensureWSSession: async () => ({
							session: createSession('tenant-a', persona),
						}),
						fetchMemberFeatures,
					}}
				>
					<Consumer />
				</WorkoutStudioProvider>,
			);

			await waitFor(() => {
				expect(screen.getByTestId('status')).toHaveTextContent(
					'authenticated',
				);
				expect(screen.getByTestId('classes')).toHaveTextContent(
					String(ALL_MEMBER_FEATURES_ENABLED.classes),
				);
				expect(screen.getByTestId('results')).toHaveTextContent(
					String(ALL_MEMBER_FEATURES_ENABLED.results),
				);
			});
			expect(fetchMemberFeatures).not.toHaveBeenCalled();
		},
	);

	it('provides the legacy useWSAuth shape as an adapter to the context', async () => {
		const { storage } = createStorage();
		let adapter:
			| ReturnType<typeof useWSAuth>
			| undefined;
		let studio:
			| ReturnType<typeof useWorkoutStudio>
			| undefined;
		const AdapterConsumer = () => {
			adapter = useWSAuth();
			studio = useWorkoutStudio();
			return <Text testID="adapter-status">{adapter.state.status}</Text>;
		};

		const screen = render(
			<WorkoutStudioProvider
				storage={storage}
				services={{
					ensureWSSession: async () => ({
						session: createSession('tenant-a', 'coach'),
					}),
				}}
			>
				<AdapterConsumer />
			</WorkoutStudioProvider>,
		);

		await waitFor(() => {
			expect(screen.getByTestId('adapter-status')).toHaveTextContent(
				'authenticated',
			);
		});
		expect(adapter?.state).toBe(studio?.state);
		expect(adapter?.retry).toBe(studio?.retrySession);
		expect(adapter?.signOut).toBe(studio?.signOut);
	});
});
