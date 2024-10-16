import { Row, Text } from '@/components/atoms';
import { FlatList } from '@/components/molecules';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { PerformanceSummaryScreenProps } from '@/types/navigation';
import { ResultType } from '@/types/schemas/leaderboards';
import { WorkoutSchemaType } from '@/types/schemas/session';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar } from 'react-native-paper';
import SimpleToast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useResultTypes } from './hooks/useResultTypes';
import { useWorkouts } from './hooks/useWorkouts';

const ResultTypesModal = ({ navigation }: PerformanceSummaryScreenProps) => {
	const [searchQuery, setSearchQuery] = useState<string>('');

	const {
		data: resultTypeData,
		refreshing: refreshingResultTypes,
		isFetchingNextPage,
		onEndReached,
	} = useResultTypes(searchQuery);

	const { data: workoutsData, isLoading: isLoadingWorkouts } = useWorkouts();

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
					const sectionData = workoutsData?.data.favorite.find(
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
						data: sectionData as WorkoutSchemaType,
						addResult: true,
					});
					break;
				}
				case 'benchmarks': {
					const sectionData = workoutsData?.data.benchmark.find(
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
						data: sectionData as WorkoutSchemaType,
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
		[navigation, workoutsData],
	);

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
				loading={refreshingResultTypes || isLoadingWorkouts}
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
