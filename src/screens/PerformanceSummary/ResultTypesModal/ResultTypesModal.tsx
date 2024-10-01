import { Row, Text } from '@/components/atoms';
import { FlatList } from '@/components/molecules';
import { getResultTypes } from '@/services/users';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { PerformanceSummaryScreenProps } from '@/types/navigation';
import { ResultType } from '@/types/schemas/leaderboards';
import { Func } from '@/utils';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { debounce } from 'lodash';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import SimpleToast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ResultTypesModal = ({ navigation }: PerformanceSummaryScreenProps) => {
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState<string>('');
	const {
		data,
		isFetching: refreshing,
		refetch,
		fetchNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ['getResultTypes'],
		queryFn: ({ pageParam = 1 }) => getResultTypes(searchQuery, pageParam),
		staleTime: Infinity,
		initialPageParam: 1,
		getNextPageParam: (a, b) =>
			Func.getNextPageParam(a.end, b[0]?.totalResults),
		select: d => {
			const uniqueResults = Array.from(
				new Map(
					d.pages
						.flatMap(page => page.data)
						.filter(item => !!item.id) // Exclude items with no id cause backend seems blank items
						.map(item => [item.id, item]),
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
		if (isFetchingNextPage) return;
		void fetchNextPage();
	};

	const handleRefresh = () => {
		// Manually reset the infinite query data
		void queryClient.removeQueries({
			queryKey: ['getPastPerformanceHistory'],
		});

		void refetch();
	};

	const onTypePress = (item: ResultType) => {
		switch (item.type) {
			case 'movements':
				navigation.navigate('MovementHistory', {
					movementId: item.id,
					name: item.name,
					addResult: true,
				});
				break;
			default:
				SimpleToast.show('Coming soon!', SimpleToast.SHORT);
				break;
		}
	};

	const renderItem = ({ item }: { item: ResultType }) => (
		<Row
			spacing="space-between"
			style={styles.listItem}
			onPress={() => onTypePress(item)}
		>
			<View>
				<Text color="gray200" size="xs" transform="uppercase">
					{item.type.slice(0, -1)}
				</Text>
				<Text>{item.name}</Text>
			</View>
			<Icon
				name="plus"
				size={config.fonts.metrics.md}
				color={config.fonts.colors.info}
			/>
		</Row>
	);

	const keyExtractor = (item: ResultType) => `${item.id}`;

	return (
		<View style={layout.flex_1}>
			<View style={styles.searchBarContainer}>
				<Searchbar
					placeholder="Search Results"
					value={searchQuery}
					onChangeText={text => setSearchQuery(text)}
					style={styles.searchBar}
					inputStyle={styles.searchBarInput}
					placeholderTextColor={config.fonts.colors.gray200}
				/>
			</View>

			<FlatList
				loading={refreshing}
				data={data?.data || []}
				renderItem={renderItem}
				extractor={keyExtractor}
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
		</View>
	);
};

export default ResultTypesModal;

const styles = StyleSheet.create({
	searchBarContainer: {
		...layout.shadowMedium,
		margin: config.metrics.md,
		marginBottom: config.metrics.sm,
	},
	searchBar: {
		backgroundColor: config.fonts.colors.light,
		borderRadius: 0,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: config.fonts.colors.gray,
	},
	searchBarInput: {
		fontSize: config.fonts.metrics.rg,
		...layout.fontMontserratRegular,
	},
	listItem: {
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: config.fonts.colors.gray100,
		padding: 15,
	},
});
