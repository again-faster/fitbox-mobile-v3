import { Button, Row, Text } from '@/components/atoms';
import { FlatList } from '@/components/molecules';
import { getPastPerformanceHistory } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { PerformanceSummaryScreenProps } from '@/types/navigation';
import { PastPerformanceHistoryType } from '@/types/schemas/leaderboards';
import { WorkoutSchemaType } from '@/types/schemas/session';
import { Func } from '@/utils';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { ListRenderItemInfo, StyleSheet, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import SimpleToast from 'react-native-simple-toast';
import { useWorkouts } from './components/ResultTypesModal/hooks/useWorkouts';

const PastPerformance = ({ navigation }: PerformanceSummaryScreenProps) => {
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState<string>('');

	const { data: workoutsData, isLoading: isLoadingWorkouts } = useWorkouts();

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
				const sectionData = workoutsData?.data.benchmark.find(
					workout => workout.id === result.id,
				);

				if (!sectionData) {
					SimpleToast.show(
						'Section not found, try again later',
						SimpleToast.SHORT,
					);
					break;
				}

				navigation.navigate('WorkoutHistory', {
					data: sectionData as WorkoutSchemaType,
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
		if (!item.id) {
			return null;
		}

		return (
			<Row
				spacing="space-between"
				style={styles.result}
				onPress={() => onResultClick(item)}
			>
				<View style={layout.flex_1}>
					<Text color="gray200" size="xs" transform="uppercase">
						{item.type}
					</Text>
					<Text>{item.displayName}</Text>
				</View>
				<Text size="sm">
					{moment(item.date_input).format('MMM DD, Y')}
				</Text>
			</Row>
		);
	};

	const itemExtractor = (item: PastPerformanceHistoryType) =>
		`${item.past_performance_id}`;

	return (
		<View style={layout.flex_1}>
			<View style={layout.shadowMedium}>
				<Searchbar
					placeholder="Search Results"
					value={searchQuery}
					onChangeText={text => setSearchQuery(text)}
					style={styles.searchBar}
					inputStyle={styles.searchBarInput}
					placeholderTextColor={config.fonts.colors.gray200}
				/>
			</View>

			<View style={{ padding: config.metrics.md }}>
				<Row spacing="space-between">
					<Text color="gray200" style={layout.fontMontserratBold}>
						Recent Results
					</Text>
					<Text color="info" onPress={handleRefresh}>
						Refresh
					</Text>
				</Row>
			</View>

			<FlatList
				loading={refreshing || isLoadingWorkouts}
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

			<Button
				title="Add New Result"
				variant="info"
				style={styles.addBtn}
				onPress={() => navigation.navigate('ResultTypesModal')}
			/>
		</View>
	);
};

export default PastPerformance;

const styles = StyleSheet.create({
	searchBar: {
		backgroundColor: config.fonts.colors.light,
		borderRadius: 0,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: config.fonts.colors.gray,
	},
	searchBarInput: {
		fontSize: config.fonts.metrics.md,
		...layout.fontMontserratRegular,
	},
	result: {
		...layout.shadowLight,
		padding: config.metrics.md,
		borderRadius: config.metrics.sm,
		marginHorizontal: config.metrics.md,
		marginBottom: config.metrics.rg,
	},
	addBtn: {
		borderRadius: 0,
	},
});
