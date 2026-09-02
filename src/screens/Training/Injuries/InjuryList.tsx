import { wsApi } from '@/services/workoutStudio/api';
import { getStoredWSSession } from '@/services/workoutStudio/auth';
import type { Injury } from '@/services/workoutStudio/types';
import { trainingTheme } from '@/theme/training';
import type { TrainingStackScreenProps } from '@/types/navigation';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import {
	ActivityIndicator,
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = TrainingStackScreenProps<'TrainingInjuryList'>;

type Section = {
	title: string;
	data: Injury[];
};

const SEVERITY_COLORS: Record<
	number,
	{ background: string; foreground: string }
> = {
	1: { background: trainingTheme.colors.successSoft, foreground: '#2E7D32' },
	2: { background: '#EFF8E7', foreground: '#5D8D2D' },
	3: { background: trainingTheme.colors.warningSoft, foreground: '#996800' },
	4: { background: '#FFF0EA', foreground: '#CF572A' },
	5: { background: '#FDECEC', foreground: trainingTheme.colors.danger },
};

const titleCase = (value: string) =>
	value
		.split(/[_\s-]+/)
		.filter(Boolean)
		.map(part => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');

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
	const active = injuries.filter(injury => injury.status === 'active');
	const resolved = injuries.filter(
		injury => injury.status === 'recovered' || injury.status === 'stopped',
	);
	const sections: Section[] = [];
	if (active.length > 0) sections.push({ title: 'Active', data: active });
	if (resolved.length > 0) {
		sections.push({ title: 'Resolved', data: resolved });
	}

	const openInjuryLog = () => navigation.navigate('TrainingInjuryLog');

	const header = (
		<>
			<View style={styles.pageHeader}>
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityLabel="Go back"
					style={styles.backButton}
					onPress={() => navigation.goBack()}
				>
					<Ionicons
						name="arrow-left"
						size={24}
						color={trainingTheme.colors.text}
					/>
				</TouchableOpacity>
				<View style={styles.headerCopy}>
					<Text style={styles.pageTitle}>My injuries</Text>
					<Text style={styles.pageSubtitle}>
						Track recovery and keep training safely.
					</Text>
				</View>
				<TouchableOpacity
					accessibilityRole="button"
					accessibilityLabel="Log a new injury"
					style={styles.addButton}
					onPress={openInjuryLog}
				>
					<Ionicons
						name="plus"
						size={27}
						color={trainingTheme.colors.primary}
					/>
				</TouchableOpacity>
			</View>

			{active.length > 0 && (
				<View style={styles.summaryCard}>
					<View style={styles.summaryIcon}>
						<Ionicons
							name="heart-pulse"
							size={28}
							color={trainingTheme.colors.primary}
						/>
					</View>
					<View style={styles.summaryCopy}>
						<Text style={styles.summaryEyebrow}>
							RECOVERY CHECK
						</Text>
						<Text style={styles.summaryTitle}>
							{active.length} active{' '}
							{active.length === 1 ? 'injury' : 'injuries'}
						</Text>
						<Text style={styles.summaryBody}>
							Daily updates help you and your coach adjust
							training.
						</Text>
					</View>
				</View>
			)}
		</>
	);

	const renderInjury = ({ item }: { item: Injury }) => {
		const isActive = item.status === 'active';
		const severity = SEVERITY_COLORS[item.initial_severity] ?? {
			background: trainingTheme.colors.surfaceMuted,
			foreground: trainingTheme.colors.textMuted,
		};
		const area = titleCase(item.body_area);
		const side = item.side !== 'na' ? titleCase(item.side) : null;

		const card = (
			<View style={styles.card}>
				<View style={styles.cardTopRow}>
					<View style={styles.injuryIcon}>
						<Ionicons
							name={isActive ? 'bandage' : 'check-circle-outline'}
							size={24}
							color={
								isActive
									? trainingTheme.colors.primary
									: trainingTheme.colors.success
							}
						/>
					</View>
					<View style={styles.cardCopy}>
						<Text style={styles.bodyArea}>
							{area}
							{side ? ` · ${side}` : ''}
						</Text>
						<Text style={styles.startedOn}>
							Started{' '}
							{moment(item.started_on).format('D MMM YYYY')}
						</Text>
					</View>
					<View
						accessibilityLabel={`Severity ${item.initial_severity} out of 5`}
						style={[
							styles.severityBadge,
							{ backgroundColor: severity.background },
						]}
					>
						<Text
							style={[
								styles.severityText,
								{ color: severity.foreground },
							]}
						>
							{item.initial_severity}/5
						</Text>
					</View>
				</View>

				{isActive && (
					<View style={styles.updateRow}>
						<Text style={styles.updateText}>
							Add today&apos;s update
						</Text>
						<Ionicons
							name="chevron-right"
							size={20}
							color={trainingTheme.colors.primary}
						/>
					</View>
				)}
			</View>
		);

		if (!isActive) return card;
		return (
			<TouchableOpacity
				accessibilityRole="button"
				accessibilityLabel={`Update ${area} injury`}
				onPress={() =>
					navigation.navigate('TrainingInjuryDailyUpdate', {
						injuryId: item.id,
						injuryBodyArea: item.body_area,
					})
				}
				activeOpacity={0.75}
			>
				{card}
			</TouchableOpacity>
		);
	};

	return (
		<SafeAreaView style={styles.screen} edges={['top']}>
			{query.isLoading && (
				<>
					{header}
					<View style={styles.stateContainer}>
						<View style={styles.stateIcon}>
							<ActivityIndicator
								size="large"
								color={trainingTheme.colors.primary}
							/>
						</View>
						<Text style={styles.stateTitle}>
							Loading your recovery
						</Text>
					</View>
				</>
			)}
			{!query.isLoading && query.isError && (
				<>
					{header}
					<View style={styles.stateContainer}>
						<View style={styles.stateIcon}>
							<Ionicons
								name="alert-circle-outline"
								size={36}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<Text style={styles.stateTitle}>
							Injuries couldn&apos;t load
						</Text>
						<Text style={styles.stateBody}>
							Check your connection and try again.
						</Text>
						<TouchableOpacity
							accessibilityRole="button"
							style={styles.retryButton}
							onPress={() => void query.refetch()}
						>
							<Text style={styles.retryText}>Try again</Text>
						</TouchableOpacity>
					</View>
				</>
			)}
			{!query.isLoading && !query.isError && injuries.length === 0 && (
				<>
					{header}
					<View style={styles.stateContainer}>
						<View style={styles.stateIcon}>
							<Ionicons
								name="shield-check-outline"
								size={38}
								color={trainingTheme.colors.primary}
							/>
						</View>
						<Text style={styles.stateTitle}>
							No injuries logged
						</Text>
						<Text style={styles.stateBody}>
							If something affects your training, log it here so
							your recovery stays visible.
						</Text>
						<TouchableOpacity
							accessibilityRole="button"
							style={styles.retryButton}
							onPress={openInjuryLog}
						>
							<Text style={styles.retryText}>Log an injury</Text>
						</TouchableOpacity>
					</View>
				</>
			)}
			{!query.isLoading && !query.isError && injuries.length > 0 && (
				<SectionList
					sections={sections}
					keyExtractor={item => item.id}
					ListHeaderComponent={header}
					contentContainerStyle={styles.listContent}
					showsVerticalScrollIndicator={false}
					stickySectionHeadersEnabled={false}
					refreshControl={
						<RefreshControl
							refreshing={query.isRefetching}
							tintColor={trainingTheme.colors.primary}
							colors={[trainingTheme.colors.primary]}
							onRefresh={() => void query.refetch()}
						/>
					}
					renderSectionHeader={({ section }) => (
						<View style={styles.sectionHeading}>
							<Text style={styles.sectionHeader}>
								{section.title}
							</Text>
							<Text style={styles.sectionCount}>
								{section.data.length}
							</Text>
						</View>
					)}
					renderItem={renderInjury}
				/>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: trainingTheme.colors.background },
	listContent: { paddingBottom: trainingTheme.spacing.xxl },
	pageHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: trainingTheme.spacing.lg,
		paddingTop: trainingTheme.spacing.md,
		paddingBottom: trainingTheme.spacing.lg,
		gap: trainingTheme.spacing.md,
	},
	backButton: {
		width: trainingTheme.touchTarget,
		height: trainingTheme.touchTarget,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.surface,
		borderWidth: 1,
		borderColor: trainingTheme.colors.border,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerCopy: { flex: 1 },
	pageTitle: {
		fontSize: 28,
		lineHeight: 34,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	pageSubtitle: {
		fontSize: 14,
		lineHeight: 20,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	addButton: {
		width: 48,
		height: 48,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	summaryCard: {
		marginHorizontal: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.xl,
		padding: trainingTheme.spacing.lg,
		borderRadius: trainingTheme.radius.lg,
		backgroundColor: trainingTheme.colors.primarySoft,
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
	},
	summaryIcon: {
		width: 54,
		height: 54,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.surface,
		alignItems: 'center',
		justifyContent: 'center',
	},
	summaryCopy: { flex: 1 },
	summaryEyebrow: {
		fontSize: 11,
		lineHeight: 15,
		fontWeight: '800',
		letterSpacing: 0.9,
		color: trainingTheme.colors.primary,
	},
	summaryTitle: {
		fontSize: 18,
		lineHeight: 24,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		marginTop: 2,
	},
	summaryBody: {
		fontSize: 13,
		lineHeight: 18,
		color: trainingTheme.colors.textMuted,
		marginTop: 2,
	},
	sectionHeading: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.md,
		gap: trainingTheme.spacing.sm,
	},
	sectionHeader: {
		fontSize: 20,
		lineHeight: 26,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	sectionCount: {
		minWidth: 26,
		height: 26,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.primarySoft,
		fontSize: 13,
		lineHeight: 26,
		fontWeight: '800',
		color: trainingTheme.colors.primary,
		textAlign: 'center',
	},
	card: {
		backgroundColor: trainingTheme.colors.surface,
		borderRadius: trainingTheme.radius.lg,
		padding: trainingTheme.spacing.lg,
		marginHorizontal: trainingTheme.spacing.lg,
		marginBottom: trainingTheme.spacing.md,
		...trainingTheme.shadow,
	},
	cardTopRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: trainingTheme.spacing.md,
	},
	injuryIcon: {
		width: 48,
		height: 48,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardCopy: { flex: 1 },
	bodyArea: {
		fontSize: 17,
		lineHeight: 22,
		fontWeight: '800',
		color: trainingTheme.colors.text,
	},
	startedOn: {
		fontSize: 13,
		lineHeight: 18,
		color: trainingTheme.colors.textMuted,
		marginTop: 3,
	},
	severityBadge: {
		minWidth: 48,
		height: 32,
		borderRadius: trainingTheme.radius.pill,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: trainingTheme.spacing.sm,
	},
	severityText: { fontSize: 13, fontWeight: '800' },
	updateRow: {
		minHeight: trainingTheme.touchTarget,
		borderTopWidth: 1,
		borderTopColor: trainingTheme.colors.border,
		marginTop: trainingTheme.spacing.lg,
		paddingTop: trainingTheme.spacing.md,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	updateText: {
		fontSize: 14,
		lineHeight: 20,
		fontWeight: '700',
		color: trainingTheme.colors.primary,
	},
	stateContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: trainingTheme.spacing.xxl,
		paddingBottom: 80,
	},
	stateIcon: {
		width: 84,
		height: 84,
		borderRadius: trainingTheme.radius.pill,
		backgroundColor: trainingTheme.colors.primarySoft,
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: trainingTheme.spacing.lg,
	},
	stateTitle: {
		fontSize: 21,
		lineHeight: 27,
		fontWeight: '800',
		color: trainingTheme.colors.text,
		textAlign: 'center',
	},
	stateBody: {
		fontSize: 15,
		lineHeight: 22,
		color: trainingTheme.colors.textMuted,
		textAlign: 'center',
		marginTop: trainingTheme.spacing.sm,
	},
	retryButton: {
		minHeight: 50,
		borderRadius: trainingTheme.radius.md,
		backgroundColor: trainingTheme.colors.primary,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: trainingTheme.spacing.xl,
		marginTop: trainingTheme.spacing.xl,
	},
	retryText: {
		fontSize: 15,
		fontWeight: '800',
		color: '#FFFFFF',
	},
});

export default InjuryList;
