import { Row, Spacer, Text } from '@/components/atoms';
import { Loader } from '@/components/molecules';
import OneRMComponent from '@/components/molecules/WODPastPerformance/components/OneRMComponent';
import ScoreDisplayFormat from '@/components/molecules/WODPastPerformance/components/ScoreDisplayFormat';
import { config } from '@/theme/_config';
import layout from '@/theme/layout';
import { memberTheme } from '@/theme/member';
import { PastPerformanceResultType } from '@/types/schemas/leaderboards';
import BottomSheet, {
	BottomSheetScrollView,
	BottomSheetView,
	TouchableOpacity,
} from '@gorhom/bottom-sheet';
import { BottomSheetMethods } from '@gorhom/bottom-sheet/lib/typescript/types';
import moment from 'moment';
import { Dispatch, RefObject, SetStateAction } from 'react';
import { StyleSheet, View } from 'react-native';
import SimpleToast from 'react-native-simple-toast';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MovementHistoryBSProps {
	movements: PastPerformanceResultType[];
	sheetRef: RefObject<BottomSheetMethods>;
	sheetIndex: number;
	setSheetIndex: Dispatch<SetStateAction<number>>;
	movementName: string;
	oneRm: number;
	bottomOffset: number;
	isLoading: boolean;
}

const MovementHistoryBS = ({
	sheetRef,
	sheetIndex,
	setSheetIndex,
	movements,
	movementName,
	oneRm,
	bottomOffset,
	isLoading,
}: MovementHistoryBSProps) => {
	const renderMovements = () => {
		return movements.length ? (
			movements.map((data, i) => {
				return (
					<TouchableOpacity
						key={i}
						onPress={() =>
							SimpleToast.show(
								'Edit Score Coming Soon!',
								SimpleToast.SHORT,
							)
						}
						activeOpacity={0.9}
					>
						<Row
							spacing="space-between"
							style={{
								...styles.movementInfo,
								...(data.wod_score_id == null
									? memberTheme.shadow
									: null),
							}}
						>
							<View style={layout.flex_1}>
								<ScoreDisplayFormat data={data} />

								{data.notes !== '' && (
									<Text
										size="rg"
										color="darkgray"
										style={{
											marginTop: config.metrics.sm,
										}}
									>
										{data.notes}
									</Text>
								)}
							</View>

							<Spacer horizontal size="sm" />

							<Text size="rg" color="darkgray">
								{moment(data.date_input).format('DD MMM YYYY')}
							</Text>
						</Row>
					</TouchableOpacity>
				);
			})
		) : (
			<Text size="md" color="mute" center>
				No movement record yet
			</Text>
		);
	};

	const isSheetOpened = sheetIndex === 1;
	return (
		<BottomSheet
			ref={sheetRef}
			index={sheetIndex}
			snapPoints={[bottomOffset, '100%']}
			onChange={setSheetIndex}
			handleComponent={null}
			backgroundStyle={styles.bottomSheetContainer}
			enableContentPanningGesture={!isSheetOpened}
			enableDynamicSizing={false}
		>
			<BottomSheetView style={layout.flex_1}>
				<Row
					align="center"
					spacing="space-between"
					style={styles.sheetHeader}
				>
					<Text size="md" bold style={styles.sheetTitle}>
						{isSheetOpened ? movementName : 'History'}
					</Text>

					<Row
						align="center"
						onPress={() =>
							sheetRef.current?.snapToIndex(isSheetOpened ? 0 : 1)
						}
					>
						{isSheetOpened ? (
							<Icon
								name="plus"
								size={20}
								color={memberTheme.colors.primary}
							/>
						) : (
							<Icon
								name="chevron-up"
								size={20}
								color={memberTheme.colors.primary}
							/>
						)}
						<Text size="md" style={styles.actionText}>
							{isSheetOpened ? 'Add' : 'View Scores'}
						</Text>
					</Row>
				</Row>

				<BottomSheetScrollView>
					{oneRm ? <OneRMComponent weight={oneRm} /> : null}
					{renderMovements()}
				</BottomSheetScrollView>

				{isLoading ? (
					<View style={styles.loaderContainer}>
						<Loader size={config.metrics.xl} />
					</View>
				) : null}
			</BottomSheetView>
		</BottomSheet>
	);
};

export default MovementHistoryBS;

const styles = StyleSheet.create({
	movementInfo: {
		marginTop: memberTheme.spacing.sm,
		marginBottom: memberTheme.spacing.md,
		marginHorizontal: memberTheme.spacing.md,
		borderRadius: memberTheme.radius.md,
		padding: memberTheme.spacing.lg,
		backgroundColor: memberTheme.colors.surfaceSoft,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: memberTheme.colors.border,
	},
	bottomSheetContainer: {
		borderTopLeftRadius: memberTheme.radius.lg,
		borderTopRightRadius: memberTheme.radius.lg,
		borderTopWidth: 1,
		borderColor: memberTheme.colors.border,
		backgroundColor: memberTheme.colors.surface,
	},
	loaderContainer: {
		position: 'absolute',
		bottom: config.metrics.lg,
		left: 0,
		right: 0,
		top: 0,
		justifyContent: 'center',
		alignItems: 'center',
	},
	sheetHeader: {
		paddingHorizontal: memberTheme.spacing.lg,
		paddingVertical: memberTheme.spacing.lg,
		minHeight: 64,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: memberTheme.colors.border,
	},
	sheetTitle: {
		color: memberTheme.colors.text,
	},
	actionText: {
		color: memberTheme.colors.primary,
	},
});
