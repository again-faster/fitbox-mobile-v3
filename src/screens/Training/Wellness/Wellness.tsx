import { wsApi, wsRpc } from '@/services/workoutStudio/api';
import {
	getStoredWSSession,
	getValidWSToken,
} from '@/services/workoutStudio/auth';
import { Constant } from '@/utils';
import type {
	WellnessDimension,
	WellnessTrend,
} from '@/services/workoutStudio/types';
import type { TrainingStackScreenProps } from '@/types/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import SkeletonCard from '../components/SkeletonCard';

type Props = TrainingStackScreenProps<'TrainingWellness'>;

const CONSENT_VERSION = '2026-06-v1';
const CONSENT_TEXT =
	'Wellness check-ins are optional. They help you and (if you choose) your coach see how training feels over time. Your responses are never used to gate participation or change programming automatically. You can withdraw consent or delete any entry at any time.';

const today = moment().format('YYYY-MM-DD');

const Wellness = ({ navigation }: Props) => {
	const qc = useQueryClient();
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;

	const [scores, setScores] = useState<Record<string, number>>({});

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

	const saveCheckin = useMutation({
		mutationFn: async () => {
			const response = await wsApi()
				.post('wellness_responses', {
					json: {
						user_id: uid,
						tenant_id: tenantId,
						recorded_for: today,
					},
					headers: { Prefer: 'return=representation' },
				})
				.json<{ id: string }[]>();

			const responseId = response[0]?.id;
			if (!responseId || !dimensions.data) return;

			await Promise.all(
				dimensions.data.map(d =>
					wsApi()
						.post('wellness_dimension_responses', {
							json: {
								wellness_response_id: responseId,
								dimension_id: d.id,
								value: scores[d.id] ?? 3,
							},
						})
						.json(),
				),
			);
		},
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: ['ws-wellness-today', uid] });
			Alert.alert('Saved', 'Wellness check-in recorded.');
		},
	});

	if (consent.isLoading) {
		return (
			<View style={{ flex: 1, backgroundColor: '#F9FAFB', padding: 16 }}>
				<SkeletonCard />
				<SkeletonCard />
			</View>
		);
	}

	if (!hasConsent) {
		return (
			<ScrollView
				style={{ flex: 1, backgroundColor: '#F9FAFB' }}
				contentContainerStyle={styles.container}
			>
				<Text style={[styles.title, { color: '#111827' }]}>
					Wellness check-ins
				</Text>
				<View
					style={[styles.consentBox, { backgroundColor: '#FFFFFF' }]}
				>
					<Text style={[styles.consentText, { color: '#6B7280' }]}>
						{CONSENT_TEXT}
					</Text>
				</View>
				<TouchableOpacity
					style={[styles.primaryBtn, { backgroundColor: '#3B82F6' }]}
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
			style={{ flex: 1, backgroundColor: '#F9FAFB' }}
			contentContainerStyle={styles.container}
		>
			<Text style={[styles.privacy, { color: '#6B7280' }]}>
				Coaches at your gym can view your last 28 days through an
				audited view — every coach read is logged.
			</Text>

			<Text style={[styles.sectionHeader, { color: '#111827' }]}>
				Today&apos;s check-in
			</Text>

			{dimensions.data?.map(d => (
				<View key={d.id} style={styles.sliderRow}>
					<Text style={[styles.dimensionLabel, { color: '#111827' }]}>
						{d.label}
					</Text>
					<View style={styles.sliderWrap}>
						<Text
							style={[styles.sliderValue, { color: '#3B82F6' }]}
						>
							{scores[d.id] ?? 3}
						</Text>
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
							selectedStyle={{ backgroundColor: '#3B82F6' }}
							unselectedStyle={{ backgroundColor: '#D1D5DB' }}
							markerStyle={{
								backgroundColor: '#3B82F6',
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
					</View>
				</View>
			))}

			<TouchableOpacity
				style={[styles.primaryBtn, { backgroundColor: '#3B82F6' }]}
				onPress={() => saveCheckin.mutate()}
				disabled={saveCheckin.isPending}
			>
				<Text style={styles.primaryBtnText}>
					{saveCheckin.isPending ? 'Saving…' : 'Save check-in'}
				</Text>
			</TouchableOpacity>

			{/* Trends */}
			{(trends.data?.length ?? 0) > 0 && (
				<>
					<Text style={[styles.sectionHeader, { color: '#111827' }]}>
						Your 7-day trend
					</Text>
					{trends.data?.map(t => {
						const recent = t.recent_avg ?? 0;
						const baseline = t.baseline_avg ?? 0;
						const delta = recent - baseline;
						const improved = t.higher_is_better
							? delta > 0
							: delta < 0;
						let trendColor = '#6B7280';
						if (improved) trendColor = '#43A047';
						else if (delta !== 0) trendColor = '#F44336';
						let trendText = 'Holding steady';
						if (delta !== 0) {
							trendText = improved
								? `↑ Better (${recent.toFixed(1)} vs ${baseline.toFixed(1)})`
								: `↓ Lower (${recent.toFixed(1)} vs ${baseline.toFixed(1)})`;
						}
						return (
							<View
								key={t.dimension}
								style={[
									styles.trendCard,
									{ backgroundColor: '#FFFFFF' },
								]}
							>
								<Text
									style={[
										styles.dimensionLabel,
										{ color: '#111827' },
									]}
								>
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
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: { padding: 16, paddingBottom: 40, gap: 12 },
	title: { fontSize: 22, fontWeight: '700' },
	consentBox: { borderRadius: 12, padding: 16 },
	consentText: { fontSize: 15, lineHeight: 22 },
	privacy: { fontSize: 13, fontStyle: 'italic' },
	sectionHeader: { fontSize: 17, fontWeight: '600', marginTop: 8 },
	sliderRow: { gap: 6 },
	sliderWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	dimensionLabel: { fontSize: 15, fontWeight: '500' },
	sliderValue: { fontSize: 18, fontWeight: '700', width: 24 },
	trendCard: { borderRadius: 12, padding: 14 },
	trendDelta: { fontSize: 14, marginTop: 4 },
	injuryCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 8,
	},
	injuryCardLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
	injuryCardChevron: { fontSize: 22, color: '#6B7280' },
	primaryBtn: {
		padding: 16,
		borderRadius: 12,
		alignItems: 'center',
		marginTop: 8,
	},
	primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default Wellness;
