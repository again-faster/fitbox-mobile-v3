import { Row, Text } from '@/components/atoms';
import { FlatList } from '@/components/molecules';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { PerformanceSummaryScreenProps } from '@/types/navigation';
import { ResultType } from '@/types/schemas/leaderboards';
import useStore from '@/zustand/Store';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import SimpleToast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useResultTypes } from './hooks/useResultTypes';

const ResultTypesModal = ({ navigation }: PerformanceSummaryScreenProps) => {
	const [searchQuery, setSearchQuery] = useState<string>('');

	const {
		data: resultTypeData,
		refreshing: refreshingResultTypes,
		isFetchingNextPage,
		onEndReached,
	} = useResultTypes(searchQuery);

	const { benchmarks, favorites } = useStore(s => ({
		benchmarks: s.benchmarks,
		favorites: s.favorites,
	}));

	const onTypePress = useCallback(
		(item: ResultType) => {
			switch (item.type) {
				case 'movements': {
					navigation.navigate('MovementHistory', {
						movementId: item.id,
						name: item.name,
						addResult: true,
					});
					break;
				}
				case 'favourites': {
					const sectionData = favorites.find(
						section => section.id === item.id,
					);

					if (!sectionData) {
						SimpleToast.show(
							'Favourite not found',
							SimpleToast.SHORT,
						);
						break;
					}

					navigation.navigate('WorkoutHistory', {
						data: sectionData,
						addResult: true,
					});
					break;
				}
				case 'benchmarks': {
					const sectionData = benchmarks.find(
						section => section.id === item.id,
					);

					if (!sectionData) {
						SimpleToast.show(
							'Section not found',
							SimpleToast.SHORT,
						);
						break;
					}

					navigation.navigate('WorkoutHistory', {
						data: sectionData,
						addResult: true,
					});
					break;
				}
				default: {
					SimpleToast.show('Coming soon!', SimpleToast.SHORT);
					break;
				}
			}
		},
		[navigation],
	);

	const getTypeIcon = (type: ResultType['type']) => {
		if (type === 'movements') return 'dumbbell';
		if (type === 'benchmarks') return 'trophy-outline';
		return 'star-outline';
	};

	const renderItem = ({ item }: { item: ResultType }) => (
		<Row
			spacing="space-between"
			style={styles.listItem}
			onPress={() => onTypePress(item)}
		>
			<View style={styles.typeIcon}>
				<Icon
					name={getTypeIcon(item.type)}
					size={20}
					color={memberTheme.colors.primary}
				/>
			</View>
			<View style={layout.flex_1}>
				<Text size="xs" transform="uppercase" style={styles.typeLabel}>
					{item.type.slice(0, -1)}
				</Text>
				<Text bold style={styles.typeName}>
					{item.name}
				</Text>
			</View>
			<Icon
				name="chevron-right"
				size={config.fonts.metrics.md}
				color={memberTheme.colors.primaryInk}
			/>
		</Row>
	);

	const keyExtractor = (item: ResultType) => `${item.id}`;

	return (
		<View style={[layout.flex_1, styles.screen]}>
			<View style={styles.searchBarContainer}>
				<Searchbar
					placeholder="Search Results"
					value={searchQuery}
					onChangeText={text => setSearchQuery(text)}
					style={styles.searchBar}
					inputStyle={styles.searchBarInput}
					placeholderTextColor={memberTheme.colors.textMuted}
					iconColor={memberTheme.colors.primaryInk}
					selectionColor={memberTheme.colors.primary}
					allowFontScaling={false}
				/>
			</View>

			<FlatList
				loading={refreshingResultTypes}
				data={resultTypeData?.data || []}
				renderItem={renderItem}
				extractor={keyExtractor}
				onEndReached={() => onEndReached()}
				onEndReachedThreshold={0.5}
				ListFooterComponent={
					<View style={{ paddingBottom: config.metrics.xl }}>
						{isFetchingNextPage && (
							<Text
								center
								color="gray200"
								style={{ marginTop: config.fonts.metrics.sm }}
							>
								Loading More...
							</Text>
						)}
					</View>
				}
				placeholder={
					!refreshingResultTypes ? (
						<View style={styles.emptyState}>
							<Icon
								name="magnify"
								size={32}
								color={memberTheme.colors.primary}
							/>
							<Text center bold style={styles.emptyTitle}>
								No result types found
							</Text>
							<Text center style={styles.emptyHint}>
								Try a different movement or workout name.
							</Text>
						</View>
					) : undefined
				}
			/>
		</View>
	);
};

export default ResultTypesModal;

const styles = StyleSheet.create({
	searchBarContainer: {
		margin: memberTheme.spacing.md,
		marginBottom: memberTheme.spacing.lg,
	},
	searchBar: {
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.pill,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: memberTheme.colors.border,
	},
	searchBarInput: {
		fontSize: config.fonts.metrics.rg,
		...layout.fontMontserratRegular,
	},
	listItem: {
		marginHorizontal: memberTheme.spacing.md,
		marginBottom: memberTheme.spacing.md,
		padding: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.md,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surface,
		...memberTheme.shadow,
	},
	screen: {
		backgroundColor: memberTheme.colors.background,
	},
	typeIcon: {
		width: 44,
		height: 44,
		marginRight: memberTheme.spacing.md,
		borderRadius: memberTheme.radius.sm,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	typeLabel: {
		color: memberTheme.colors.primaryInk,
	},
	typeName: {
		color: memberTheme.colors.text,
		marginTop: memberTheme.spacing.xs,
	},
	emptyState: {
		alignItems: 'center',
		margin: memberTheme.spacing.lg,
		padding: memberTheme.spacing.xl,
		borderRadius: memberTheme.radius.lg,
		backgroundColor: memberTheme.colors.surface,
	},
	emptyTitle: {
		color: memberTheme.colors.text,
		marginTop: memberTheme.spacing.md,
	},
	emptyHint: {
		color: memberTheme.colors.textMuted,
		marginTop: memberTheme.spacing.sm,
	},
});
