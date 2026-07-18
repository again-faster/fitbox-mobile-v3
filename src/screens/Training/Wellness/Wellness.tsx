import { wsApi, wsRpc } from '@/services/workoutStudio/api';
/* eslint-disable no-await-in-loop, no-nested-ternary, no-restricted-syntax */
import {
	getStoredWSSession,
	getValidWSToken,
} from '@/services/workoutStudio/auth';
import { Constant } from '@/utils';
import { trainingTheme } from '@/theme/training';
import type {
	WellnessDimension,
	WellnessTrend,
} from '@/services/workoutStudio/types';
import type { TrainingStackScreenProps } from '@/types/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import Slider from '@ptomasroos/react-native-multi-slider';
import moment from 'moment';
import {
	loadWellnessQueue,
	queueWellnessCheckin,
	removeQueuedWellnessCheckin,
	type QueuedWellnessCheckin,
} from '@/services/workoutStudio/wellnessQueue';
import SkeletonCard from '../components/SkeletonCard';
import { useTrainingConnectivity } from '../hooks/useTrainingConnectivity';

type Props = TrainingStackScreenProps<'TrainingWellness'>;

const CONSENT_VERSION = '2026-06-v1';
const CONSENT_TEXT =
	'Wellness check-ins are optional. They help you and (if you choose) your coach see how training feels over time. Your responses are never used to gate participation or change programming automatically. You can withdraw consent or delete any entry at any time.';

const today = moment().format('YYYY-MM-DD');

type WellnessResponseSummary = {
	id: string;
	recorded_for: string;
	created_at: string;
};

const Wellness = ({ navigation }: Props) => {
	const qc = useQueryClient();
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;
	const { isOffline } = useTrainingConnectivity();

	const [scores, setScores] = useState<Record<string, number>>({});
	const [queued, setQueued] = useState<QueuedWellnessCheckin[]>([]);
	const syncingQueue = useRef(false);

	const consent = useQuery({
		queryKey: ['ws-wellness-consent', uid, tenantId],
		queryFn: () =>
			wsApi()
				.get('member_wellness_consents', {
					searchParams: {
						select: 'id',
						user_id: `eq.${uid}`,
						tenant_id: `eq.${tenantId}`,
						revoked_at: 'is.null',
						limit: '1',
					},
				})
				.json<{ id: string }[]>(),
		enabled: !!uid && !!tenantId,
	});

	const hasConsent = (consent.data?.length ?? 0) > 0;

	const history = useQuery({
		queryKey: ['ws-wellness-history', uid, tenantId],
		queryFn: () =>
			wsApi()
				.get('wellness_responses', {
					searchParams: {
						select: 'id,recorded_for,created_at',
						user_id: `eq.${uid}`,
						tenant_id: `eq.${tenantId}`,
						order: 'recorded_for.desc',
						limit: '14',
					},
				})
				.json<WellnessResponseSummary[]>(),
		enabled: !!uid && !!tenantId && hasConsent,
	});

	const todayResponse = history.data?.find(
		item => item.recorded_for === today,
	);

	const dimensions = useQuery({
		queryKey: ['ws-wellness-dimensions', tenantId],
		queryFn: () =>
			wsApi()
				.get('wellness_dimensions', {
					searchParams: {
						tenant_id: `eq.${tenantId}`,
						order: 'position.asc',
					},
				})
				.json<WellnessDimension[]>(),
		enabled: !!tenantId && hasConsent,
	});

	const trends = useQuery({
		queryKey: ['ws-wellness-trends', uid, tenantId],
		queryFn: () =>
			wsRpc<WellnessTrend[]>('member_wellness_trends', {
				p_tenant_id: tenantId,
				p_recent_days: 7,
				p_baseline_days: 28,
			}),
		enabled: !!uid && !!tenantId && hasConsent,
		staleTime: 300_000,
	});

	const grantConsent = useMutation({
		mutationFn: async () => {
			const token = await getValidWSToken();
			const url = `${Constant.WS_SUPABASE_URL}/rest/v1/member_wellness_consents`;
			const resp = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					apikey: Constant.WS_SUPABASE_ANON_KEY,
					...(token ? { Authorization: `Bearer ${token}` } : {}),
					Prefer: 'return=minimal',
				},
				body: JSON.stringify({
					user_id: uid,
					tenant_id: tenantId,
					consent_text_version: CONSENT_VERSION,
					purpose: CONSENT_TEXT,
				}),
			});
			if (!resp.ok) {
				const body = await resp.text();
				throw new Error(`${resp.status}: ${body}`);
			}
		},
		onSuccess: () => {
			void qc.invalidateQueries({
				queryKey: ['ws-wellness-consent', uid, tenantId],
			});
		},
		onError: (err: unknown) => {
			const detail = err instanceof Error ? err.message : String(err);
			Alert.alert('Error', detail);
		},
	});

	const removeResponse = async (responseId: string) => {
		await wsApi().delete('wellness_dimension_responses', {
			searchParams: { response_id: `eq.${responseId}` },
		});
		await wsApi().delete('wellness_responses', {
			searchParams: { id: `eq.${responseId}`, user_id: `eq.${uid}` },
		});
	};

	const writeCheckin = async (
		recordedFor: string,
		values: Record<string, number>,
	) => {
		const existing = await wsApi()
			.get('wellness_responses', {
				searchParams: {
					select: 'id',
					user_id: `eq.${uid}`,
					tenant_id: `eq.${tenantId}`,
					recorded_for: `eq.${recordedFor}`,
					limit: '1',
				},
			})
			.json<{ id: string }[]>();
		let responseId = existing[0]?.id;
		if (!responseId) {
			const created = await wsApi()
				.post('wellness_responses', {
					json: {
						user_id: uid,
						tenant_id: tenantId,
						recorded_for: recordedFor,
					},
					headers: { Prefer: 'return=representation' },
				})
				.json<{ id: string }[]>();
			responseId = created[0]?.id;
		}
		if (!responseId || !dimensions.data)
			throw new Error('Wellness response could not be created.');
		await Promise.all(
			dimensions.data.map(d =>
				wsApi().post('wellness_dimension_responses', {
					searchParams: { on_conflict: 'response_id,dimension_id' },
					json: {
						response_id: responseId,
						dimension_id: d.id,
						value: values[d.id] ?? 3,
					},
					headers: {
						Prefer: 'resolution=merge-duplicates,return=minimal',
					},
				}),
			),
		);
	};

	const saveCheckin = useMutation({
		mutationFn: async () => {
			const entry: QueuedWellnessCheckin = {
				id: `${uid}:${tenantId}:${today}`,
				userId: uid!,
				tenantId: tenantId!,
				recordedFor: today,
				scores,
				queuedAt: new Date().toISOString(),
			};
			if (isOffline) {
				const next = await queueWellnessCheckin(entry);
				setQueued(
					next.filter(
						item =>
							item.userId === uid && item.tenantId === tenantId,
					),
				);
				return 'queued' as const;
			}
			try {
				await writeCheckin(today, scores);
				const next = await removeQueuedWellnessCheckin(entry.id);
				setQueued(
					next.filter(
						item =>
							item.userId === uid && item.tenantId === tenantId,
					),
				);
				return 'saved' as const;
			} catch (error) {
				if (error instanceof TypeError) {
					const next = await queueWellnessCheckin(entry);
					setQueued(
						next.filter(
							item =>
								item.userId === uid &&
								item.tenantId === tenantId,
						),
					);
					return 'queued' as const;
				}
				throw error;
			}
		},
		onSuccess: result => {
			if (result === 'queued') {
				Alert.alert(
					'Saved offline',
					'Your check-in is encrypted on this phone and will sync when you reconnect.',
				);
				return;
			}
			void qc.invalidateQueries({ queryKey: ['ws-wellness-today', uid] });
			void qc.invalidateQueries({
				queryKey: ['ws-wellness-history', uid, tenantId],
			});
			void qc.invalidateQueries({
				queryKey: ['ws-wellness-trends', uid, tenantId],
			});
			Alert.alert(
				'Saved',
				todayResponse
					? "Today's check-in was updated."
					: 'Wellness check-in recorded.',
			);
		},
		onError: () => {
			Alert.alert(
				"Check-in couldn't be saved",
				'Check your connection and try again.',
			);
		},
	});

	useEffect(() => {
		void loadWellnessQueue().then(items =>
			setQueued(
				items.filter(
					item => item.userId === uid && item.tenantId === tenantId,
				),
			),
		);
	}, [uid, tenantId]);

	useEffect(() => {
		if (
			isOffline ||
			syncingQueue.current ||
			!uid ||
			!tenantId ||
			!dimensions.data
		)
			return;
		const pending = queued.filter(
			item => item.userId === uid && item.tenantId === tenantId,
		);
		if (pending.length === 0) return;
		syncingQueue.current = true;
		void (async () => {
			for (const item of pending) {
				try {
					await writeCheckin(item.recordedFor, item.scores);
					await removeQueuedWellnessCheckin(item.id);
				} catch {
					break;
				}
			}
			const remaining = await loadWellnessQueue();
			setQueued(
				remaining.filter(
					item => item.userId === uid && item.tenantId === tenantId,
				),
			);
			void qc.invalidateQueries({
				queryKey: ['ws-wellness-history', uid, tenantId],
			});
			void qc.invalidateQueries({ queryKey: ['ws-wellness-today', uid] });
		})().finally(() => {
			syncingQueue.current = false;
		});
	}, [isOffline, queued, uid, tenantId, dimensions.data]);

	const deleteCheckin = useMutation({
		mutationFn: removeResponse,
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ['ws-wellness-today', uid] });
			void qc.invalidateQueries({
				queryKey: ['ws-wellness-history', uid, tenantId],
			});
			void qc.invalidateQueries({
				queryKey: ['ws-wellness-trends', uid, tenantId],
			});
		},
		onError: () =>
			Alert.alert(
				"Check-in couldn't be deleted",
				'Check your connection and try again.',
			),
	});

	const withdrawConsent = useMutation({
		mutationFn: () =>
			wsApi().patch('member_wellness_consents', {
				searchParams: {
					id: `eq.${consent.data?.[0]?.id}`,
					user_id: `eq.${uid}`,
				},
				json: { revoked_at: new Date().toISOString() },
			}),
		onSuccess: () => {
			void qc.invalidateQueries({
				queryKey: ['ws-wellness-consent', uid, tenantId],
			});
		},
		onError: () =>
			Alert.alert(
				"Consent couldn't be withdrawn",
				'Check your connection and try again.',
			),
	});

	const confirmDelete = (item: WellnessResponseSummary) => {
		Alert.alert(
			'Delete check-in?',
			`${moment(item.recorded_for).format('D MMMM YYYY')} will be permanently removed.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => deleteCheckin.mutate(item.id),
				},
			],
		);
	};

	const confirmWithdraw = () => {
		Alert.alert(
			'Withdraw wellness consent?',
			'New check-ins will be disabled. Your existing history is not deleted automatically.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Withdraw',
					style: 'destructive',
					onPress: () => withdrawConsent.mutate(),
				},
			],
		);
	};

	if (consent.isLoading) {
		return (
			<View style={styles.loadingScreen}>
				<SkeletonCard />
				<SkeletonCard />
			</View>
		);
	}

	if (!hasConsent) {
		return (
			<ScrollView
				style={styles.screen}
				contentContainerStyle={styles.container}
			>
				<Text style={styles.title}>Wellness check-ins</Text>
				<View style={styles.consentBox}>
					<Text style={styles.consentText}>{CONSENT_TEXT}</Text>
				</View>
				<TouchableOpacity
					style={styles.primaryBtn}
					onPress={() => grantConsent.mutate()}
					disabled={grantConsent.isPending}
				>
					<Text style={styles.primaryBtnText}>
						{grantConsent.isPending
							? 'Saving…'
							: 'I agree — activate wellness'}
					</Text>
				</TouchableOpacity>
			</ScrollView>
		);
	}

	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={styles.container}
		>
			<View style={styles.hero}>
				<Text style={styles.eyebrow}>DAILY WELLNESS</Text>
				<Text style={styles.heroTitle}>
					{todayResponse
						? 'How are you feeling now?'
						: 'How are you feeling today?'}
				</Text>
				<Text style={styles.heroCopy}>
					A quick check-in helps you spot patterns in recovery and
					training.
				</Text>
			</View>
			<Text style={styles.privacy}>
				Coaches at your gym can view your last 28 days through an
				audited view — every coach read is logged.
			</Text>

			<Text style={styles.sectionHeader}>
				{todayResponse ? "Update today's check-in" : "Today's check-in"}
			</Text>
			{queued.length > 0 ? (
				<View style={styles.queuedBanner}>
					<Text style={styles.queuedTitle}>Waiting to sync</Text>
					<Text style={styles.queuedText}>
						{queued.length} wellness check-in
						{queued.length === 1 ? '' : 's'} saved securely on this
						phone.
					</Text>
				</View>
			) : null}
			{todayResponse ? (
				<Text style={styles.savedHint}>
					Already recorded today. Saving again replaces today&apos;s
					entry.
				</Text>
			) : null}

			{dimensions.data?.map(d => (
				<View key={d.id} style={styles.sliderRow}>
					<View style={styles.sliderHeader}>
						<Text style={styles.dimensionLabel}>{d.label}</Text>
						<Text style={styles.sliderValue}>
							{scores[d.id] ?? 3}
						</Text>
					</View>
					<View style={styles.sliderWrap}>
						<Text style={styles.sliderEndLabel}>1</Text>
						<Slider
							values={[scores[d.id] ?? 3]}
							min={1}
							max={5}
							step={1}
							sliderLength={200}
							onValuesChange={([v]) =>
								setScores(prev => ({
									...prev,
									[d.id]: v ?? 3,
								}))
							}
							selectedStyle={{
								backgroundColor: trainingTheme.colors.primary,
							}}
							unselectedStyle={{
								backgroundColor: trainingTheme.colors.border,
							}}
							markerStyle={{
								backgroundColor: trainingTheme.colors.primary,
								borderColor: '#fff',
								borderWidth: 2,
								width: 32,
								height: 32,
								borderRadius: 16,
							}}
							touchDimensions={{
								height: 56,
								width: 56,
								borderRadius: 28,
								slipDisplacement: 40,
							}}
						/>
						<Text style={styles.sliderEndLabel}>5</Text>
					</View>
					<Text style={styles.sliderDirection}>
						{d.higher_is_better
							? '← worse  ·  better →'
							: '← better  ·  worse →'}
					</Text>
				</View>
			))}

			<TouchableOpacity
				style={styles.primaryBtn}
				onPress={() => saveCheckin.mutate()}
				disabled={saveCheckin.isPending}
			>
				<Text style={styles.primaryBtnText}>
					{saveCheckin.isPending
						? 'Saving…'
						: todayResponse
							? 'Update check-in'
							: 'Save check-in'}
				</Text>
			</TouchableOpacity>

			{(history.data?.length ?? 0) > 0 ? (
				<>
					<Text style={styles.sectionHeader}>Recent check-ins</Text>
					{history.data?.map(item => (
						<View key={item.id} style={styles.historyRow}>
							<View style={{ flex: 1 }}>
								<Text style={styles.historyDate}>
									{moment(item.recorded_for).format(
										'dddd, D MMMM',
									)}
								</Text>
								<Text style={styles.historyMeta}>
									{item.recorded_for === today
										? 'Today'
										: 'Recorded check-in'}
								</Text>
							</View>
							<TouchableOpacity
								accessibilityRole="button"
								accessibilityLabel={`Delete check-in from ${moment(item.recorded_for).format('D MMMM')}`}
								style={styles.deleteButton}
								onPress={() => confirmDelete(item)}
							>
								<Text style={styles.deleteLabel}>Delete</Text>
							</TouchableOpacity>
						</View>
					))}
				</>
			) : null}

			{/* Trends */}
			{(trends.data?.length ?? 0) > 0 && (
				<>
					<Text style={styles.sectionHeader}>Your 7-day trend</Text>
					{trends.data?.map(t => {
						const recent = t.recent_avg ?? 0;
						const baseline = t.baseline_avg ?? 0;
						const delta = recent - baseline;
						const improved = t.higher_is_better
							? delta > 0
							: delta < 0;
						let trendColor: string = trainingTheme.colors.textMuted;
						if (improved) trendColor = trainingTheme.colors.success;
						else if (delta !== 0)
							trendColor = trainingTheme.colors.danger;
						let trendText = 'Holding steady';
						if (delta !== 0) {
							trendText = improved
								? `↑ Better (${recent.toFixed(1)} vs ${baseline.toFixed(1)})`
								: `↓ Lower (${recent.toFixed(1)} vs ${baseline.toFixed(1)})`;
						}
						return (
							<View key={t.slug} style={styles.trendCard}>
								<Text style={styles.dimensionLabel}>
									{t.label}
								</Text>
								<Text
									style={[
										styles.trendDelta,
										{ color: trendColor },
									]}
								>
									{trendText}
								</Text>
							</View>
						);
					})}
				</>
			)}

			{/* My Injuries entry point */}
			<TouchableOpacity
				style={styles.injuryCard}
				onPress={() => navigation.navigate('TrainingInjuryList')}
				activeOpacity={0.7}
			>
				<Text style={styles.injuryCardLabel}>My Injuries</Text>
				<Text style={styles.injuryCardChevron}>›</Text>
			</TouchableOpacity>

			<TouchableOpacity
				style={styles.withdrawButton}
				onPress={confirmWithdraw}
				disabled={withdrawConsent.isPending}
			>
				<Text style={styles.withdrawLabel}>
					{withdrawConsent.isPending
						? 'Withdrawing…'
						: 'Withdraw wellness consent'}
				</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	loadingScreen: {
		flex: 1,
		backgroundColor: trainingTheme.colors.background,
		padding: 16,
	},
	container: { padding: 16, paddingBottom: 40, gap: 12 },
	title: {
		color: trainingTheme.colors.text,
		fontSize: 26,
		fontWeight: '700',
	},
	hero: {
		padding: 20,
		borderRadius: 22,
		backgroundColor: trainingTheme.colors.primarySoft,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
	},
	eyebrow: {
		color: trainingTheme.colors.primary,
		fontSize: 12,
		fontWeight: '700',
		letterSpacing: 1,
	},
	heroTitle: {
		color: trainingTheme.colors.text,
		fontSize: 24,
		fontWeight: '700',
		marginTop: 6,
	},
	heroCopy: {
		color: trainingTheme.colors.textMuted,
		fontSize: 14,
		lineHeight: 20,
		marginTop: 5,
	},
	consentBox: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: 18,
		padding: 18,
	},
	consentText: {
		color: trainingTheme.colors.textMuted,
		fontSize: 15,
		lineHeight: 22,
	},
	privacy: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		lineHeight: 18,
	},
	queuedBanner: { backgroundColor: '#FFF4DA', borderRadius: 12, padding: 14 },
	queuedTitle: { color: '#8A5300', fontSize: 14, fontWeight: '700' },
	queuedText: {
		color: '#8A5300',
		fontSize: 12,
		lineHeight: 18,
		marginTop: 2,
	},
	savedHint: {
		color: trainingTheme.colors.textMuted,
		fontSize: 13,
		lineHeight: 18,
	},
	sectionHeader: {
		color: trainingTheme.colors.text,
		fontSize: 17,
		fontWeight: '700',
		marginTop: 8,
	},
	sliderRow: {
		gap: 6,
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: 18,
		padding: 16,
	},
	sliderHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	sliderWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	dimensionLabel: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '600',
	},
	sliderValue: {
		color: trainingTheme.colors.primary,
		fontSize: 20,
		fontWeight: '700',
	},
	sliderEndLabel: {
		fontSize: 12,
		fontWeight: '600',
		color: trainingTheme.colors.textMuted,
		width: 14,
		textAlign: 'center',
	},
	sliderDirection: {
		fontSize: 13,
		color: trainingTheme.colors.textMuted,
		textAlign: 'center',
		letterSpacing: 0.2,
	},
	trendCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: 18,
		padding: 16,
	},
	trendDelta: { fontSize: 14, marginTop: 4 },
	historyRow: {
		minHeight: 66,
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: 16,
		paddingLeft: 14,
		paddingRight: 6,
		flexDirection: 'row',
		alignItems: 'center',
	},
	historyDate: {
		color: trainingTheme.colors.text,
		fontSize: 15,
		fontWeight: '600',
	},
	historyMeta: {
		color: trainingTheme.colors.textMuted,
		fontSize: 12,
		marginTop: 3,
	},
	deleteButton: {
		minWidth: 60,
		minHeight: 44,
		alignItems: 'center',
		justifyContent: 'center',
	},
	deleteLabel: { color: '#D32F2F', fontSize: 13, fontWeight: '600' },
	injuryCard: {
		backgroundColor: trainingTheme.colors.surface,
		borderColor: trainingTheme.colors.border,
		borderWidth: 1,
		borderRadius: 18,
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 8,
	},
	injuryCardLabel: {
		fontSize: 16,
		fontWeight: '600',
		color: trainingTheme.colors.text,
	},
	injuryCardChevron: { fontSize: 22, color: trainingTheme.colors.textMuted },
	primaryBtn: {
		padding: 16,
		backgroundColor: trainingTheme.colors.primary,
		borderRadius: 16,
		alignItems: 'center',
		marginTop: 8,
	},
	primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
	withdrawButton: {
		minHeight: 48,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 4,
	},
	withdrawLabel: {
		color: trainingTheme.colors.danger,
		fontSize: 14,
		fontWeight: '600',
	},
});

export default Wellness;
