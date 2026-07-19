import { Button, Row, Text } from '@/components/atoms';
import { FlatList } from '@/components/molecules';
import { getPastPerformanceHistory } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { PerformanceSummaryScreenProps } from '@/types/navigation';
import { PastPerformanceHistoryType } from '@/types/schemas/leaderboards';
import { Func } from '@/utils';
import useStore from '@/zustand/Store';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import moment from 'moment';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
	ListRenderItemInfo,
	StyleSheet,
	TouchableOpacity,
	View,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import SimpleToast from 'react-native-simple-toast';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome5';

const PastPerformance = ({ navigation }: PerformanceSummaryScreenProps) => {
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState<string>('');

	const { benchmarks, favorites } = useStore(s => ({
		benchmarks: s.benchmarks,
		favorites: s.favorites,
	}));

	const renderBackButton = () => (
		<TouchableOpacity
			onPress={() => {
				navigation.reset({ index: 0, routes: [{ name: 'Menu' }] });
			}}
		>
			<FontAwesomeIcon
				name="arrow-left"
				size={config.metrics.lg}
				color="white"
				style={{
					paddingLeft: config.metrics.rg,
					paddingRight: config.metrics.md,
				}}
			/>
		</TouchableOpacity>
	);

	useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => renderBackButton(),
		});
	}, []);

	const {
		data,
		isFetching: refreshing,
		refetch,
		fetchNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ['getPastPerformanceHistory'],
		queryFn: ({ pageParam = 1 }) => {
			return getPastPerformanceHistory(searchQuery, pageParam);
		},
		staleTime: Infinity,
		initialPageParam: 1,
		getNextPageParam: (a, b) =>
			Func.getNextPageParam(a.end, b[0]?.totalResults),
		select: d => {
			const uniqueResults = Array.from(
				new Map(
					d.pages
						.flatMap(page => page.data)
						.filter(item => !!item.past_performance_id) // Exclude items with no id cause backend seems blank items
						.map(item => [item.past_performance_id, item]),
				),
			).map(([, item]) => item);

			return {
				data: uniqueResults,
				totalResults: d.pages[0]?.totalResults || 0,
			};
		},
	});

	useEffect(() => {
		const handler = debounce(() => {
			void handleRefresh();
		}, 500);

		handler();
		return () => handler.cancel();
	}, [searchQuery]);

	const onEndReached = () => {
		void fetchNextPage();
	};

	const handleRefresh = () => {
		// Manually reset the infinite query data
		void queryClient.removeQueries({
			queryKey: ['getPastPerformanceHistory'],
		});

		void refetch();
	};

	const onResultClick = (result: PastPerformanceHistoryType) => {
		if (!result.id) {
			throw new Error('Result is invalid');
		}

		switch (result.type) {
			case 'movement': {
				navigation.navigate('MovementHistory', {
					movementId: result.id, // Movement ID is required but we've already checked for it in select using filter see line 68
					name: result.displayName,
				});
				break;
			}
			case 'benchmark': {
				const sectionData = benchmarks.find(
					workout => workout.id === result.id,
				);

				if (!sectionData) {
					SimpleToast.show(
						'Benchmark not found, try again later',
						SimpleToast.SHORT,
					);
					break;
				}

				navigation.navigate('WorkoutHistory', {
					data: sectionData,
				});
				break;
			}
			case 'favorite': {
				const sectionData = favorites.find(
					workout => workout.id === result.id,
				);

				if (!sectionData) {
					SimpleToast.show(
						'Favorite not found, try again later',
						SimpleToast.SHORT,
					);
					break;
				}

				navigation.navigate('WorkoutHistory', {
					data: sectionData,
				});
				break;
			}
			// TODO: Add the following:
			// section
			// benchmark, section
			default:
				SimpleToast.show('Coming soon!', SimpleToast.SHORT);
				break;
		}
	};

	const renderItem = ({
		item,
	}: ListRenderItemInfo<PastPerformanceHistoryType>) => {
		// TODO: unfilter section if section is ready
		if (!item.id || item.type === 'section') {
			return null;
		}

		return (
			<Row
				spacing="space-between"
				style={styles.result}
				onPress={() => onResultClick(item)}
			>
				<View style={styles.resultIcon}>
					<FontAwesomeIcon
						name={item.type === 'movement' ? 'dumbbell' : 'trophy'}
						size={16}
						color={memberTheme.colors.primary}
					/>
				</View>
				<View style={layout.flex_1}>
					<Text
						size="xs"
						transform="uppercase"
						style={styles.resultType}
					>
						{item.type}
					</Text>
					<Text bold style={styles.resultName}>
						{item.displayName}
					</Text>
				</View>
				<View style={styles.resultMeta}>
					<Text size="sm" style={styles.resultDate}>
						{moment(item.date_input).format('DD MMM YYYY')}
					</Text>
					<FontAwesomeIcon
						name="chevron-right"
						size={12}
						color={memberTheme.colors.primaryInk}
					/>
				</View>
			</Row>
		);
	};

	const itemExtractor = (item: PastPerformanceHistoryType) =>
		`${item.past_performance_id}`;

	return (
		<View style={[layout.flex_1, styles.screen]}>
			<View style={styles.searchContainer}>
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

			<View style={styles.sectionHeader}>
				<Row spacing="space-between">
					<Text
						style={[layout.fontMontserratBold, styles.sectionTitle]}
					>
						Recent Results
					</Text>
					<Text style={styles.refreshText} onPress={handleRefresh}>
						Refresh
					</Text>
				</Row>
			</View>

			{data?.data.length === 0 ? (
				<View style={styles.noResultsFound}>
					<View style={styles.emptyIcon}>
						<FontAwesomeIcon
							name="chart-line"
							size={28}
							color={memberTheme.colors.primary}
						/>
					</View>
					<Text center size="lg" bold style={styles.emptyTitle}>
						No history found
					</Text>
					<Text center style={styles.emptyHint}>
						Your recorded workout and movement results will appear
						here.
					</Text>
					<Button
						title="Add New Result"
						style={styles.addBtnNoResults}
						onPress={() => navigation.navigate('ResultTypesModal')}
					/>
				</View>
			) : (
				<FlatList
					loading={refreshing}
					data={data?.data || []}
					renderItem={renderItem}
					extractor={itemExtractor}
					onEndReached={() => onEndReached()}
					onEndReachedThreshold={0.5}
					ListFooterComponent={
						<View style={{ paddingBottom: config.metrics.xl }}>
							{isFetchingNextPage && (
								<Text center color="gray200">
									Loading More...
								</Text>
							)}
						</View>
					}
				/>
			)}

			{data?.data.length !== 0 && (
				<Button
					title="Add New Result"
					style={styles.addBtn}
					onPress={() => navigation.navigate('ResultTypesModal')}
				/>
			)}
		</View>
	);
};

export default PastPerformance;

const styles = StyleSheet.create({
	searchBar: {
		backgroundColor: memberTheme.colors.surface,
		borderRadius: memberTheme.radius.pill,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: memberTheme.colors.border,
	},
	searchBarInput: {
		fontSize: config.fonts.metrics.md,
		...layout.fontMontserratRegular,
	},
	result: {
		padding: memberTheme.spacing.lg,
		borderRadius: memberTheme.radius.md,
		marginHorizontal: memberTheme.spacing.md,
		marginBottom: memberTheme.spacing.md,
		backgroundColor: memberTheme.colors.surface,
		borderColor: memberTheme.colors.border,
		borderWidth: StyleSheet.hairlineWidth,
		...memberTheme.shadow,
	},
	addBtn: {
		margin: memberTheme.spacing.md,
		backgroundColor: memberTheme.colors.primary,
		borderColor: memberTheme.colors.primary,
		borderRadius: memberTheme.radius.pill,
	},
	addBtnNoResults: {
		backgroundColor: memberTheme.colors.primary,
		borderColor: memberTheme.colors.primary,
		borderRadius: memberTheme.radius.pill,
		marginTop: memberTheme.spacing.xl,
		alignSelf: 'stretch',
	},
	noResultsFound: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		margin: memberTheme.spacing.lg,
		padding: memberTheme.spacing.xl,
		borderRadius: memberTheme.radius.lg,
		backgroundColor: memberTheme.colors.surface,
	},
	screen: {
		backgroundColor: memberTheme.colors.background,
	},
	searchContainer: {
		padding: memberTheme.spacing.md,
		backgroundColor: memberTheme.colors.background,
	},
	sectionHeader: {
		paddingHorizontal: memberTheme.spacing.lg,
		paddingVertical: memberTheme.spacing.sm,
	},
	sectionTitle: {
		color: memberTheme.colors.text,
	},
	refreshText: {
		color: memberTheme.colors.primary,
	},
	resultIcon: {
		width: 40,
		height: 40,
		marginRight: memberTheme.spacing.md,
		borderRadius: memberTheme.radius.sm,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	resultType: {
		color: memberTheme.colors.primaryInk,
	},
	resultName: {
		color: memberTheme.colors.text,
		marginTop: memberTheme.spacing.xs,
	},
	resultMeta: {
		alignItems: 'flex-end',
		gap: memberTheme.spacing.sm,
	},
	resultDate: {
		color: memberTheme.colors.textMuted,
	},
	emptyIcon: {
		width: 56,
		height: 56,
		borderRadius: memberTheme.radius.md,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: memberTheme.colors.surfaceSoft,
	},
	emptyTitle: {
		color: memberTheme.colors.text,
		marginTop: memberTheme.spacing.lg,
	},
	emptyHint: {
		color: memberTheme.colors.textMuted,
		marginTop: memberTheme.spacing.sm,
	},
});
