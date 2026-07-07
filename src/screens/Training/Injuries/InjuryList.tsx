import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { Injury } from '@/services/workoutStudio/types';
import type { TrainingStackScreenProps } from '@/types/navigation';
import { useQuery } from '@tanstack/react-query';
import {
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

type Props = TrainingStackScreenProps<'TrainingInjuryList'>;

type Section = {
	title: string;
	data: Injury[];
};

const SEVERITY_COLORS: Record<number, string> = {
	1: '#43A047',
	2: '#8BC34A',
	3: '#FFC107',
	4: '#FF7043',
	5: '#F44336',
};

const InjuryList = ({ navigation }: Props) => {
	const session = getStoredWSSession();
	const uid = session?.user.id;
	const tenantId = session?.user.active_tenant_id;

	const query = useQuery({
		queryKey: ['ws-injuries', uid, tenantId],
		queryFn: () =>
			wsApi()
				.get('injuries', {
					searchParams: {
						select: 'id,body_area,side,started_on,initial_severity,status,share_with_coaches,resolved_at,note',
						user_id: `eq.${uid}`,
						tenant_id: `eq.${tenantId}`,
						order: 'started_on.desc',
					},
				})
				.json<Injury[]>(),
		enabled: !!uid && !!tenantId,
	});

	const injuries = query.data ?? [];
	const active = injuries.filter(i => i.status === 'active');
	const resolved = injuries.filter(
		i => i.status === 'recovered' || i.status === 'stopped',
	);

	const sections: Section[] = [];
	if (active.length > 0) sections.push({ title: 'Active', data: active });
	if (resolved.length > 0)
		sections.push({ title: 'Resolved', data: resolved });

	const isEmpty = injuries.length === 0 && !query.isLoading;

	return (
		<View style={styles.container}>
			{isEmpty ? (
				<View style={styles.emptyState}>
					<Text style={styles.emptyText}>No injuries logged</Text>
					<Text style={styles.emptySubtext}>
						Tap + to log an injury
					</Text>
				</View>
			) : (
				<SectionList
					sections={sections}
					keyExtractor={item => item.id}
					contentContainerStyle={styles.listContent}
					refreshControl={
						<RefreshControl
							refreshing={query.isRefetching}
							onRefresh={() => void query.refetch()}
						/>
					}
					renderSectionHeader={({ section }) => (
						<Text style={styles.sectionHeader}>
							{section.title}
						</Text>
					)}
					renderItem={({ item }) => {
						const isActive = item.status === 'active';
						const severityColor =
							SEVERITY_COLORS[item.initial_severity] ?? '#6B7280';

						const cardContent = (
							<View
								style={[
									styles.card,
									isActive && styles.cardActive,
								]}
							>
								<View style={styles.cardRow}>
									<Text style={styles.bodyArea}>
										{item.body_area}
										{item.side !== 'na'
											? ` (${item.side})`
											: ''}
									</Text>
									<View
										style={[
											styles.severityBadge,
											{ backgroundColor: severityColor },
										]}
									>
										<Text style={styles.severityText}>
											{item.initial_severity}
										</Text>
									</View>
								</View>
								<Text style={styles.startedOn}>
									Started {item.started_on}
								</Text>
								{isActive && (
									<Text style={styles.tapHint}>
										Tap to log daily update ›
									</Text>
								)}
							</View>
						);

						if (isActive) {
							return (
								<TouchableOpacity
									onPress={() =>
										navigation.navigate(
											'TrainingInjuryDailyUpdate',
											{
												injuryId: item.id,
												injuryBodyArea: item.body_area,
											},
										)
									}
									activeOpacity={0.7}
								>
									{cardContent}
								</TouchableOpacity>
							);
						}
						return cardContent;
					}}
				/>
			)}

			<TouchableOpacity
				style={styles.fab}
				onPress={() => navigation.navigate('TrainingInjuryLog')}
				activeOpacity={0.8}
			>
				<Text style={styles.fabText}>+</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#F9FAFB' },
	listContent: { padding: 16, paddingBottom: 96, gap: 8 },
	sectionHeader: {
		fontSize: 13,
		fontWeight: '600',
		color: '#6B7280',
		textTransform: 'uppercase',
		letterSpacing: 0.5,
		marginTop: 8,
		marginBottom: 4,
	},
	card: {
		backgroundColor: '#FFFFFF',
		borderRadius: 12,
		padding: 14,
		marginBottom: 8,
	},
	cardActive: {
		borderLeftWidth: 3,
		borderLeftColor: '#3B82F6',
	},
	cardRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	bodyArea: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
	severityBadge: {
		borderRadius: 10,
		width: 28,
		height: 28,
		alignItems: 'center',
		justifyContent: 'center',
	},
	severityText: { fontSize: 13, fontWeight: '700', color: '#fff' },
	startedOn: { fontSize: 13, color: '#6B7280', marginTop: 4 },
	tapHint: { fontSize: 12, color: '#3B82F6', marginTop: 4 },
	emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	emptyText: { fontSize: 17, fontWeight: '600', color: '#111827' },
	emptySubtext: { fontSize: 14, color: '#6B7280', marginTop: 4 },
	fab: {
		position: 'absolute',
		right: 20,
		bottom: 28,
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: '#3B82F6',
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 4,
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
	},
	fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
});

export default InjuryList;
